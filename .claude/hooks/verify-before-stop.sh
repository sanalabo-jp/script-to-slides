#!/bin/bash
# Stop Hook: 응답 완료 전 전체 빌드 검증
# vite build로 타입 + import + CSS + 라우팅 + 번들링 전체 검증

cd "$CLAUDE_PROJECT_DIR" || exit 0

OUTPUT=$(npm run build 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  jq -n --arg reason "$OUTPUT" '{
    "decision": "block",
    "reason": ("Build failed:\n" + $reason)
  }'
  exit 0
fi

exit 0
