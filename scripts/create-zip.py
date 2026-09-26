from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT.parent / "FreeToolCo-Production-Website.zip"
INCLUDE_DIRS = ["src", "scripts", "dist", "docs", ".github"]
INCLUDE_FILES = ["package.json", "package-lock.json", "README.md", "FreeToolCo-Management-Guide.pdf"]
EXCLUDE_NAMES = {"node_modules", ".git", ".cache", "dist.zip"}

if OUT.exists():
    OUT.unlink()

with ZipFile(OUT, "w", ZIP_DEFLATED) as zf:
    for file_name in INCLUDE_FILES:
        path = ROOT / file_name
        if path.exists():
            zf.write(path, path.relative_to(ROOT.parent))
    for dir_name in INCLUDE_DIRS:
        directory = ROOT / dir_name
        if not directory.exists():
            continue
        for path in directory.rglob("*"):
            if not path.is_file():
                continue
            if any(part in EXCLUDE_NAMES for part in path.parts):
                continue
            zf.write(path, path.relative_to(ROOT.parent))

print(OUT)
