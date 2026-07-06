from sqlalchemy import Column, String, Text, JSON
from app.core.db import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(JSON, nullable=False)  # Stores list of skills/requirements as JSON array


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(255), nullable=True)
    skills = Column(JSON, nullable=False)        # List of identified skills
    experience = Column(JSON, nullable=False)    # List of experience highlights
    github_username = Column(String(255), nullable=True)
    parsed_text = Column(Text, nullable=False)   # Full parsed resume text
    github_data = Column(JSON, nullable=True)    # Serialized github stats dictionary
