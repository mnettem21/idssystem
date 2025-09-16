from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.model import ModelCreate, ModelResponse
from app.services.model_service import ModelService
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ModelResponse])
async def get_models(project_id: str, current_user = Depends(get_current_user)):
    return await ModelService.get_project_models(project_id, current_user.id)

@router.post("/", response_model=ModelResponse)
async def create_model(model: ModelCreate, current_user = Depends(get_current_user)):
    return await ModelService.create_model(model, current_user.id)

@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str, current_user = Depends(get_current_user)):
    model = await ModelService.get_model(model_id, current_user.id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model