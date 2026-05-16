def calculate_risk(repo_analysis, pr_diff):

    risk_score = 20

    total_files = repo_analysis["total_files"]

    languages = repo_analysis["languages"]

    diff_length = len(pr_diff)

    # Large repository

    if total_files > 500:
        risk_score += 20

    elif total_files > 200:
        risk_score += 10

    # Large PR diff

    if diff_length > 1000:
        risk_score += 25

    elif diff_length > 300:
        risk_score += 10

    # Multi-language complexity

    if len(languages) > 4:
        risk_score += 10

    # Sensitive keywords

    sensitive_keywords = [
        "auth",
        "payment",
        "security",
        "database",
        "admin",
        "token"
    ]

    pr_diff_lower = pr_diff.lower()

    for keyword in sensitive_keywords:

        if keyword in pr_diff_lower:
            risk_score += 15

    # Cap at 100

    risk_score = min(risk_score, 100)

    # Determine level

    if risk_score >= 75:
        risk_level = "HIGH"

    elif risk_score >= 45:
        risk_level = "MEDIUM"

    else:
        risk_level = "LOW"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level
    }