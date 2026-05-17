from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import shutil

from app.services.repo_clone import clone_repository
from app.services.repo_analyzer import analyze_repository
from app.services.risk_engine import calculate_risk
from app.services.dependency_graph import (
    build_dependency_graph,
    get_blast_radius,
    parse_changed_files_from_diff,
)

router = APIRouter()


class AnalyzeRequest(BaseModel):
    repo_url: str
    pr_diff: str


@router.post("/analyze")
def analyze_repo(request: AnalyzeRequest):

    # ── 1. Clone repository ───────────────────────────────────────────────
    try:
        repo_path = clone_repository(request.repo_url)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to clone repository: {str(e)}"
        )

    try:
        # ── 2. Basic repo scan (file count, languages) ────────────────────
        repo_analysis = analyze_repository(repo_path)

        # ── 3. Build real dependency graph ────────────────────────────────
        graph = build_dependency_graph(repo_path)

        # ── 4. Parse changed files from diff ─────────────────────────────
        # If diff is in standard unified format, extract real filenames.
        # Otherwise fall back to first node in graph as a safe default.
        changed_files = parse_changed_files_from_diff(request.pr_diff)
        if not changed_files and graph["nodes"]:
            # Fallback: treat the highest fan-in file as the changed file
            fan_in = graph["fan_in"]
            if fan_in:
                top_module = max(fan_in, key=fan_in.get)
                top_file = graph["module_map"].get(top_module, graph["nodes"][0])
                changed_files = [top_file]
            else:
                changed_files = [graph["nodes"][0]]

        # ── 5. Compute blast radius ───────────────────────────────────────
        blast_radius_result = get_blast_radius(changed_files, graph, hops=2)

        # ── 6. Calculate risk using real structural signals ───────────────
        risk_data = calculate_risk(
            repo_analysis,
            request.pr_diff,
            graph,
            blast_radius_result
        )

        # ── 7. Find actual test files in the repo ────────────────────────
        actual_test_files = [
            n for n in graph["nodes"]
            if "test" in n.lower() or "spec" in n.lower()
        ]

        # ── 8. Build graph edges subset for frontend visualization ────────
        # Send only edges involving changed/impacted files to keep payload small
        relevant_files = set(
            blast_radius_result["directly_affected"] +
            blast_radius_result["blast_radius"]
        )
        graph_edges_subset = {
            k: v for k, v in graph["edges"].items()
            if k in relevant_files
        }

        return {
            "repository": request.repo_url,
            "total_files": repo_analysis["total_files"],
            "languages": repo_analysis["languages"],

            # Real blast radius data
            "changed_files": blast_radius_result["directly_affected"],
            "impacted_files": blast_radius_result["blast_radius"],
            "blast_radius_size": blast_radius_result["blast_radius_size"],

            # Structured risk output
            "risk_score": risk_data["risk_score"],
            "risk_level": risk_data["risk_level"],
            "risk_signals": risk_data["risk_signals"],
            "test_coverage_ratio": risk_data["test_coverage_ratio"],

            # Real test files from repo
            "missing_tests": actual_test_files[:10],  # cap at 10 for display

            # Graph data for frontend visualization
            "graph_edges": graph_edges_subset,

            "summary": (
                f"Analyzed {repo_analysis['total_files']} files across "
                f"{len(repo_analysis['languages'])} languages. "
                f"Blast radius: {blast_radius_result['blast_radius_size']} files affected."
            )
        }

    finally:
        # ── Always clean up cloned repo ───────────────────────────────────
        try:
            shutil.rmtree(repo_path)
        except Exception:
            pass