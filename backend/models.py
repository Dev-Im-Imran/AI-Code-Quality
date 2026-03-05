from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())

    submissions = relationship("Submission", back_populates="user")

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for now to support legacy/Google SSO
    code = Column(Text)
    language = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    user = relationship("User", back_populates="submissions")
    results = relationship("AnalysisResult", back_populates="submission")

class AnalysisResult(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"))
    complexity = Column(String)
    score = Column(Integer)
    hint = Column(Text)
    explanation = Column(Text)
    pattern = Column(String)
    
    submission = relationship("Submission", back_populates="results")
    issues = relationship("IssueDetected", back_populates="result")

class IssueDetected(Base):
    __tablename__ = "issues_detected"
    id = Column(Integer, primary_key=True)
    result_id = Column(Integer, ForeignKey("results.id"))
    description = Column(String)
    
    result = relationship("AnalysisResult", back_populates="issues")