from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.analyze import router as analyze_router

app = FastAPI(
    title="RepoGuard AI",
    description="Static dependency analysis and repository risk intelligence",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(analyze_router)

@app.get("/")
def root():
    return {"status": "RepoGuard AI backend running", "version": "1.0.0"}