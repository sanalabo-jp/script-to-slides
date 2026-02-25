#!/bin/bash
set -euo pipefail

echo "=== Ralph Worker Entrypoint ==="

# --- Squid proxy ---
echo "[1/7] Starting Squid proxy..."
if sudo squid; then
    # Squid 시작 대기 (포트 리스닝 확인)
    for i in $(seq 1 10); do
        if ss -tln | grep -q ':3128'; then
            break
        fi
        sleep 0.5
    done
    echo "Squid proxy: OK (port 3128)"
else
    echo "WARNING: Squid startup failed — continuing without proxy filtering"
fi

# --- Firewall ---
echo "[2/7] Setting up firewall..."
if sudo /usr/local/bin/init-firewall.sh; then
    echo "Firewall: OK"
else
    echo "WARNING: Firewall setup failed — continuing without network isolation"
fi

# --- Proxy verification (firewall + squid 통합 검증) ---
echo "Verifying proxy filtering..."
export HTTP_PROXY=http://localhost:3128
export HTTPS_PROXY=http://localhost:3128
export http_proxy=http://localhost:3128
export https_proxy=http://localhost:3128

if curl --connect-timeout 5 -s https://api.anthropic.com >/dev/null 2>&1; then
    echo "PASS: api.anthropic.com reachable via proxy"
else
    echo "WARNING: api.anthropic.com unreachable via proxy — Claude API calls may fail"
fi

# --- Claude config setup ---
# Host's ~/.claude is mounted read-only at /host-claude (protecting host settings).
# Container's ~/.claude is a writable named volume.
# Sync host settings into the writable volume on each start.
echo "[3/7] Syncing Claude config from host..."
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

# --- Auth: load from Docker secret ---
SECRET_FILE="/run/secrets/claude_oauth_token"
if [ -f "$SECRET_FILE" ]; then
    CLAUDE_CODE_OAUTH_TOKEN=$(cat "$SECRET_FILE")
    export CLAUDE_CODE_OAUTH_TOKEN
    echo "OAuth token: loaded from secret"
elif [ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]; then
    echo "OAuth token: loaded from env"
else
    echo ""
    echo "ERROR: OAuth token not found."
    echo "  Create secrets/claude_oauth_token with your token."
    echo "  Or set CLAUDE_CODE_OAUTH_TOKEN environment variable."
    exit 1
fi

# --- Git config ---
echo "[4/7] Configuring git..."
git config --global user.name "${GIT_USER_NAME:-Ralph Worker}"
git config --global user.email "${GIT_USER_EMAIL:-ralph@local}"
git config --global --add safe.directory /workspace

# --- Dependencies ---
echo "[5/7] Installing dependencies..."
cd /workspace
sudo chown -R node:node /workspace/node_modules 2>/dev/null || true
npm ci

# --- Claude CLI check ---
echo "[6/7] Verifying Claude CLI..."
claude --version

# --- Ralph execution ---
echo "[7/7] Starting Ralph..."
echo "  Working directory: $(pwd)"
echo "  Node: $(node --version)"
echo "  Proxy: http://localhost:3128"
echo "  Claude mount: /host-claude (ro) → ~/.claude (writable copy)"
echo "=========================="

exec ralph --live "$@"
