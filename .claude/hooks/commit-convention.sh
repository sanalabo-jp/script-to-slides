#!/bin/bash
# Hook D: Conventional Commits 1.0.0 규칙 강제
# 스펙: https://www.conventionalcommits.org/en/v1.0.0/
# 이벤트: PreToolUse (Bash)
#
# 형식: <type>[optional scope][!]: <description>
#   type: feat, fix, docs, style, refactor, perf, test, build, chore, ci, revert, merge
#   scope: 괄호 안의 코드베이스 섹션명 (선택)
#   !: BREAKING CHANGE 표시 (선택)
#   description: 변경 내용 요약

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# git commit 명령이 아니면 통과
if ! echo "$COMMAND" | grep -qE 'git\s+commit'; then
  exit 0
fi

# -m 옵션으로 메시지가 있는 경우 검사
MSG=$(echo "$COMMAND" | grep -oP '(?<=-m\s["\x27])[^"\x27]+' | head -1)

if [ -z "$MSG" ]; then
  # -m 없이 commit (에디터 사용) → 통과
  exit 0
fi

# Conventional Commits 1.0.0 패턴
# <type>(<scope>)!: <description>
PATTERN='^(feat|fix|docs|style|refactor|perf|test|build|chore|ci|revert|merge)(\([a-zA-Z0-9._-]+\))?!?: .+'

if ! echo "$MSG" | grep -qP "$PATTERN"; then
  jq -n '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "deny",
      "permissionDecisionReason": "Conventional Commits 1.0.0 위반.\n형식: <type>(<scope>): <description>\ntype: feat | fix | docs | style | refactor | perf | test | build | chore | ci | revert | merge\n예시: feat(parser): 새 파싱 규칙 추가\n스펙: https://www.conventionalcommits.org/en/v1.0.0/"
    }
  }'
  exit 0
fi

exit 0
