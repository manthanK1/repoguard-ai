from fastapi import APIRouter
from pydantic import BaseModel

from app.services.repo_clone import clone_repository
from app.services.repo_analyzer import analyze_repository
from app.services.risk_engine import calculate_risk
from app.services.impact_analyser import analyze_impact

router = APIRouter()


class AnalyzeRequest(BaseModel):
    repo_url: str
    pr_diff: str


@router.post("/analyze")
def analyze_repo(request: AnalyzeRequest):

    # Clone repository

    repo_path = clone_repository(request.repo_url)

    # Analyze repository

    repo_analysis = analyze_repository(repo_path)

    # Calculate dynamic risk

    risk_data = calculate_risk(
        repo_analysis,
        request.pr_diff
    )

    # Detect impacted files

    impacted_files = analyze_impact(
        request.pr_diff
    )

    # Return analysis response

    return {

        "risk_score": risk_data["risk_score"],

        "risk_level": risk_data["risk_level"],

        "repository": request.repo_url,

        "total_files": repo_analysis["total_files"],

        "languages": repo_analysis["languages"],

        "impacted_files": impacted_files,

        "missing_tests": [
            "AuthServiceTest",
            "PaymentFlowTest"
        ],

        "summary": (
            f"Repository analyzed successfully. "
            f"Total files detected: "
            f"{repo_analysis['total_files']}"
        )
    }