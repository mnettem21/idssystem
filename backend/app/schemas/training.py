from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class TrainingRunBase(BaseModel):
    model_id: str
    status: str = "pending"
    metrics: Optional[Dict[str, Any]] = None

class TrainingRunCreate(TrainingRunBase):
    pass

class TrainingRunResponse(TrainingRunBase):
    id: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True