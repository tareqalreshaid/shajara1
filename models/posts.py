from core.database import Base
from sqlalchemy import Column, Integer, String


class Posts(Base):
    __tablename__ = "posts"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    content = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    image_urls = Column(String, nullable=True)
    location = Column(String, nullable=True)
    category = Column(String, nullable=True)
    like_count = Column(Integer, nullable=True)
    created_at = Column(String, nullable=False)