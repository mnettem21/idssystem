from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List
from app.schemas.dataset import DatasetResponse
from app.services.dataset_service import DatasetService
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[DatasetResponse])
async def get_datasets(project_id: str, current_user = Depends(get_current_user)):
    return await DatasetService.get_project_datasets(project_id, current_user.id)

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    project_id: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    return await DatasetService.upload_dataset(project_id, file, current_user.id)

@router.get("/{dataset_id}/stats")
async def get_dataset_stats(dataset_id: str, current_user = Depends(get_current_user)):
    stats = await DatasetService.get_dataset_stats(dataset_id, current_user.id)
    if not stats:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return stats