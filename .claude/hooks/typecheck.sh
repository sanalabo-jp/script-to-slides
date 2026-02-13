#!/bin/bash
# PostToolUse Hook: 파일 수정 후 빠른 타입 체크 (비동기)
# .ts, .svelte 파일 수정 시에만 svelte-check 실행

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

case "$FILE" in
  *.ts|*.svelte)
    cd "$CLAUDE_PROJECT_DIR" || exit 0
    npm run check 2>&1
    ;;
  *)
    exit 0
    ;;
esac
