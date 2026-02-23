#!/bin/bash
# Network isolation for Ralph worker container
# Based on: https://github.com/anthropics/claude-code/blob/main/.devcontainer/init-firewall.sh
# Customizations: VS Code domains removed, Gemini API added, DNS failure graceful degradation
set -euo pipefail
IFS=$'\n\t'

# --- Extract Docker DNS rules BEFORE flushing ---
DOCKER_DNS_RULES=$(iptables-save -t nat | grep "127\.0\.0\.11" || true)

# Flush existing rules
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X
ipset destroy allowed-domains 2>/dev/null || true

# --- Restore Docker internal DNS ---
if [ -n "$DOCKER_DNS_RULES" ]; then
    echo "Restoring Docker DNS rules..."
    iptables -t nat -N DOCKER_OUTPUT 2>/dev/null || true
    iptables -t nat -N DOCKER_POSTROUTING 2>/dev/null || true
    echo "$DOCKER_DNS_RULES" | xargs -L 1 iptables -t nat
else
    echo "No Docker DNS rules to restore"
fi

# --- Base rules (DNS, SSH, localhost) ---
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A INPUT -p udp --sport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# --- Create ipset ---
ipset create allowed-domains hash:net

# --- GitHub IP ranges (dynamic) ---
echo "Fetching GitHub IP ranges..."
gh_ranges=$(curl -s --connect-timeout 10 https://api.github.com/meta || true)

if [ -n "$gh_ranges" ] && echo "$gh_ranges" | jq -e '.web and .api and .git' >/dev/null 2>&1; then
    echo "Processing GitHub IPs..."
    while read -r cidr; do
        if [[ "$cidr" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/[0-9]{1,2}$ ]]; then
            ipset add allowed-domains "$cidr" 2>/dev/null || true
        fi
    done < <(echo "$gh_ranges" | jq -r '(.web + .api + .git)[]' | aggregate -q 2>/dev/null || echo "$gh_ranges" | jq -r '(.web + .api + .git)[]')
    echo "GitHub IP ranges added"
else
    echo "WARNING: Failed to fetch GitHub IP ranges — git operations may fail"
fi

# --- Static domains ---
DOMAINS=(
    "registry.npmjs.org"
    "api.anthropic.com"
    "cdn.anthropic.com"
    "statsig.anthropic.com"
    "statsig.com"
    "sentry.io"
    "generativelanguage.googleapis.com"
)

DNS_FAILURES=0

for domain in "${DOMAINS[@]}"; do
    echo "Resolving $domain..."
    ips=$(dig +noall +answer +short A "$domain" 2>/dev/null || true)

    if [ -z "$ips" ]; then
        echo "WARNING: Failed to resolve $domain — skipping"
        DNS_FAILURES=$((DNS_FAILURES + 1))
        continue
    fi

    while read -r ip; do
        if [[ "$ip" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            ipset add allowed-domains "$ip" 2>/dev/null || true
        fi
    done <<< "$ips"
done

if [ "$DNS_FAILURES" -gt 3 ]; then
    echo "WARNING: $DNS_FAILURES/$((${#DOMAINS[@]})) domains failed to resolve — network may be limited"
fi

# --- Host network ---
HOST_IP=$(ip route | grep default | cut -d" " -f3 || true)
if [ -n "$HOST_IP" ]; then
    HOST_NETWORK=$(echo "$HOST_IP" | sed "s/\.[0-9]*$/.0\/24/")
    echo "Host network: $HOST_NETWORK"
    iptables -A INPUT -s "$HOST_NETWORK" -j ACCEPT
    iptables -A OUTPUT -d "$HOST_NETWORK" -j ACCEPT
else
    echo "WARNING: Failed to detect host IP"
fi

# --- Default policies ---
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow traffic to whitelisted IPs
iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT

# Reject everything else with immediate feedback
iptables -A OUTPUT -j REJECT --reject-with icmp-admin-prohibited

# --- Verification ---
echo "Verifying firewall..."

if curl --connect-timeout 5 -s https://example.com >/dev/null 2>&1; then
    echo "ERROR: Firewall verification failed — example.com reachable"
    exit 1
else
    echo "PASS: example.com blocked"
fi

if curl --connect-timeout 5 -s https://api.anthropic.com >/dev/null 2>&1; then
    echo "PASS: api.anthropic.com reachable"
else
    echo "WARNING: api.anthropic.com unreachable — Claude API calls may fail"
fi

echo "Firewall configuration complete"
