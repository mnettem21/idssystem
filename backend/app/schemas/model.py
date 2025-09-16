from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class ModelBase(BaseModel):
    model_type: str
    parameters: Optional[Dict[str, Any]] = None

class ModelCreate(ModelBase):
    project_id: str

class ModelResponse(ModelBase):
    id: str
    project_id: str
    created_at: datetime

    class Config:
        from_attributes = True