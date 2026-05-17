import os
import stat
import shutil
import tempfile

from git import Repo


def _force_remove_readonly(func, path, _):
    """
    Windows marks .git files as read-only.
    This handler removes the read-only flag and retries deletion.
    """
    os.chmod(path, stat.S_IWRITE)
    func(path)


def clone_repository(repo_url: str) -> str:
    """
    Clones the repository into a unique temp directory.
    Uses tempfile.mkdtemp() so concurrent requests don't collide.
    Cleans up any pre-existing temp_repo folder safely on Windows.
    """

    # Clean up old fixed-path temp_repo if it exists from older code
    old_path = "temp_repo"
    if os.path.exists(old_path):
        shutil.rmtree(old_path, onerror=_force_remove_readonly)

    # Create a fresh unique temp directory for this request
    repo_path = tempfile.mkdtemp(prefix="repoguard_")

    Repo.clone_from(repo_url, repo_path)

    return repo_path