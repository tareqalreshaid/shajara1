from core.database import Base
from sqlalchemy import Column, Integer, String


class Submissions(Base):
    __tablename__ = "submissions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    challenge_id = Column(Integer, nullable=False)
    image_url = Column(String, nullable=True)  # Fixed: nullable so submissions without image are allowed
    status = Column(String, nullable=False)
    submitted_at = Column(String, nullable=False)
    reviewed_at = Column(String, nullable=True)
    admin_note = Column(String, nullable=True)