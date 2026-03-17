import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.challenges import Challenges

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class ChallengesService:
    """Service layer for Challenges operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Challenges]:
        """Create a new challenges"""
        try:
            obj = Challenges(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created challenges with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating challenges: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Challenges]:
        """Get challenges by ID"""
        try:
            query = select(Challenges).where(Challenges.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching challenges {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of challengess"""
        try:
            query = select(Challenges)
            count_query = select(func.count(Challenges.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Challenges, field):
                        query = query.where(getattr(Challenges, field) == value)
                        count_query = count_query.where(getattr(Challenges, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Challenges, field_name):
                        query = query.order_by(getattr(Challenges, field_name).desc())
                else:
                    if hasattr(Challenges, sort):
                        query = query.order_by(getattr(Challenges, sort))
            else:
                query = query.order_by(Challenges.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching challenges list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Challenges]:
        """Update challenges"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Challenges {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated challenges {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating challenges {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete challenges"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Challenges {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted challenges {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting challenges {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Challenges]:
        """Get challenges by any field"""
        try:
            if not hasattr(Challenges, field_name):
                raise ValueError(f"Field {field_name} does not exist on Challenges")
            result = await self.db.execute(
                select(Challenges).where(getattr(Challenges, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching challenges by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Challenges]:
        """Get list of challengess filtered by field"""
        try:
            if not hasattr(Challenges, field_name):
                raise ValueError(f"Field {field_name} does not exist on Challenges")
            result = await self.db.execute(
                select(Challenges)
                .where(getattr(Challenges, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Challenges.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching challengess by {field_name}: {str(e)}")
            raise