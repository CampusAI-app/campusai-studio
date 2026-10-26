#!/usr/bin/env bash
# Sets up the CampusAI studio for Claude Code on a Mac, or on Windows in Git Bash (comes with Git for
# Windows). Safe to run again.
#
#   bash install.sh
#
# Run it from inside the studio folder (after `git clone`), or on its own and it clones the studio
# into ~/CampusAI Studio/studio first. Needs Git, Node 18+, Google Chrome and Claude Code.
set -u
REPO="https://github.com/CampusAI-app/campusai-studio.git"
ok() { printf '  done  %s\n' "$1"; }
skip() { printf '  skip  %s\n' "$1"; }
stop() { printf '  stop  %s\n' "$1"; exit 1; }
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) WIN=1; PY=python ;; *) WIN=0; PY=python3 ;; esac

echo "1. Tools"
if [ "$WIN" = 1 ]; then GIT_HINT="Install Git for Windows from git-scm.com, then run this in Git Bash"; else GIT_HINT="Run: xcode-select --install"; fi
command -v git >/dev/null 2>&1 && ok "git" || stop "git not found. $GIT_HINT"
command -v node >/dev/null 2>&1 && ok "node $(node -v)" || stop "Node not found. Install it from nodejs.org (the LTS button), then run this again"
{ [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ] \
  || [ -f "${PROGRAMFILES:-/nonexistent}/Google/Chrome/Application/chrome.exe" ] \
  || [ -f "${LOCALAPPDATA:-/nonexistent}/Google/Chrome/Application/chrome.exe" ]; } && ok "Google Chrome" \
  || skip "Google Chrome not found. Recording the demo needs it: install it from google.com/chrome"

echo "2. The studio"
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$HERE/package.json" ] && [ -d "$HERE/skill" ]; then
  STUDIO="$HERE"
  ok "using $STUDIO"
else
  STUDIO="$HOME/CampusAI Studio/studio"
  if [ -d "$STUDIO/.git" ]; then
    git -C "$STUDIO" pull --ff-only >/dev/null 2>&1 && ok "updated $STUDIO" || skip "could not update $STUDIO, using it as it is"
  else
    mkdir -p "$HOME/CampusAI Studio"
    git clone "$REPO" "$STUDIO" >/dev/null 2>&1 && ok "cloned into $STUDIO" || stop "clone failed: $REPO"
  fi
fi
cd "$STUDIO" || stop "cannot open $STUDIO"

echo "3. Packages and fonts"
npm install --no-fund --no-audit >/dev/null 2>&1 && ok "npm packages" || stop "npm install failed. Run it by hand in $STUDIO to see why"
npm run -s fonts >/dev/null 2>&1 && ok "Zodiak fonts from Fontshare" || skip "fonts, run npm run fonts later"
"$PY" -c "import PIL" >/dev/null 2>&1 && ok "Pillow (contact sheets)" \
  || { "$PY" -m pip install --user --quiet pillow >/dev/null 2>&1 && ok "Pillow (contact sheets)" || skip "Pillow, contact sheets will fall back to single stills"; }

echo "4. Your films folder"
FILMS="$(dirname "$STUDIO")/films"
mkdir -p "$FILMS" && ok "$FILMS (your films live here, outside the repo, so a pull never touches them)"

echo "5. The studio skill for Claude Code"
mkdir -p "$HOME/.claude/skills"
LINK="$HOME/.claude/skills/studio"
if [ -L "$LINK" ] && [ "$(readlink "$LINK")" = "$STUDIO/skill" ]; then
  ok "already linked"
elif [ "$WIN" = 1 ] && [ -f "$LINK/SKILL.md" ] && cmp -s "$LINK/SKILL.md" "$STUDIO/skill/SKILL.md"; then
  ok "already linked"
else
  [ -e "$LINK" ] && mv "$LINK" "$LINK.before-studio-$(date +%Y%m%d%H%M%S)" && ok "kept your old studio skill beside it"
  # Windows: a junction, since Git Bash copies on ln -s and a copy would stop updating on git pull
  if [ "$WIN" = 1 ]; then
    cmd //c mklink //J "$(cygpath -w "$LINK")" "$(cygpath -w "$STUDIO/skill")" >/dev/null && ok "linked ~/.claude/skills/studio to the studio's skill"
  else
    ln -s "$STUDIO/skill" "$LINK" && ok "linked ~/.claude/skills/studio to the studio's skill"
  fi
fi
if command -v npx >/dev/null 2>&1; then
  npx -y skills add remotion-dev/skills -g -a claude-code -s '*' -y >/dev/null 2>&1 \
    && ok "Remotion's official skills" || skip "Remotion's official skills, optional"
  # Emil Kowalski's motion craft (MIT): how motion should feel, the names of effects, Apple's springs,
  # and a critique pass. Reference only; his `animate` is left out because it builds from scratch.
  npx -y skills add emilkowalski/skills -g -a claude-code \
    -s emil-design-eng -s review-animations -s animation-vocabulary -s apple-design -y >/dev/null 2>&1 \
    && ok "Emil Kowalski's motion skills" || skip "Emil Kowalski's motion skills, optional"
  # The studio skill bans this one: it answers "make a video" by starting a blank project.
  rm -rf "$HOME/.claude/skills/remotion-create" "$HOME/.agents/skills/remotion-create"
fi

echo
echo "Ready. Open Claude Code in this folder and say what you want to make:"
echo "  cd \"$STUDIO\" && claude"
echo "First time? Try: npm run chat examples/study-spots.json"
echo "Updates: git pull in the studio folder (your films are never touched)."
