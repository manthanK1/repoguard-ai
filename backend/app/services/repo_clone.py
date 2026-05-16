import os
import shutil

from git import Repo


TEMP_REPO_PATH = "temp_repo"


def clone_repository(repo_url: str):

    # Delete old cloned repo if exists

    if os.path.exists(TEMP_REPO_PATH):
        shutil.rmtree(TEMP_REPO_PATH)

    # Clone repository

    Repo.clone_from(repo_url, TEMP_REPO_PATH)

    return TEMP_REPO_PATH