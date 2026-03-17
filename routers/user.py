import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.user_profiles import User_profiles
from schemas.auth import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/user", tags=["user"])


class ProfilePhotoRequest(BaseModel):
    image_url: str


class ProfilePhotoResponse(BaseModel):
    """Response for profile photo update"""
    profile_picture: str
    message: str


@router.put("/profile-photo")
async def update_profile_photo(
    data: ProfilePhotoRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user's profile photo

    The frontend should:
    1. Upload image to storage bucket
    2. Get the download URL
    3. Call this endpoint with the URL
    """

    try:
        # Get user profile
        result = await db.execute(
            select(User_profiles).where(User_profiles.user_id == current_user.id)
        )
        profile = result.scalar_one_or_none()

        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")

        # Update profile picture
        await db.execute(
            update(User_profiles)
            .where(User_profiles.user_id == current_user.id)
            .values(
                profile_picture=data.image_url,
                updated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
        )

        await db.commit()

        logger.info(f"Updated profile photo for user {current_user.id}")

        return ProfilePhotoResponse(
            profile_picture=data.image_url,
            message="Profile photo updated successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating profile photo: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update profile photo: {str(e)}")


@router.get("/badges")
async def get_user_badges(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's badges"""

    try:
        result = await db.execute(
            select(User_profiles).where(User_profiles.user_id == current_user.id)
        )
        profile = result.scalar_one_or_none()

        if not profile:
            return {"badges": []}

        badges = []
        if profile.badges:
            import json
            try:
                badges = json.loads(profile.badges)
            except Exception:
                badges = []

        return {"badges": badges}

    except Exception as e:
        logger.error(f"Error fetching badges: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch badges: {str(e)}")


@router.get("/me")
async def get_current_user_info(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user info including role from database"""

    try:
        result = await db.execute(
            select(User_profiles).where(User_profiles.user_id == current_user.id)
        )
        profile = result.scalar_one_or_none()

        return {
            "user_id": current_user.id,
            "email": current_user.email,
            "name": profile.name if profile else current_user.name,
            "role": profile.role if profile else "user",
            "profile_picture": profile.profile_picture if profile else None,
            "total_points": profile.total_points if profile else 0,
        }

    except Exception as e:
        logger.error(f"Error fetching user info: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch user info: {str(e)}")