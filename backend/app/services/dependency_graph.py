import ast
import os

from pathlib import Path
from collections import defaultdict


MAX_FILES = 300


def should_skip(path_str: str) -> bool:

    skip_keywords = [
        "__pycache__",
        "venv",
        ".git",
        "site-packages",
        "node_modules",
        "tests",
        "test"
    ]

    return any(
        keyword in path_str.lower()
        for keyword in skip_keywords
    )


def normalize_module_name(path_str: str) -> str:
    """
    Convert file path to Python module notation.
    """

    return (
        path_str.replace("\\", ".")
        .replace("/", ".")
        .removesuffix(".py")
    )


def parse_changed_files_from_diff(pr_diff: str) -> list:
    """
    Extract changed file paths from git diff.
    """

    changed_files = []

    for line in pr_diff.splitlines():

        if line.startswith("+++ b/"):

            file_path = (
                line.replace("+++ b/", "")
                .strip()
            )

            changed_files.append(file_path)

    return list(set(changed_files))


def build_dependency_graph(repo_path: str) -> dict:
    """
    Build lightweight dependency graph for repository analysis.

    Supports:
    - from x import y
    - import x

    Optimized for cloud deployment.
    """

    repo = Path(repo_path)

    all_py_files = [
        f for f in repo.rglob("*.py")
        if not should_skip(str(f))
    ][:MAX_FILES]

    module_map = {}

    for f in all_py_files:

        try:

            rel = f.relative_to(repo)

            module_name = normalize_module_name(str(rel))

            module_map[module_name] = str(rel)

        except Exception:
            continue

    edges = defaultdict(list)
    fan_in = defaultdict(int)

    for f in all_py_files:

        try:

            rel = str(f.relative_to(repo))

            source_code = f.read_text(
                encoding="utf-8",
                errors="ignore"
            )

            tree = ast.parse(source_code)

        except Exception:
            continue

        for node in ast.walk(tree):

            try:

                # from x import y
                if isinstance(node, ast.ImportFrom) and node.module:

                    target = node.module

                    for module_name in module_map:

                        if target.startswith(module_name):

                            edges[rel].append(module_name)

                            fan_in[module_name] += 1

                # import x
                elif isinstance(node, ast.Import):

                    for alias in node.names:

                        target = alias.name

                        for module_name in module_map:

                            if target.startswith(module_name):

                                edges[rel].append(module_name)

                                fan_in[module_name] += 1

            except Exception:
                continue

    return {
        "nodes": list(module_map.values()),
        "edges": dict(edges),
        "fan_in": dict(fan_in),
        "module_map": module_map,
        "scanned_files": len(all_py_files)
    }


def get_blast_radius(
    changed_files: list,
    graph: dict,
    hops: int = 2
) -> dict:
    """
    Walk dependency graph to estimate downstream impact.
    """

    affected = set(changed_files)

    frontier = set(changed_files)

    reverse = defaultdict(list)

    for importer, imports in graph["edges"].items():

        for imp in imports:

            reverse[imp].append(importer)

    for _ in range(hops):

        next_frontier = set()

        for f in frontier:

            module_name = normalize_module_name(f)

            dependents = reverse.get(module_name, [])

            next_frontier.update(dependents)

        next_frontier = next_frontier - affected

        affected.update(next_frontier)

        frontier = next_frontier

    return {
        "directly_affected": list(changed_files),
        "blast_radius": list(
            affected - set(changed_files)
        ),
        "blast_radius_size": len(affected)
    }