#!/bin/bash
# Stop hook: if app code changed but the project docs did not, ask Claude to update them before finishing.
# Looks at uncommitted changes plus commits not yet pushed, so a commit made earlier in the turn still counts.

input=$(cat)

# Already continuing because of this hook: let the turn end, otherwise it would loop forever.
if printf '%s' "$input" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

changed=$(
  {
    git status --porcelain | sed 's/^...//; s/.* -> //'
    git diff --name-only '@{upstream}' HEAD 2>/dev/null
  } | sort -u
)

# Only app code triggers the check; docs, config and tooling changes don't.
printf '%s\n' "$changed" | grep -Eq '^(src/|index\.html$|app/index\.html$|changelog/index\.html$)' || exit 0

missing=""
for doc in README.md CLAUDE.md MVP.md CHANGELOG.md; do
  printf '%s\n' "$changed" | grep -qx "$doc" || missing="$missing $doc"
done
[ -z "$missing" ] && exit 0

cat <<JSON
{"decision":"block","reason":"App code under src/ or a page entry (index.html, app/index.html, changelog/index.html) changed, but these docs were not touched:${missing}. Update each one that this change affects (README.md: features, usage, data format, structure, limits; MVP.md: product spec, decisions, changelog; CLAUDE.md: conventions and architecture notes for future work; CHANGELOG.md: a user-facing line, Chinese plus EN, under today's date, which publishes to the /changelog/ page). If a file genuinely needs no change, say so explicitly in your reply instead of editing it."}
JSON
