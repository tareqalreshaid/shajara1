import logging
import os
from typing import Optional
from urllib.parse import urlencode

import httpx
from core.auth import (
    IDTokenValidationError,
    build_authorization_url,
    build_logout_url,
    generate_code_challenge,
    generate_code_verifier,
    generate_nonce,
    generate_state,
    validate_id_token,
)
from core.config import settings
from core.database import get_db
from dependencies.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from models.auth import User
from schemas.auth import (
    PlatformTokenExchangeRequest,
    TokenExchangeResponse,
    UserResponse,
)
from services.auth import AuthService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])
logger = logging.getLogger(__name__)


def _local_patch(url: str) -> str:
    """Patch URL for local development."""
    if os.getenv("LOCAL_PATCH", "").lower() not in ("true", "1"):
        return url

    patched_url = url.replace("https://", "http://").replace(":8000", ":3000")
    logger.debug("[get_dynamic_backend_url] patching URL from %s to %s", url, patched_url)
    return patched_url


def get_dynamic_backend_url(request: Request) -> str:
    """Get backend URL dynamically from request headers."""
    mgx_external_domain = request.headers.get("mgx-external-domain")
    x_forwarded_host = request.headers.get("x-forwarded-host")
    host = request.headers.get("host")
    scheme = request.headers.get("x-forwarded-proto", "https")

    effective_host = mgx_external_domain or x_forwarded_host or host
    if not effective_host:
        logger.warning("[get_dynamic_backend_url] No host found, fallback to %s", settings.backend_url)
        return settings.backend_url

    dynamic_url = _local_patch(f"{scheme}://{effective_host}")
    return dynamic_url


def derive_name_from_email(email: str) -> str:
    return email.split("@", 1)[0] if email else ""


@router.get("/login")
async def login(request: Request, db: AsyncSession = Depends(get_db)):
    """Start OIDC login flow with PKCE."""
    state = generate_state()
    nonce = generate_nonce()
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)

    auth_service = AuthService(db)
    await auth_service.store_oidc_state(state, nonce, code_verifier)

    backend_url = get_dynamic_backend_url(request)
    redirect_uri = f"{backend_url}/api/v1/auth/callback"
    logger.info("[login] Starting OIDC flow with redirect_uri=%s", redirect_uri)

    auth_url = build_authorization_url(state, nonce, code_challenge, redirect_uri=redirect_uri)
    return RedirectResponse(
        url=auth_url,
        status_code=status.HTTP_302_FOUND,
        headers={"X-Request-ID": state},
    )


@router.get("/callback")
async def callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle OIDC callback."""
    backend_url = get_dynamic_backend_url(request)

    def redirect_with_error(message: str) -> RedirectResponse:
        fragment = urlencode({"msg": message})
        return RedirectResponse(
            url=f"{backend_url}/auth/error?{fragment}",
            status_code=status.HTTP_302_FOUND,
        )

    if error:
        return redirect_with_error(f"OIDC error: {error}")

    if not code or not state:
        return redirect_with_error("Missing code or state parameter")

    auth_service = AuthService(db)
    temp_data = await auth_service.get_and_delete_oidc_state(state)
    if not temp_data:
        return redirect_with_error("Invalid or expired state parameter")

    nonce = temp_data["nonce"]
    code_verifier = temp_data.get("code_verifier")

    try:
        redirect_uri = f"{backend_url}/api/v1/auth/callback"
        logger.info("[callback] Exchanging code for tokens with redirect_uri=%s", redirect_uri)

        token_data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": settings.oidc_client_id,
            "client_secret": settings.oidc_client_secret,
        }

        if code_verifier:
            token_data["code_verifier"] = code_verifier

        token_url = f"{settings.oidc_issuer_url}/token"
        try:
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    token_url,
                    data=token_data,
                    headers={"Content-Type": "application/x-www-form-urlencoded", "X-Request-ID": state},
                )
        except httpx.HTTPError as e:
            logger.error("[callback] Token exchange HTTP error: %s", str(e), exc_info=True)
            return redirect_with_error(f"Token exchange failed: {e}")

        if token_response.status_code != 200:
            logger.error("[callback] Token exchange failed: status=%s", token_response.status_code)
            return redirect_with_error(f"Token exchange failed: {token_response.text}")

        tokens = token_response.json()

        id_token = tokens.get("id_token")
        if not id_token:
            return redirect_with_error("No ID token received")

        id_claims = await validate_id_token(id_token)

        if id_claims.get("nonce") != nonce:
            return redirect_with_error("Invalid nonce")

        email = id_claims.get("email", "")
        name = id_claims.get("name") or derive_name_from_email(email)
        user = await auth_service.get_or_create_user(platform_sub=id_claims["sub"], email=email, name=name)

        app_token, expires_at, _ = await auth_service.issue_app_token(user=user)

        fragment = urlencode(
            {
                "token": app_token,
                "expires_at": int(expires_at.timestamp()),
                "token_type": "Bearer",
            }
        )

        redirect_url = f"{backend_url}/auth/callback?{fragment}"
        logger.info("[callback] OIDC callback successful, redirecting to %s", redirect_url)
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)

    except IDTokenValidationError as e:
        return redirect_with_error(f"Authentication failed: {e.message}")
    except HTTPException as e:
        return redirect_with_error(str(e.detail))
    except Exception as e:
        logger.exception(f"Unexpected error in OIDC callback: {e}")
        return redirect_with_error("Authentication processing failed. Please try again.")


async def _verify_platform_token(payload: PlatformTokenExchangeRequest) -> dict:
    """Shared helper: verify a platform token and return the payload data.

    Returns a dict with at least 'user_id', 'email', 'name'/'username'.
    Raises HTTPException on any failure.
    """
    verify_url = f"{settings.oidc_issuer_url}/platform/tokens/verify"

    try:
        async with httpx.AsyncClient() as client:
            verify_response = await client.post(
                verify_url,
                json={"platform_token": payload.platform_token},
                headers={"Content-Type": "application/json"},
            )
    except httpx.HTTPError as exc:
        logger.error(f"[token/exchange] HTTP error verifying platform token: {exc}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to verify platform token") from exc

    try:
        verify_body = verify_response.json()
    except ValueError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid response from platform token verification service")

    if not isinstance(verify_body, dict):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unexpected response from platform token verification service")

    if verify_response.status_code != status.HTTP_200_OK or not verify_body.get("success"):
        message = verify_body.get("message", "") if isinstance(verify_body, dict) else ""
        logger.warning(f"[token/exchange] Token verification failed: {message}")
        raise HTTPException(
            status_code=verify_response.status_code or status.HTTP_401_UNAUTHORIZED,
            detail=message or "Platform token verification failed",
        )

    payload_data = verify_body.get("data") or {}
    raw_user_id = payload_data.get("user_id")

    if not raw_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Platform token payload missing user_id")

    return payload_data


@router.post("/token/exchange", response_model=TokenExchangeResponse)
async def exchange_platform_token(
    payload: PlatformTokenExchangeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Exchange Platform token for app token — open to ALL authenticated users.

    The SDK's iframe frame mechanism calls this endpoint automatically when
    the app runs inside the App Viewer. Previously this was admin-only, which
    caused non-admin users to get a 403 and never receive a backend JWT.
    Now it works for every user: verifies the platform token, creates the user
    in the DB if needed, and returns a backend-signed JWT.
    """
    logger.info("[token/exchange] Received platform token exchange request")

    payload_data = await _verify_platform_token(payload)

    platform_user_id = str(payload_data["user_id"])
    email = payload_data.get("email", "")
    name = payload_data.get("name") or payload_data.get("username") or derive_name_from_email(email)

    logger.info(f"[token/exchange] Verified user: id={platform_user_id}, email={email}")

    # Get or create user in DB so they appear in the users table
    auth_service = AuthService(db)
    user = await auth_service.get_or_create_user(platform_sub=platform_user_id, email=email, name=name)

    # Ensure admin user keeps admin role
    if platform_user_id == str(getattr(settings, "admin_user_id", "")):
        user.role = "admin"
        await db.commit()
        await db.refresh(user)

    # Issue backend-signed JWT
    app_token, expires_at, _ = await auth_service.issue_app_token(user=user)

    logger.info(f"[token/exchange] Backend token issued for user_id={platform_user_id}, role={user.role}, expires_at={expires_at}")

    return TokenExchangeResponse(token=app_token)


@router.post("/token/exchange/user", response_model=TokenExchangeResponse)
async def exchange_platform_token_for_user(
    payload: PlatformTokenExchangeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Exchange Platform token for app token - open to ALL authenticated users.

    This endpoint allows any user who has a valid platform token (from client.auth.me())
    to get a backend-signed JWT that can be used with all backend API endpoints.
    """
    logger.info("[token/exchange/user] Received platform token exchange request")

    payload_data = await _verify_platform_token(payload)

    platform_user_id = str(payload_data["user_id"])
    email = payload_data.get("email", "")
    name = payload_data.get("name") or payload_data.get("username") or derive_name_from_email(email)

    logger.info(f"[token/exchange/user] Verified user: id={platform_user_id}, email={email}")

    # Get or create user in DB so they appear in the users table
    auth_service = AuthService(db)
    user = await auth_service.get_or_create_user(platform_sub=platform_user_id, email=email, name=name)

    # Ensure admin user keeps admin role
    if platform_user_id == str(getattr(settings, "admin_user_id", "")):
        user.role = "admin"
        await db.commit()
        await db.refresh(user)

    # Issue backend-signed JWT
    app_token, expires_at, _ = await auth_service.issue_app_token(user=user)

    logger.info(f"[token/exchange/user] Backend token issued for user_id={platform_user_id}, expires_at={expires_at}")

    return TokenExchangeResponse(token=app_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Get current user info."""
    return current_user


@router.get("/logout")
async def logout():
    """Logout user."""
    logout_url = build_logout_url()
    return {"redirect_url": logout_url}