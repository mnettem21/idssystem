from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.training import TrainingRunCreate, TrainingRunResponse
from app.services.training_service import TrainingService
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("/start", response_model=TrainingRunResponse)
async def start_training(training_config: TrainingRunCreate, current_user = Depends(get_current_user)):
    return await TrainingService.start_training(training_config, current_user.id)

@router.get("/status/{run_id}", response_model=TrainingRunResponse)
async def get_training_status(run_id: str, current_user = Depends(get_current_user)):
    run = await TrainingService.get_training_run(run_id, current_user.id)
    if not run:
        raise HTTPException(status_code=404, detail="Training run not found")
    return run

@router.get("/runs", response_model=List[TrainingRunResponse])
async def get_training_runs(project_id: str, current_user = Depends(get_current_user)):
    return await TrainingService.get_project_runs(project_id, current_user.id)

@router.post("/stop/{run_id}")
async def stop_training(run_id: str, current_user = Depends(get_current_user)):
    success = await TrainingService.stop_training(run_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Training run not found")
    return {"message": "Training stopped successfully"}