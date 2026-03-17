import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.comment_likes import Comment_likes

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Comment_likesService:
    """Service layer for Comment_likes operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Comment_likes]:
        """Create a new comment_likes"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Comment_likes(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created comment_likes with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating comment_likes: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for comment_likes {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Comment_likes]:
        """Get comment_likes by ID (user can only see their own records)"""
        try:
            query = select(Comment_likes).where(Comment_likes.id == obj_id)
            if user_id:
                query = query.where(Comment_likes.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching comment_likes {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of comment_likess (user can only see their own records)"""
        try:
            query = select(Comment_likes)
            count_query = select(func.count(Comment_likes.id))
            
            if user_id:
                query = query.where(Comment_likes.user_id == user_id)
                count_query = count_query.where(Comment_likes.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Comment_likes, field):
                        query = query.where(getattr(Comment_likes, field) == value)
                        count_query = count_query.where(getattr(Comment_likes, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Comment_likes, field_name):
                        query = query.order_by(getattr(Comment_likes, field_name).desc())
                else:
                    if hasattr(Comment_likes, sort):
                        query = query.order_by(getattr(Comment_likes, sort))
            else:
                query = query.order_by(Comment_likes.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching comment_likes list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Comment_likes]:
        """Update comment_likes (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Comment_likes {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated comment_likes {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating comment_likes {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete comment_likes (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Comment_likes {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted comment_likes {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting comment_likes {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Comment_likes]:
        """Get comment_likes by any field"""
        try:
            if not hasattr(Comment_likes, field_name):
                raise ValueError(f"Field {field_name} does not exist on Comment_likes")
            result = await self.db.execute(
                select(Comment_likes).where(getattr(Comment_likes, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching comment_likes by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Comment_likes]:
        """Get list of comment_likess filtered by field"""
        try:
            if not hasattr(Comment_likes, field_name):
                raise ValueError(f"Field {field_name} does not exist on Comment_likes")
            result = await self.db.execute(
                select(Comment_likes)
                .where(getattr(Comment_likes, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Comment_likes.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching comment_likess by {field_name}: {str(e)}")
            raise