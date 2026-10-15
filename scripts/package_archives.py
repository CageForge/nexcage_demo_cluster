#!/usr/bin/env python3
"""
package_archives.py
Packages the standalone demo-cluster directory into clean .zip and .tar.gz archives.
Ensures zero self-nesting, excludes node_modules and .git, and preserves file permissions.
"""

import os
import sys
import shutil
import tempfile
import zipfile
import tarfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEMO_DIR = os.path.dirname(SCRIPT_DIR)
ARCHIVE_BASE_NAME = "nexcage-demo-cluster"
ARCHIVE_ROOT_FOLDER = "demo-cluster"

EXCLUDED_DIRS = {
    "node_modules",
    ".git",
    "__pycache__",
    ".zig-cache",
    "zig-out",
}

EXCLUDED_FILES = {
    f"{ARCHIVE_BASE_NAME}.zip",
    f"{ARCHIVE_BASE_NAME}.tar.gz",
    ".DS_Store",
    "Thumbs.db",
}

EXCLUDED_EXTS = {
    ".tmp",
    ".bak",
    ".pyc",
}

def should_exclude(rel_path, is_dir=False):
    parts = rel_path.split(os.sep)
    for part in parts:
        if part in EXCLUDED_DIRS:
            return True
    
    filename = os.path.basename(rel_path)
    if not is_dir:
        if filename in EXCLUDED_FILES:
            return True
        _, ext = os.path.splitext(filename)
        if ext in EXCLUDED_EXTS:
            return True
    return False

def collect_files():
    file_list = []
    for root, dirs, files in os.walk(DEMO_DIR):
        # Exclude directories in-place to prevent traversing them
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
        
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, DEMO_DIR)
            if not should_exclude(rel_path, is_dir=False):
                file_list.append((full_path, rel_path))
    file_list.sort(key=lambda x: x[1])

    # Ensure executable permission on disk for shell scripts
    for full_path, rel_path in file_list:
        if rel_path.endswith('.sh') or rel_path.startswith('scripts/'):
            try:
                os.chmod(full_path, 0o755)
            except OSError:
                pass
    return file_list

def create_zip(files, dest_path):
    temp_fd, temp_path = tempfile.mkstemp(suffix=".zip")
    os.close(temp_fd)
    try:
        with zipfile.ZipFile(temp_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
            for full_path, rel_path in files:
                arc_name = os.path.join(ARCHIVE_ROOT_FOLDER, rel_path)
                st = os.stat(full_path)
                mode = st.st_mode
                if rel_path.endswith('.sh') or rel_path.startswith('scripts/'):
                    mode = mode | 0o755
                zinfo = zipfile.ZipInfo.from_file(full_path, arc_name)
                # Store Unix permissions in external_attr (preserves executable bit)
                zinfo.external_attr = (mode & 0xFFFF) << 16
                with open(full_path, 'rb') as f_in:
                    zf.writestr(zinfo, f_in.read(), compress_type=zipfile.ZIP_DEFLATED)
        shutil.move(temp_path, dest_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def create_tar_gz(files, dest_path):
    temp_fd, temp_path = tempfile.mkstemp(suffix=".tar.gz")
    os.close(temp_fd)
    try:
        with tarfile.open(temp_path, "w:gz") as tar:
            for full_path, rel_path in files:
                arc_name = os.path.join(ARCHIVE_ROOT_FOLDER, rel_path)
                tarinfo = tar.gettarinfo(full_path, arcname=arc_name)
                if rel_path.endswith('.sh') or rel_path.startswith('scripts/'):
                    tarinfo.mode = tarinfo.mode | 0o755
                with open(full_path, "rb") as f_in:
                    tar.addfile(tarinfo, f_in)
        shutil.move(temp_path, dest_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def main():
    print(f"📦 Packaging demo-cluster archives from: {DEMO_DIR}")
    files = collect_files()
    print(f"  -> Collected {len(files)} files (clean tree, excluded dependencies & archives)")

    zip_dest = os.path.join(DEMO_DIR, f"{ARCHIVE_BASE_NAME}.zip")
    tar_dest = os.path.join(DEMO_DIR, f"{ARCHIVE_BASE_NAME}.tar.gz")

    print(f"  -> Generating {ARCHIVE_BASE_NAME}.zip ...")
    create_zip(files, zip_dest)
    zip_size = os.path.getsize(zip_dest) / 1024
    print(f"     ✓ {ARCHIVE_BASE_NAME}.zip ({zip_size:.1f} KB)")

    print(f"  -> Generating {ARCHIVE_BASE_NAME}.tar.gz ...")
    create_tar_gz(files, tar_dest)
    tar_size = os.path.getsize(tar_dest) / 1024
    print(f"     ✓ {ARCHIVE_BASE_NAME}.tar.gz ({tar_size:.1f} KB)")

    print(f"✨ Distribution archives successfully updated!")

if __name__ == "__main__":
    main()
