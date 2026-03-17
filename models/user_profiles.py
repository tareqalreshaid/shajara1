from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class User_profiles(Base):
    __tablename__ = "user_profiles"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    name = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    total_points = Column(Integer, nullable=True)
    challenges_completed = Column(Integer, nullable=True)
    badges = Column(String, nullable=True)
    role = Column(String, nullable=True)
    theme = Column(String, nullable=True)
    avatar_animal = Column(String, nullable=True)
    avatar_color = Column(String, nullable=True)
    avatar_accessory = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)