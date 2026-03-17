from core.database import Base
from sqlalchemy import Column, Integer, String


class Challenges(Base):
    __tablename__ = "challenges"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    points = Column(Integer, nullable=False)
    challenge_type = Column(String, nullable=False)
    created_at = Column(String, nullable=False)