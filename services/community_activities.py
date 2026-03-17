import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.community_activities import Community_activities

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Community_activitiesService:
    """Service layer for Community_activities operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Community_activities]:
        """Create a new community_activities"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Community_activities(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created community_activities with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating community_activities: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for community_activities {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Community_activities]:
        """Get community_activities by ID (user can only see their own records)"""
        try:
            query = select(Community_activities).where(Community_activities.id == obj_id)
            if user_id:
                query = query.where(Community_activities.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching community_activities {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of community_activitiess (user can only see their own records)"""
        try:
            query = select(Community_activities)
            count_query = select(func.count(Community_activities.id))
            
            if user_id:
                query = query.where(Community_activities.user_id == user_id)
                count_query = count_query.where(Community_activities.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Community_activities, field):
                        query = query.where(getattr(Community_activities, field) == value)
                        count_query = count_query.where(getattr(Community_activities, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Community_activities, field_name):
                        query = query.order_by(getattr(Community_activities, field_name).desc())
                else:
                    if hasattr(Community_activities, sort):
                        query = query.order_by(getattr(Community_activities, sort))
            else:
                query = query.order_by(Community_activities.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching community_activities list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Community_activities]:
        """Update community_activities (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Community_activities {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated community_activities {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating community_activities {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete community_activities (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Community_activities {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted community_activities {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting community_activities {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Community_activities]:
        """Get community_activities by any field"""
        try:
            if not hasattr(Community_activities, field_name):
                raise ValueError(f"Field {field_name} does not exist on Community_activities")
            result = await self.db.execute(
                select(Community_activities).where(getattr(Community_activities, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching community_activities by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Community_activities]:
        """Get list of community_activitiess filtered by field"""
        try:
            if not hasattr(Community_activities, field_name):
                raise ValueError(f"Field {field_name} does not exist on Community_activities")
            result = await self.db.execute(
                select(Community_activities)
                .where(getattr(Community_activities, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Community_activities.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching community_activitiess by {field_name}: {str(e)}")
            raise