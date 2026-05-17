import os
try:
    import httpx
except Exception:  # pragma: no cover - fallback for environments without httpx
    import requests as httpx

WATSONX_API_KEY = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL = os.getenv(
    "WATSONX_URL",
    "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"
)

# Fallback used when watsonx is not configured
_FALLBACK_TEMPLATE = (
    "This change modifies {changed_files}, which is imported by {fan_in} modules "
    "across the repository, producing a blast radius of {blast_radius_size} transitively "
    "affected files. "
    "With a test coverage ratio of {coverage_pct}% and {blast_radius_size} files at risk, "
    "the structural impact of this PR is {risk_level}. "
    "Primary risk driver: {top_signal}."
)


def _build_prompt(context: dict) -> str:
    return f"""You are a senior software risk engineer reviewing a pull request.

Repository analysis results:
- Repository: {context['repository']}
- Total files: {context['total_files']}
- Languages: {', '.join(context['languages'])}
- Changed files: {', '.join(context['changed_files'])}
- Blast radius: {context['blast_radius_size']} files affected (2-hop dependency walk)
- Fan-in criticality score: {context['fan_in_criticality']}/30
- Test coverage ratio: {context['coverage_pct']}%
- Overall risk score: {context['risk_score']}/100 ({context['risk_level']})

Write exactly 3 sentences. Be specific — reference the actual metrics above.
Do not use filler phrases like "it is important to note".
Do not recommend solutions. Only assess risk.
Output only the 3 sentences, no headings, no bullet points."""


def _top_signal(risk_signals: dict) -> str:
    """Returns the name of the highest-scoring risk signal."""
    labels = {
        "fan_in_criticality": "high module coupling (fan-in)",
        "blast_radius_score": "large blast radius",
        "test_coverage_penalty": "insufficient test coverage",
        "change_surface": "large change surface area",
    }
    top = max(risk_signals, key=risk_signals.get)
    return labels.get(top, top)


def _fallback_narrative(context: dict) -> str:
    return _FALLBACK_TEMPLATE.format(**context)


async def generate_narrative(
    repository: str,
    total_files: int,
    languages: dict,
    changed_files: list,
    blast_radius_size: int,
    risk_score: int,
    risk_level: str,
    risk_signals: dict,
    test_coverage_ratio: float,
) -> str:
    """
    Calls IBM watsonx to generate a 3-sentence risk narrative.
    Falls back to a structured template if watsonx is not configured.
    """

    coverage_pct = round(test_coverage_ratio * 100)
    fan_in = risk_signals.get("fan_in_criticality", 0)

    context = {
        "repository": repository,
        "total_files": total_files,
        "languages": list(languages.keys()),
        "changed_files": changed_files if changed_files else ["(unknown)"],
        "blast_radius_size": blast_radius_size,
        "fan_in_criticality": fan_in,
        "coverage_pct": coverage_pct,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "top_signal": _top_signal(risk_signals),
    }

    # ── Use fallback if watsonx not configured ────────────────────────────
    if not WATSONX_API_KEY or not WATSONX_PROJECT_ID:
        return _fallback_narrative(context)

    # ── IBM watsonx API call ──────────────────────────────────────────────
    try:
        # Step 1: Get IAM access token
        token_response = httpx.post(
            "https://iam.cloud.ibm.com/identity/token",
            data={
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                "apikey": WATSONX_API_KEY,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        token_response.raise_for_status()
        access_token = token_response.json()["access_token"]

        # Step 2: Call watsonx text generation
        payload = {
            "model_id": "ibm/granite-13b-instruct-v2",
            "input": _build_prompt(context),
            "parameters": {
                "decoding_method": "greedy",
                "max_new_tokens": 150,
                "min_new_tokens": 40,
                "stop_sequences": ["\n\n"],
                "temperature": 0.3,
            },
            "project_id": WATSONX_PROJECT_ID,
        }

        response = httpx.post(
            WATSONX_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            timeout=20,
        )
        response.raise_for_status()
        result = response.json()
        narrative = result["results"][0]["generated_text"].strip()
        return narrative if narrative else _fallback_narrative(context)

    except Exception:
        # Never crash the analysis because AI narrative failed
        return _fallback_narrative(context)