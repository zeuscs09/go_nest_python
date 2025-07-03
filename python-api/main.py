from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import user_router, analytics_router
from models.database import engine, Base
import uvicorn

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Python API Performance Test",
    description="FastAPI for performance comparison",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user_router.router, prefix="/api/v1", tags=["users"])
app.include_router(analytics_router.router, prefix="/api/v1", tags=["analytics"])

@app.get("/")
async def root():
    return {"message": "Python API is running", "service": "python-api"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 