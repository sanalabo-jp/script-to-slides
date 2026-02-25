#!/bin/bash
# Network isolation for Ralph worker container
# Architecture: iptables + Squid hybrid
#   - iptables: 모든 직접 외부 접속 차단, Squid(localhost:3128)만 허용
#   - Squid: 도메인 레벨 allowlist (CDN IP 변경 무관, SNI 기반 HTTPS 필터링)
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

# --- Restore Docker internal DNS ---
if [ -n "$DOCKER_DNS_RULES" ]; then
    echo "Restoring Docker DNS rules..."
    iptables -t nat -N DOCKER_OUTPUT 2>/dev/null || true
    iptables -t nat -N DOCKER_POSTROUTING 2>/dev/null || true
    while IFS= read -r rule; do
        [ -z "$rule" ] && continue
        iptables -t nat $rule 2>/dev/null || echo "WARNING: Failed to restore rule: $rule"
    done <<< "$DOCKER_DNS_RULES"
else
    echo "No Docker DNS rules to restore"
fi

# --- Base rules ---
# DNS (Docker internal + external)
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A INPUT -p udp --sport 53 -j ACCEPT

# Localhost (Squid proxy + internal comms)
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# --- Host network (Docker host comms) ---
HOST_IP=$(ip route | grep default | cut -d" " -f3 || true)
if [ -n "$HOST_IP" ]; then
    HOST_NETWORK=$(echo "$HOST_IP" | sed "s/\.[0-9]*$/.0\/24/")
    echo "Host network: $HOST_NETWORK"
    iptables -A INPUT -s "$HOST_NETWORK" -j ACCEPT
    iptables -A OUTPUT -d "$HOST_NETWORK" -j ACCEPT
else
    echo "WARNING: Failed to detect host IP"
fi

# --- Squid proxy: 외부 접속 허용 (Squid 프로세스만) ---
# Squid은 proxy user(UID 13)로 실행
iptables -A OUTPUT -m owner --uid-owner 13 -p tcp --dport 443 -j ACCEPT
iptables -A OUTPUT -m owner --uid-owner 13 -p tcp --dport 80 -j ACCEPT

# --- Default policies: 그 외 모든 외부 접속 차단 ---
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# Reject with feedback (DROP 대신 REJECT로 즉시 실패 피드백)
iptables -A OUTPUT -j REJECT --reject-with icmp-admin-prohibited

# --- Verification ---
echo "Verifying firewall..."

# Squid이 아직 시작 전이므로, 직접 외부 접속이 차단되는지만 확인
if curl --connect-timeout 3 -s --noproxy '*' https://example.com >/dev/null 2>&1; then
    echo "ERROR: Firewall verification failed — direct external access not blocked"
    exit 1
else
    echo "PASS: Direct external access blocked"
fi

echo "Firewall configuration complete (Squid hybrid mode)"
