from core.database import Base
from sqlalchemy import Column, Integer, String


class Community_activities(Base):
    __tablename__ = "community_activities"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    suggested_points = Column(Integer, nullable=False)
    approved_points = Column(Integer, nullable=True)
    category = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    status = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
    reviewed_at = Column(String, nullable=True)
    admin_note = Column(String, nullable=True)