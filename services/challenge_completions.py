import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.challenge_completions import Challenge_completions

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Challenge_completionsService:
    """Service layer for Challenge_completions operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Challenge_completions]:
        """Create a new challenge_completions"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Challenge_completions(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created challenge_completions with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating challenge_completions: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for challenge_completions {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Challenge_completions]:
        """Get challenge_completions by ID (user can only see their own records)"""
        try:
            query = select(Challenge_completions).where(Challenge_completions.id == obj_id)
            if user_id:
                query = query.where(Challenge_completions.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching challenge_completions {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of challenge_completionss (user can only see their own records)"""
        try:
            query = select(Challenge_completions)
            count_query = select(func.count(Challenge_completions.id))
            
            if user_id:
                query = query.where(Challenge_completions.user_id == user_id)
                count_query = count_query.where(Challenge_completions.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Challenge_completions, field):
                        query = query.where(getattr(Challenge_completions, field) == value)
                        count_query = count_query.where(getattr(Challenge_completions, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Challenge_completions, field_name):
                        query = query.order_by(getattr(Challenge_completions, field_name).desc())
                else:
                    if hasattr(Challenge_completions, sort):
                        query = query.order_by(getattr(Challenge_completions, sort))
            else:
                query = query.order_by(Challenge_completions.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching challenge_completions list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Challenge_completions]:
        """Update challenge_completions (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Challenge_completions {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated challenge_completions {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating challenge_completions {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete challenge_completions (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Challenge_completions {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted challenge_completions {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting challenge_completions {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Challenge_completions]:
        """Get challenge_completions by any field"""
        try:
            if not hasattr(Challenge_completions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Challenge_completions")
            result = await self.db.execute(
                select(Challenge_completions).where(getattr(Challenge_completions, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching challenge_completions by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Challenge_completions]:
        """Get list of challenge_completionss filtered by field"""
        try:
            if not hasattr(Challenge_completions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Challenge_completions")
            result = await self.db.execute(
                select(Challenge_completions)
                .where(getattr(Challenge_completions, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Challenge_completions.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching challenge_completionss by {field_name}: {str(e)}")
            raise