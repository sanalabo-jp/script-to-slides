#!/bin/bash
set -euo pipefail

echo "=== Ralph Worker Entrypoint ==="

# --- Firewall ---
# TODO: 방화벽 디버깅 후 재활성화
echo "[1/6] Firewall: SKIPPED (debugging)"
# if sudo /usr/local/bin/init-firewall.sh; then
#     echo "Firewall: OK"
# else
#     echo "WARNING: Firewall setup failed — continuing without network isolation"
# fi

# --- Claude config setup ---
# Host's ~/.claude is mounted read-only at /host-claude (protecting host settings).
# Container's ~/.claude is a writable named volume.
# Sync host settings into the writable volume on each start.
echo "[2/6] Syncing Claude config from host..."
HOST_CLAUDE="/host-claude"
if [ -d "$HOST_CLAUDE" ]; then
    # Sync settings, hooks, rules from host (overwrite each start for freshness)
    for item in settings.json hooks rules CLAUDE.md agents output-styles; do
        if [ -e "$HOST_CLAUDE/$item" ]; then
            cp -r "$HOST_CLAUDE/$item" "$HOME/.claude/$item"
        fi
    done
    echo "Synced: settings, hooks, rules, CLAUDE.md"

    # Restore .claude.json from backup
    BACKUP_DIR="$HOST_CLAUDE/backups"
    if [ -d "$BACKUP_DIR" ]; then
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/.claude.json.backup.* 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            cp "$LATEST_BACKUP" "$HOME/.claude.json"
            echo "Restored .claude.json from: $(basename "$LATEST_BACKUP")"
        fi
    fi
else
    echo "WARNING: Host Claude config not found at $HOST_CLAUDE"
fi

# Ensure hasCompletedOnboarding in .claude.json (required for OAuth token injection)
CLAUDE_JSON="$HOME/.claude.json"
if [ -f "$CLAUDE_JSON" ]; then
    node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$CLAUDE_JSON', 'utf8'));
        data.hasCompletedOnboarding = true;
        fs.writeFileSync('$CLAUDE_JSON', JSON.stringify(data, null, 2));
    "
else
    echo '{"hasCompletedOnboarding":true}' > "$CLAUDE_JSON"
fi
echo "hasCompletedOnboarding: OK"

# --- Auth pre-check ---
if [ -z "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]; then
    echo ""
    echo "ERROR: CLAUDE_CODE_OAUTH_TOKEN is not set."
    echo "Run this on host to extract token:"
    echo '  security find-generic-password -s "Claude Code-credentials" -a "Claude Code" -w'
    echo "Then save to .env.ralph:"
    echo '  CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...'
    exit 1
fi
echo "OAuth token: detected"

# --- Git config ---
echo "[3/6] Configuring git..."
git config --global user.name "${GIT_USER_NAME:-Ralph Worker}"
git config --global user.email "${GIT_USER_EMAIL:-ralph@local}"
git config --global --add safe.directory /workspace

# --- Dependencies ---
echo "[4/6] Installing dependencies..."
cd /workspace
sudo chown -R node:node /workspace/node_modules 2>/dev/null || true
npm ci

# --- Claude CLI check ---
echo "[5/6] Verifying Claude CLI..."
claude --version

# --- Ralph execution ---
echo "[6/6] Starting Ralph..."
echo "  Working directory: $(pwd)"
echo "  Node: $(node --version)"
echo "  Claude mount: /host-claude (ro) → ~/.claude (writable copy)"
echo "=========================="

exec ralph --live "$@"
