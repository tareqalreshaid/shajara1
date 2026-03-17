from core.database import Base
from sqlalchemy import Column, Integer, String


class Comment_replies(Base):
    __tablename__ = "comment_replies"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    comment_id = Column(Integer, nullable=False)
    post_id = Column(Integer, nullable=False)
    user_id = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(String, nullable=False)