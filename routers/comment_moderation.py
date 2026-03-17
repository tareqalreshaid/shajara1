import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.comments import Comments
from models.comment_replies import Comment_replies
from models.user_profiles import User_profiles
from schemas.auth import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin/moderation", tags=["admin-moderation"])


class EditCommentRequest(BaseModel):
    content: str


async def check_admin_role(current_user: UserResponse, db: AsyncSession):
    """Check if user has admin role"""
    result = await db.execute(
        select(User_profiles).where(User_profiles.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile or profile.role != "admin":
        raise HTTPException(status_code=403, detail="Access Denied: Admin privileges required")


@router.put("/comments/{comment_id}")
async def edit_comment(
    comment_id: int,
    data: EditCommentRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edit a comment (admin only)"""
    await check_admin_role(current_user, db)

    try:
        result = await db.execute(
            select(Comments).where(Comments.id == comment_id)
        )
        comment = result.scalar_one_or_none()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        await db.execute(
            update(Comments)
            .where(Comments.id == comment_id)
            .values(content=data.content)
        )
        await db.commit()

        logger.info(f"[admin] Comment {comment_id} edited by admin {current_user.id}")
        return {"message": "Comment updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error editing comment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to edit comment: {str(e)}")


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a comment and all its replies (admin only)"""
    await check_admin_role(current_user, db)

    try:
        result = await db.execute(
            select(Comments).where(Comments.id == comment_id)
        )
        comment = result.scalar_one_or_none()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        # Delete all replies to this comment first
        await db.execute(
            delete(Comment_replies).where(Comment_replies.comment_id == comment_id)
        )

        # Delete the comment
        await db.execute(
            delete(Comments).where(Comments.id == comment_id)
        )
        await db.commit()

        logger.info(f"[admin] Comment {comment_id} deleted by admin {current_user.id}")
        return {"message": "Comment deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting comment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete comment: {str(e)}")


@router.put("/replies/{reply_id}")
async def edit_reply(
    reply_id: int,
    data: EditCommentRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edit a reply (admin only)"""
    await check_admin_role(current_user, db)

    try:
        result = await db.execute(
            select(Comment_replies).where(Comment_replies.id == reply_id)
        )
        reply = result.scalar_one_or_none()
        if not reply:
            raise HTTPException(status_code=404, detail="Reply not found")

        await db.execute(
            update(Comment_replies)
            .where(Comment_replies.id == reply_id)
            .values(content=data.content)
        )
        await db.commit()

        logger.info(f"[admin] Reply {reply_id} edited by admin {current_user.id}")
        return {"message": "Reply updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error editing reply: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to edit reply: {str(e)}")


@router.delete("/replies/{reply_id}")
async def delete_reply(
    reply_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a reply (admin only)"""
    await check_admin_role(current_user, db)

    try:
        result = await db.execute(
            select(Comment_replies).where(Comment_replies.id == reply_id)
        )
        reply = result.scalar_one_or_none()
        if not reply:
            raise HTTPException(status_code=404, detail="Reply not found")

        await db.execute(
            delete(Comment_replies).where(Comment_replies.id == reply_id)
        )
        await db.commit()

        logger.info(f"[admin] Reply {reply_id} deleted by admin {current_user.id}")
        return {"message": "Reply deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting reply: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete reply: {str(e)}")