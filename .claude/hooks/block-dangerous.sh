#!/bin/bash
# Hook B: 위험한 Bash 명령 차단
# 이벤트: PreToolUse (Bash)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# rm -rf 차단
if echo "$COMMAND" | grep -qE 'rm\s+-rf\s+/|rm\s+-rf\s+\.\s*$|rm\s+-rf\s+\.\.\s*$'; then
  echo "rm -rf with dangerous path is blocked" >&2
  exit 2
fi

# git push --force to main/master 차단
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*--force.*\s+(main|master)|git\s+push\s+-f.*\s+(main|master)'; then
  echo "Force push to main/master is blocked" >&2
  exit 2
fi

# npm publish 차단 (실수 방지)
if echo "$COMMAND" | grep -qE 'npm\s+publish'; then
  echo "npm publish is blocked — use manual publish" >&2
  exit 2
fi

exit 0
