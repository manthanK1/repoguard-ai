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

    return any(keyword in path_str.lower() for keyword in skip_keywords)


def build_dependency_graph(repo_path: str) -> dict:
    """
    Build lightweight dependency graph for repository analysis.

    Optimized for cloud deployment:
    - skips heavy directories
    - limits scanned files
    - handles AST failures safely
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

            module_name = (
                str(rel)
                .replace(os.sep, ".")
                .removesuffix(".py")
            )

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

                if isinstance(node, ast.ImportFrom) and node.module:

                    target = node.module

                    if any(
                        target.startswith(m)
                        for m in module_map
                    ):

                        edges[rel].append(target)

                        fan_in[target] += 1

            except Exception:
                continue

    return {
        "nodes": list(module_map.values()),
        "edges": dict(edges),
        "fan_in": dict(fan_in),
        "module_map": module_map,
        "scanned_files": len(all_py_files)
    }