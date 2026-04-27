from pydantic import BaseModel, HttpUrl, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re

class ScanRequest(BaseModel):
    target: str 
    scan_type: str = "full" # full, custom, port, user, tech, sub
    modules: List[str] = [] # Used when scan_type is 'custom'
    
    # Ethical guardrails
    has_permission: bool = False

    @validator('target')
    def validate_target(cls, v):
        if not v:
            raise ValueError('Target cannot be empty')
        
        # Strict Regex for Hostname (RFC 1123) or IP Address
        # Allows: example.com, sub.example.co.uk, 192.168.1.1, localhost
        # Disallows: ; & | > < space
        # Pattern: (Letter/Digit/Hyphen .)+ Letter/Digit
        regex = r'^[a-zA-Z0-9.-]+$'
        
        if not re.match(regex, v):
             raise ValueError('Invalid target format. Only alphanumeric characters, dots, and hyphens are allowed.')
        
        if ".." in v or v.startswith("-") or v.endswith("-"):
             raise ValueError('Invalid target format.')
             
        return v

class ScanResultSchema(BaseModel):
    tool_name: str
    result: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class ScanTaskResponse(BaseModel):
    id: str
    target: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    results: List[ScanResultSchema] = []

    class Config:
        from_attributes = True

class SubscriptionRequest(BaseModel):
    target: str
    email: Optional[str] = None
    frequency: str = "daily"

class SubscriptionResponse(BaseModel):
    id: str
    target: str
    email: Optional[str]
    frequency: str
    class Config:
        from_attributes = True

class UserSettingsSchema(BaseModel):
    shodan_api_key: Optional[str] = None
    hibp_api_key: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    openrouter_model: str = "google/gemini-pro"
    stealth_mode: bool = False
    auto_pdf_report: bool = False

    class Config:
        from_attributes = True

class TargetSummary(BaseModel):
    target: str
    last_scan_at: Optional[datetime] = None
    risk_score: str = "UNKNOWN"
    total_scans: int = 0
    latest_scan_id: Optional[str] = None
    latest_report_path: Optional[str] = None
