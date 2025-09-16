from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.project import ProjectCreate, ProjectResponse
from app.services.project_service import ProjectService
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(current_user = Depends(get_current_user)):
    return await ProjectService.get_user_projects(current_user.id)

@router.post("/", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, current_user = Depends(get_current_user)):
    return await ProjectService.create_project(project, current_user.id)

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user = Depends(get_current_user)):
    project = await ProjectService.get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user = Depends(get_current_user)):
    success = await ProjectService.delete_project(project_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}