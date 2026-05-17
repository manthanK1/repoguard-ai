import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.analyze import router as analyze_router

app = FastAPI(
    title="RepoGuard AI",
    description="Static dependency analysis and repository risk intelligence",
    version="1.0.0"
)

# Allow origins via env var (comma-separated) or fall back to wildcard
raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in raw_origins.split(",")] if raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(analyze_router)

@app.get("/")
def root():
    return {"status": "RepoGuard AI backend running", "version": "1.0.0"}