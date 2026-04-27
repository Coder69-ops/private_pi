from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class ScanTask(Base):
    __tablename__ = "scan_tasks"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True, nullable=True) # Added for multi-tenancy
    target = Column(String, index=True)
    scan_type = Column(String)
    status = Column(String, default="PENDING") # PENDING, RUNNING, COMPLETED, FAILED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # New fields for Advanced Analysis and Reports
    screenshot_paths = Column(JSON, nullable=True) # {"desktop": path, "mobile": path}
    ai_summary = Column(JSON, nullable=True)
    risk_score = Column(String, nullable=True)
    pdf_report_path = Column(String, nullable=True)

    results = relationship("ScanResult", back_populates="task")

class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("scan_tasks.id"))
    tool_name = Column(String)
    result = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    task = relationship("ScanTask", back_populates="results")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    target = Column(String, index=True)
    email = Column(String) # For notifications
    frequency = Column(String, default="daily") # daily, weekly
    last_scan_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserSettings(Base):
    __tablename__ = "user_settings"
    
    user_id = Column(String, primary_key=True, index=True) # Linked to Firebase UID
    shodan_api_key = Column(String, nullable=True)
    hibp_api_key = Column(String, nullable=True)
    openrouter_api_key = Column(String, nullable=True)
    openrouter_model = Column(String, default="google/gemini-pro") 
    stealth_mode = Column(Integer, default=0) # 0=False, 1=True (Using integer for sqlite/pg compat if needed, but bool works in pg)
    auto_pdf_report = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
