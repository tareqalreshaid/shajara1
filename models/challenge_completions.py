from core.database import Base
from sqlalchemy import Column, Integer, String


class Challenge_completions(Base):
    __tablename__ = "challenge_completions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    challenge_id = Column(Integer, nullable=False)
    completed_at = Column(String, nullable=False)