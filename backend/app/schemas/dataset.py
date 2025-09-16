from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DatasetBase(BaseModel):
    name: str
    file_path: Optional[str] = None
    size_mb: Optional[float] = None
    features: Optional[int] = None
    samples: Optional[int] = None

class DatasetResponse(DatasetBase):
    id: str
    project_id: str
    uploaded_at: datetime

    class Config:
        from_attributes = True