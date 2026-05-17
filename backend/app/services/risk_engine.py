def calculate_risk(repo_analysis: dict, pr_diff: str, graph: dict, blast_radius_result: dict) -> dict:
    """
    Four-signal risk model — each signal is capped and labeled.
    Signals are returned individually so the frontend can display them.
    """

    signals = {}

    # ── Signal 1: Fan-in Criticality ─────────────────────────────────────
    # How many other files import the files being changed?
    # High fan-in = high blast potential.
    changed_files = blast_radius_result.get("directly_affected", [])
    max_fan_in = 0
    for f in changed_files:
        module_name = f.replace("\\", "/").replace("/", ".").removesuffix(".py")
        fan_in_score = graph.get("fan_in", {}).get(module_name, 0)
        if fan_in_score > max_fan_in:
            max_fan_in = fan_in_score

    signals["fan_in_criticality"] = min(max_fan_in * 8, 30)

    # ── Signal 2: Blast Radius Magnitude ─────────────────────────────────
    # How many total files are in the blast radius?
    radius_size = blast_radius_result.get("blast_radius_size", 0)
    signals["blast_radius_score"] = min(radius_size * 3, 25)

    # ── Signal 3: Test Coverage Gap ───────────────────────────────────────
    # Ratio of test files to source files — low coverage = higher risk.
    all_nodes = graph.get("nodes", [])
    total_src = len([n for n in all_nodes if "test" not in n.lower()])
    total_test = len([n for n in all_nodes if "test" in n.lower()])
    coverage_ratio = total_test / max(total_src, 1)
    # 0% coverage → 25 pts penalty. 50%+ coverage → 0 pts penalty.
    signals["test_coverage_penalty"] = max(0, 25 - int(coverage_ratio * 50))

    # ── Signal 4: Change Surface Area ────────────────────────────────────
    # Lines changed in the diff — normalized, capped at 20 pts.
    diff_lines = len(pr_diff.splitlines())
    signals["change_surface"] = min(diff_lines // 10, 20)

    # ── Final Score ───────────────────────────────────────────────────────
    risk_score = min(sum(signals.values()), 100)

    if risk_score >= 70:
        risk_level = "HIGH"
    elif risk_score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Test coverage ratio exposed for the frontend
    test_coverage_ratio = round(coverage_ratio, 2)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_signals": signals,
        "test_coverage_ratio": test_coverage_ratio
    }