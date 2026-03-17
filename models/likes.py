from core.database import Base
from sqlalchemy import Column, Integer, String


class Likes(Base):
    __tablename__ = "likes"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    post_id = Column(Integer, nullable=False)
    created_at = Column(String, nullable=False)