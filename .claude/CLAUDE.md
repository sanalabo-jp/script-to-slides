# Script-to-Slides 프로젝트 메모리

## 프로젝트 개요
대본(스크립트) 파일을 슬라이드 프레젠테이션으로 자동 변환하는 웹 유틸리티.
- **대본 형식**: `name[role]: (description) dialogue` — 각 줄이 1개 슬라이드
- **배포 URL**: https://script-to-slides-five.vercel.app
- **GitHub**: sanalabo-jp/script-to-slides
- **현재 버전**: beta-0.0.1

## 브랜치 전략
- **main**: 안정 릴리스 브랜치. beta 이후 정식 버전(0.0.1~)부터 직접 feature 분기 → PR 머지
- **dev**: 개발 통합 브랜치. beta 기간 동안 feature 브랜치의 머지 대상
- **feature/\***: dev에서 분기, 기능 구현 후 dev에 --no-ff 병합
- **태그**: beta-0.0.1 (현재) → beta 탈출 시 0.0.1로 정식 태깅

## 기술 스택
- **프레임워크**: SvelteKit 5 + Svelte 5 (runes: $state, $derived, $props) + TypeScript
- **스타일링**: Tailwind CSS 4.1.18 (@tailwindcss/vite 플러그인), 터미널 스타일 모노크롬 UI
- **배포**: Vercel (Hobby plan, adapter-vercel, maxDuration: 60s)
- **슬라이드 생성**: pptxgenjs v4.0.1 — 클라이언트 사이드 .pptx 다운로드
- **AI 분석**: Google Gemini (@google/genai)
  - Gemini API Key: Vercel 환경변수 `GEMINI_API_KEY`
  - 모델: Vercel 환경변수 `GEMINI_MODEL` (현재 `gemini-3-flash-preview`)
  - 코드 기본값: `gemini-2.5-flash`
  - 폴백 체인: 설정 모델 → `gemini-2.5-flash` → `gemini-2.0-flash` → 정적 fallback
  - thinking 모델에 `thinkingBudget: 2048` 설정

## 아키텍처 (데이터 흐름)
```
입력 모드 2가지:
  [File]   Upload (.txt) → scriptParser.ts → ParseResult
  [Manual] FrontMatter + ChatMessages → chatTransform.ts → ParseResult

ParseResult
  → /api/analyze (서버: Gemini AI) → GeminiAnalysisResult
    → slideGenerator.ts (클라이언트: pptxgenjs) → .pptx download
```

## UI 흐름 (4단계)
```
[1] Upload (File 탭 / Manual 탭) → [2] Preview → [3] Template → [4] Generate
```
- File 탭: .txt 파일 드래그 앤 드롭 업로드
- Manual 탭: 채팅 스타일로 대사를 한 줄씩 직접 입력 (실험적)

## 핵심 파일 구조
```
src/
├── lib/
│   ├── ai/
│   │   ├── geminiClient.ts       # Gemini API 호출 + fallbackAnalysis()
│   │   └── prompts.ts            # AI 프롬프트 (발화자 키, JSON 형식 강제)
│   ├── generator/
│   │   ├── slideGenerator.ts     # PPTX 생성 (title + content + ending slides)
│   │   ├── themeEngine.ts        # AI 테마 → pptxgenjs config (safeColor 포함)
│   │   └── visualMapper.ts       # AI 시각요소 → pptxgenjs shapes (safeColor 포함)
│   ├── parser/
│   │   └── scriptParser.ts       # 대본 텍스트 파싱 (name[role]: (desc) dialogue)
│   ├── types/
│   │   └── index.ts              # 타입 정의 (ScriptLine, ChatMessage, SpeakerProfile 등)
│   ├── utils/
│   │   ├── colorUtils.ts         # 화자 시그니처 컬러 생성 (HSL 기반)
│   │   └── chatTransform.ts      # ChatMessage[] → ParseResult 변환
│   └── components/
│       ├── FileUpload.svelte     # 파일 업로드 UI (가이드 접힘 + 주의 애니메이션)
│       ├── ScriptPreview.svelte  # 파싱 결과 미리보기
│       ├── ManualInputMode.svelte # 채팅 입력 메인 래퍼
│       ├── FrontMatterForm.svelte # 프론트매터 설정 (type, topic, categories)
│       ├── ChatInputArea.svelte  # 대사 입력 폼 + 화자 선택
│       ├── ChatCell.svelte       # 메시지 셀 (편집/삭제, 좌우 정렬)
│       ├── SpeakerSelector.svelte # 화자 드롭다운 (추가/제거/선택)
│       └── MetadataModal.svelte  # 행 메타데이터 key-value 편집 모달
├── routes/
│   ├── +page.svelte              # 메인 페이지 (4단계 UI, File/Manual 탭 토글)
│   ├── +layout.svelte            # 레이아웃
│   └── api/
│       ├── analyze/+server.ts    # Gemini AI 분석 API (모델 폴백 체인)
│       └── generate/+server.ts   # (미사용 - 클라이언트로 이동됨)
└── app.css                        # 터미널 스타일 유틸리티 (t-card, t-btn 등), 애니메이션
```

## UI 디자인 컨벤션
- **테마**: macOS Terminal 스타일 모노크롬 (font-mono, gray 팔레트)
- **CSS 클래스**: `@layer components`에 `.t-card`, `.t-btn`, `.t-btn-text`, `.t-code` 등 정의
- **애니메이션**: `animate-guide-attention` (비대칭 1.8s, gray-900 피크), `animate-cell-in` (셀 슬라이드인)
- **탭 스타일**: `.input-tab`, `.input-tab-active` (File/Manual 전환용)
- **모달**: `.modal-overlay`, `.modal-card`

## Vercel 설정
- `vercel.json`: `{ "$schema": "...", "framework": "sveltekit" }` (최소화)
- `svelte.config.js`: adapter-vercel, runtime nodejs22.x, maxDuration 60
- 환경변수: `GEMINI_API_KEY`, `GEMINI_MODEL` (All Environments)

## 대본 파일 포맷 (v2)

### 포맷 예시
```
-type: 2
-topic: 멘탈헬스 기초교육
-categories: 정신건강, 직장인교육, 스트레스관리

---

--chapter: 제1장 멘탈헬스란 무엇인가
--note: 학습목표 - 멘탈헬스의 정의와 중요성을 이해한다
강사[진행자]: 여러분 안녕하세요.
강사[진행자]: (WHO 로고와 정의 텍스트 표시) 멘탈헬스란 단순히 병이 없는 상태가 아닙니다.
```

### 파서 규칙
- **프론트매터**: 파일 최상단 ~ `---` 이전. `-key: value` 형식
  - type enum: 0=범용, 1=드라마, 2=강의, 3=뉴스, 4=대담
- **행 메타데이터**: `---` 이후 `--key: value` 형식. 연속된 라인만 유효 블록
  - 연속 메타데이터 + 바로 이어지는 row = 하나의 블록
  - 이중 줄바꿈으로 분리 시 별개 블록
- **description**: `()` 내 시각 요소 힌트. optional
- **dialogue**: `name[role]:` 뒤의 대사 텍스트

### 슬라이드 데이터 구조 (파싱+AI 처리 후)
| 필드 | 소스 | 설명 |
|------|------|------|
| `speaker` | 파싱 (name[role]) | {name, role} |
| `context` | 파싱 (dialogue) | 화자의 대사, 슬라이드 주요 콘텐츠 |
| `metadata` | 파싱 (--key: value) | key-value 자유 구성 |
| `visualHint` | 파싱 (description) | 시각 요소 힌트, optional |
| `summary` | AI 생성 | context 요약, 최대 28자 1줄 |
| `image` | 검색/색인 (기능3) | 프론트매터+metadata+토큰 기반 검색 결과 |
| `detail` | AI 생성 | context 및 image 설명 |

### UI 요소 매핑 (초안)
- **callout1_label**: speaker 표시, 11pt/#999999/regular
- **callout2_label**: metadata 표시, 최대 2줄, 10pt
- **title_label**: summary, 14pt/#434343/bold
- **body_label**: context, 12pt/#434343/medium
- **image**: 4:3
- **caption_label**: detail, 9pt/lightgray/regular
- **폰트 패밀리**: Noto Sans (전체 공통)

## 개발 로드맵 (beta-0.0.1 이후)

### 기능 1: 슬라이드쇼 템플릿 지정 옵션
- Phase 1 완료: 렌더러 비종속 추상 템플릿 프로토콜 + 기본 프리셋 3종
- Phase 2: .pptx 업로드 → 파서로 스타일 추출 → 프로토콜 변환
- Phase 3: 커스텀 템플릿 빌더
- Phase 4: AI 기반 템플릿 추천 (기능5 이후)

### 기능 2: 슬라이드 컨텐츠 배치 방식 재정의
### 기능 3: 관련 시각적 정보 색인 로직
### 기능 4: 관련 외부 정보 색인 로직
### 기능 5: 대사 토큰화 및 핵심 추출
### 기능 6: 듀얼 출력 지원 (로컬 .pptx + Google Slides)

## 참고: Google Slides API
- 템플릿 인스턴스화 메서드 없음. `presentations.create` + `batchUpdate`로 생성
- 이미지: 공개 URL만 지원, OAuth 스코프: `presentations` + `drive`
- Rate Limit: 무료, 유저당 분 60 요청

## 완료된 feature 브랜치 이력
| 브랜치 | 내용 | 머지 커밋 |
|--------|------|-----------|
| feature/template-system | 기능1 Phase1 — 템플릿 시스템 + v2 파서 | `4e62fca` |
| feature/ui-terminal-style | macOS Terminal 스타일 UI 리디자인 | `1c1df9a` |
| feature/upload-ux-improve | 드롭존 확대, 가이드 접힘 기본값, 주의 애니메이션 | `ce9214a` |
| feature/manual-chat-input | 채팅 스타일 수동 대본 입력 모드 | `1849ff3` |

## 해결된 주요 버그들 (beta-0.0.1)
1. vercel.json functions 패턴 오류 → functions 키 제거
2. pptxgenjs ESM 로딩 실패 → 클라이언트 사이드로 이동
3. 슬라이드 2장만 생성 → 테마 키 매핑 폴백 체인 룩업
4. Gemini 모델명 404 → gemini-3-flash-preview로 수정
5. Gemini 503 과부하 → 모델 폴백 체인
6. pptxgenjs .replace() 에러 → safeColor() + String() 캐스팅
