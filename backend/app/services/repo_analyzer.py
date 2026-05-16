import os


EXTENSION_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "React",
    ".ts": "TypeScript",
    ".tsx": "React TypeScript",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".cs": "C#",
    ".html": "HTML",
    ".css": "CSS",
    ".md": "Markdown",
    ".json": "JSON"
}


def analyze_repository(repo_path):

    language_count = {}

    total_files = 0

    for root, dirs, files in os.walk(repo_path):

        for file in files:

            total_files += 1

            extension = os.path.splitext(file)[1]

            language = EXTENSION_MAP.get(extension)

            if language:

                language_count[language] = (
                    language_count.get(language, 0) + 1
                )

    return {
        "total_files": total_files,
        "languages": language_count
    }