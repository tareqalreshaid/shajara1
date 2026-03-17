from core.database import Base
from sqlalchemy import Column, Integer, String


class Comments(Base):
    __tablename__ = "comments"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    post_id = Column(Integer, nullable=False)
    user_id = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(String, nullable=False)