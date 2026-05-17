import ast
import os
import re
from pathlib import Path
from collections import defaultdict


def build_dependency_graph(repo_path: str) -> dict:
    """
    Scans the cloned repo and builds a real import dependency graph.
    Works for Python (AST-level) and JS/TS (regex-level).

    Returns:
        nodes       — list of all source files (relative paths)
        edges       — { "file.py": ["imported.module", ...] }
        fan_in      — { "module.name": count_of_files_importing_it }
        module_map  — { "module.name": "relative/path.py" }
    """

    repo = Path(repo_path)

    # ── Collect all Python files ──────────────────────────────────────────
    all_py_files = list(repo.rglob("*.py"))

    # Build module name → relative path map
    # e.g. "app/services/auth.py" → module "app.services.auth"
    module_map = {}
    for f in all_py_files:
        rel = f.relative_to(repo)
        module_name = str(rel).replace(os.sep, ".").removesuffix(".py")
        module_map[module_name] = str(rel)

    edges = defaultdict(list)
    fan_in = defaultdict(int)

    # ── Python: AST import parsing ────────────────────────────────────────
    for f in all_py_files:
        rel = str(f.relative_to(repo))
        try:
            source = f.read_text(encoding="utf-8", errors="ignore")
            tree = ast.parse(source)
        except SyntaxError:
            continue

        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module:
                target = node.module
                # Only count imports that resolve to files inside the repo
                if any(target == m or target.startswith(m + ".")
                       for m in module_map):
                    edges[rel].append(target)
                    fan_in[target] += 1

            elif isinstance(node, ast.Import):
                for alias in node.names:
                    if any(alias.name == m or alias.name.startswith(m + ".")
                           for m in module_map):
                        edges[rel].append(alias.name)
                        fan_in[alias.name] += 1

    # ── JS / TS: regex import parsing ────────────────────────────────────
    js_files = list(repo.rglob("*.js")) + \
               list(repo.rglob("*.jsx")) + \
               list(repo.rglob("*.ts")) + \
               list(repo.rglob("*.tsx"))

    import_pattern = re.compile(
        r"""(?:import\s+.*?\s+from\s+['"](.+?)['"]|require\s*\(\s*['"](.+?)['"]\s*\))"""
    )

    for f in js_files:
        rel = str(f.relative_to(repo))
        try:
            source = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        for match in import_pattern.finditer(source):
            imported = match.group(1) or match.group(2)
            # Only relative imports (start with ./ or ../) are intra-repo
            if imported and imported.startswith("."):
                edges[rel].append(imported)
                # Normalize to a simple fan_in key
                fan_in[imported] += 1

    return {
        "nodes": list(module_map.values()),
        "edges": dict(edges),
        "fan_in": dict(fan_in),
        "module_map": module_map
    }


def get_blast_radius(changed_files: list, graph: dict, hops: int = 2) -> dict:
    """
    Walks the dependency graph N hops outward from changed_files.
    Returns which files are directly and indirectly affected.

    Uses a visited set — handles circular imports safely.
    """

    affected = set(changed_files)
    frontier = set(changed_files)

    # Build reverse map: module_name → [files that import it]
    reverse = defaultdict(list)
    for importer, imports in graph["edges"].items():
        for imp in imports:
            reverse[imp].append(importer)

    for _ in range(hops):
        next_frontier = set()
        for f in frontier:
            # Convert file path to module name for reverse lookup
            module_name = f.replace("\\", "/").replace("/", ".").removesuffix(".py")
            dependents = reverse.get(module_name, [])
            for dep in dependents:
                if dep not in affected:
                    next_frontier.add(dep)
        affected.update(next_frontier)
        frontier = next_frontier

    blast = list(affected - set(changed_files))

    return {
        "directly_affected": changed_files,
        "blast_radius": blast,
        "blast_radius_size": len(affected)
    }


def parse_changed_files_from_diff(pr_diff: str) -> list:
    """
    Extracts actual filenames from a unified diff format.
    Looks for lines like: +++ b/app/services/auth.py
    Falls back to empty list if no standard diff format detected.
    """
    import re
    pattern = re.compile(r'^\+\+\+\s+b/(.+)$', re.MULTILINE)
    matches = pattern.findall(pr_diff)
    return matches if matches else []