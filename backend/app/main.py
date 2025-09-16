from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth, projects, models, datasets, training
from app.core.config import settings

app = FastAPI(
    title="IDS-ML API",
    description="Machine Learning-based Intrusion Detection System API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(models.router, prefix="/api/v1/models", tags=["models"])
app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["datasets"])
app.include_router(training.router, prefix="/api/v1/training", tags=["training"])

@app.get("/")
async def root():
    return {"message": "IDS-ML API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}