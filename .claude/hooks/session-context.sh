#!/bin/bash
# Hook G: 세션 시작 시 프로젝트 상태 자동 수집
# 이벤트: SessionStart
# Claude에게 현재 프로젝트 상태를 시스템 메시지로 주입

cd "$CLAUDE_PROJECT_DIR" || exit 0

# git 정보 수집
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "no commits")
DIRTY_FILES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
UNTRACKED=$(git status --porcelain 2>/dev/null | grep '^?' | wc -l | tr -d ' ')

# 컨텍스트 메시지 생성
CONTEXT="[프로젝트 상태] branch: ${BRANCH} | 최근 커밋: ${LAST_COMMIT} | 변경 파일: ${DIRTY_FILES}개 | 미추적: ${UNTRACKED}개"

jq -n --arg ctx "$CONTEXT" '{
  "systemMessage": $ctx
}'

exit 0
