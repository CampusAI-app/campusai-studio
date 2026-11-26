#!/usr/bin/env bash
# Installs any skill in skill/team-skills.txt that this computer does not have yet. Safe to run again:
# a skill someone already has (theirs or ours) is left alone. Needs npx (comes with Node).
set -u
STUDIO="$(cd "$(dirname "$0")/.." && pwd)" || exit 0
command -v npx >/dev/null 2>&1 || exit 0
added=0
while read -r repo name; do
  case "$repo" in ""|\#*) continue ;; esac
  [ -e "$HOME/.claude/skills/$name" ] || [ -e "$HOME/.agents/skills/$name" ] && continue
  npx -y skills add "$repo" -g -a claude-code -s "$name" -y </dev/null >/dev/null 2>&1 && added=$((added + 1))
done < "$STUDIO/skill/team-skills.txt"
echo "$added"
