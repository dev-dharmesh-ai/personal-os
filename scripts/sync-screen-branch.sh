#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: npm run sync:tasks | npm run sync:finance"
  exit 1
}

if [ "$#" -ne 1 ]; then
  usage
fi

SCREEN="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKTREES_DIR="$(cd "$MAIN_DIR/.." && pwd)/worktrees"
TASKS_DIR="$WORKTREES_DIR/personal-os-tasks"
FINANCE_DIR="$WORKTREES_DIR/personal-os-finance"

case "$SCREEN" in
  tasks)
    SOURCE_LABEL="Tasks"
    SOURCE_DIR="$TASKS_DIR"
    SOURCE_BRANCH="codex/tasks-screen-fixes"
    TARGET_LABEL="Finance"
    TARGET_DIR="$FINANCE_DIR"
    ;;
  finance)
    SOURCE_LABEL="Finance"
    SOURCE_DIR="$FINANCE_DIR"
    SOURCE_BRANCH="codex/finance-screen-fixes"
    TARGET_LABEL="Tasks"
    TARGET_DIR="$TASKS_DIR"
    ;;
  *)
    usage
    ;;
esac

run() {
  echo
  echo "==> $*"
  "$@"
}

ensure_dir() {
  local dir="$1"
  local label="$2"

  if [ ! -d "$dir" ]; then
    echo "Missing $label directory: $dir"
    exit 1
  fi
}

ensure_branch() {
  local dir="$1"
  local expected="$2"
  local label="$3"
  local current

  current="$(git -C "$dir" branch --show-current)"
  if [ "$current" != "$expected" ]; then
    echo "$label is on '$current', expected '$expected'."
    exit 1
  fi
}

ensure_clean() {
  local dir="$1"
  local label="$2"

  if [ -n "$(git -C "$dir" status --porcelain)" ]; then
    echo "$label has uncommitted changes. Commit, stash, or discard them before syncing."
    git -C "$dir" status --short
    exit 1
  fi
}

echo "Syncing $SOURCE_LABEL branch into main, then updating $TARGET_LABEL branch."

ensure_dir "$MAIN_DIR" "main repo"
ensure_dir "$SOURCE_DIR" "$SOURCE_LABEL worktree"
ensure_dir "$TARGET_DIR" "$TARGET_LABEL worktree"

ensure_branch "$MAIN_DIR" "main" "Main repo"
ensure_branch "$SOURCE_DIR" "$SOURCE_BRANCH" "$SOURCE_LABEL worktree"

ensure_clean "$SOURCE_DIR" "$SOURCE_LABEL worktree"
ensure_clean "$MAIN_DIR" "Main repo"
ensure_clean "$TARGET_DIR" "$TARGET_LABEL worktree"

run npm --prefix "$SOURCE_DIR" run build
run git -C "$SOURCE_DIR" fetch origin
run git -C "$SOURCE_DIR" merge origin/main
run npm --prefix "$SOURCE_DIR" run build

run git -C "$MAIN_DIR" pull origin main
run git -C "$MAIN_DIR" merge "$SOURCE_BRANCH"
run npm --prefix "$MAIN_DIR" run build
run git -C "$MAIN_DIR" push origin main

run git -C "$TARGET_DIR" fetch origin
run git -C "$TARGET_DIR" merge origin/main
run npm --prefix "$TARGET_DIR" run build

echo
echo "Done. $SOURCE_LABEL is merged into main, and $TARGET_LABEL is updated from origin/main."
