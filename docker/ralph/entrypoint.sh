#!/bin/bash
set -euo pipefail

echo "=== Ralph Worker Entrypoint ==="

# --- Firewall ---
echo "[1/5] Setting up firewall..."
if sudo /usr/local/bin/init-firewall.sh; then
    echo "Firewall: OK"
else
    echo "WARNING: Firewall setup failed — continuing without network isolation"
fi

# --- Git config ---
echo "[2/5] Configuring git..."
git config --global user.name "${GIT_USER_NAME:-Ralph Worker}"
git config --global user.email "${GIT_USER_EMAIL:-ralph@local}"
git config --global --add safe.directory /workspace

# --- Dependencies ---
echo "[3/5] Installing dependencies..."
cd /workspace
npm ci

# --- Claude CLI check ---
echo "[4/5] Verifying Claude CLI..."
claude --version

# --- Ralph execution ---
echo "[5/5] Starting Ralph..."
echo "Working directory: $(pwd)"
echo "Node: $(node --version)"
echo "=========================="

exec ralph --live "$@"
