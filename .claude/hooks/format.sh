#!/bin/bash
# Hook A: 파일 편집 후 자동 Prettier 포맷팅
# 이벤트: PostToolUse (Write|Edit)

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# file_path가 없으면 종료
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

# 포맷 대상 확장자만 처리
case "$FILE" in
  *.svelte|*.ts|*.js|*.css|*.json|*.html)
    npx prettier --write "$FILE" 2>/dev/null || true
    ;;
esac

exit 0
