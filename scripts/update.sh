#!/usr/bin/env bash
# Keeps the studio current without anyone running `git pull`. Claude Code runs this each time a
# session starts in the studio folder (`.claude/settings.json`), so a rule or part Jacob pushes
# reaches everyone on their next session. It also links any skill in `companion-skills/` into
# ~/.claude/skills, so a new one arrives the same way.
#
# It never blocks a session: no network, local edits in the way, or any other failure just keeps
# the version already here. What it prints is read by Claude at the start of the session.
set -u
STUDIO="$(cd "$(dirname "$0")/.." && pwd)" || exit 0
cd "$STUDIO" || exit 0
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) WIN=1 ;; *) WIN=0 ;; esac

link_skills() {
  [ -d companion-skills ] || return 0
  mkdir -p "$HOME/.claude/skills" 2>/dev/null || return 0
  for dir in companion-skills/*/; do
    [ -f "$dir/SKILL.md" ] || continue
    name="$(basename "$dir")"
    LINK="$HOME/.claude/skills/$name"
    # Someone's own copy of the same skill is left alone.
    [ -e "$LINK" ] || [ -L "$LINK" ] && continue
    if [ "$WIN" = 1 ]; then
      cmd //c mklink //J "$(cygpath -w "$LINK")" "$(cygpath -w "$STUDIO/companion-skills/$name")" >/dev/null 2>&1
    else
      ln -s "$STUDIO/companion-skills/$name" "$LINK" 2>/dev/null
    fi && echo "Studio: added the $name skill. It is ready from the next session."
  done
}

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { link_skills; exit 0; }
[ "$(git branch --show-current 2>/dev/null)" = main ] || { link_skills; exit 0; }

before="$(git rev-parse HEAD)"
GIT_TERMINAL_PROMPT=0 git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=8 \
  fetch --quiet origin main >/dev/null 2>&1 || { link_skills; exit 0; }
behind="$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)"

if [ "$behind" -gt 0 ]; then
  if git merge --ff-only --quiet origin/main >/dev/null 2>&1; then
    echo "Studio: updated with $behind new change(s) from Jacob. Latest: $(git log -1 --format=%s)."
    if ! git diff --quiet "$before" HEAD -- package-lock.json 2>/dev/null; then
      echo "Studio: the update added packages. Run npm install before rendering anything."
    fi
  else
    echo "Studio: could not update because files changed here are in the way. Working on the last" \
      "version. Tell the person, and run git status to see which files."
  fi
fi
link_skills
exit 0
