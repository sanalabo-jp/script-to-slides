# Script-to-Slides

## 프로젝트 개요
대본(스크립트) 파일을 슬라이드 프레젠테이션으로 자동 변환하는 웹 유틸리티.
- **대본 형식**: `name[role]: (description) dialogue` — 각 줄이 1개 슬라이드
- **배포 URL**: https://script-to-slides-five.vercel.app
- **GitHub**: sanalabo-jp/script-to-slides
- **현재 버전**: v1.1.1

## 브랜치 전략
- **main**: 안정 릴리스 브랜치. feature/fix 브랜치의 머지 대상
- **feature/\***, **fix/\***: main에서 분기, 작업 완료 후 main에 `--no-ff` 병합

## 기술 스택
- **프레임워크**: SvelteKit 5 + Svelte 5 (runes: $state, $derived, $props) + TypeScript
- **스타일링**: Tailwind CSS 4 (@tailwindcss/vite), 터미널 스타일 모노크롬 UI
- **배포**: Vercel (Hobby plan, adapter-vercel, maxDuration: 60s)
- **슬라이드 생성**: pptxgenjs v4.0.1 — 클라이언트 사이드 .pptx 다운로드
- **AI 분석**: Google Gemini (@google/genai)
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
[1] Upload (File/Manual) → [2] Preview → [3] Template Style → [3b] Template Layout → [4] Generate
```

## 파일 구조
```
src/
├── lib/
│   ├── ai/
│   │   ├── geminiClient.ts         # Gemini API 호출 + fallback
│   │   └── prompts.ts              # AI 프롬프트
│   ├── generator/
│   │   ├── slideGenerator.ts       # PPTX 생성 (elements 기반 zIndex 렌더링)
│   │   ├── themeEngine.ts          # AI 테마 → pptxgenjs config
│   │   └── visualMapper.ts         # AI 시각요소 → pptxgenjs shapes
│   ├── parser/
│   │   ├── scriptParser.ts         # 대본 텍스트 파싱
│   │   ├── pptxTemplateParser.ts   # .pptx → SlideTemplate 추출
│   │   └── pptxTemplateUtils.ts    # 파서 순수 함수 (색상 modifier, HSL 변환 등)
│   ├── templates/
│   │   ├── presets.ts              # 프리셋 3종 + LECTURE_LAYOUT 좌표
│   │   ├── templateUtils.ts        # 템플릿 유틸 (findElement, deriveSecondaryFontStyle 등)
│   │   └── layoutUtils.ts          # 레이아웃 좌표 변환 (toPixel/toInch, clamp, snap 등)
│   ├── types/index.ts              # 타입 정의 (SlideTemplate, TemplateElement 등)
│   ├── utils/
│   │   ├── colorUtils.ts           # 화자 시그니처 컬러 (HSL)
│   │   └── chatTransform.ts        # ChatMessage[] → ParseResult
│   └── components/
│       ├── FileUpload.svelte       # 파일 업로드 + Script Format Guide
│       ├── ScriptPreview.svelte    # 파싱 결과 미리보기
│       ├── ManualInputMode.svelte  # 채팅 입력 래퍼
│       ├── FrontMatterForm.svelte  # 프론트매터 설정
│       ├── ChatInputArea.svelte    # 대사 입력 폼
│       ├── ChatCell.svelte         # 메시지 셀 (편집/삭제)
│       ├── SpeakerSelector.svelte  # 화자 드롭다운
│       ├── MetadataModal.svelte    # 행 메타데이터 모달
│       ├── TemplateSelector.svelte # 프리셋 탭
│       ├── CustomTemplateTab.svelte # 커스텀 탭 (업로드 + 에디터)
│       ├── TemplatePreviewCard.svelte # 4:3 미리보기 카드
│       ├── TemplateEditor.svelte   # 스타일 편집 폼
│       ├── TemplateTooltip.svelte  # hover 상세 미리보기
│       ├── LayoutEditor.svelte     # 레이아웃 에디터 오케스트레이터
│       ├── LayoutCanvas.svelte     # 캔버스 (드래그/리사이즈/컨텍스트 메뉴)
│       ├── LayoutPalettePopover.svelte # 요소 팔레트 팝오버
│       └── LayoutPropertyPanel.svelte  # 속성 패널 사이드바
├── routes/
│   ├── +page.svelte              # 메인 페이지 (4단계 UI)
│   ├── +layout.svelte            # 레이아웃
│   └── api/analyze/+server.ts    # Gemini AI 분석 API
└── app.css                        # 글로벌 스타일 + 애니메이션
```

## 대본 파일 포맷 (v2)

### 예시
```
-type: 2
-topic: 멘탈헬스 기초교육
-categories: 정신건강, 직장인교육, 스트레스관리
---
--chapter: 제1장 멘탈헬스란 무엇인가
강사[진행자]: (WHO 로고 표시) 멘탈헬스란 단순히 병이 없는 상태가 아닙니다.
```

### 파서 규칙
- **프론트매터**: `---` 이전. `-key: value` 형식. type: 0=범용, 1=드라마, 2=강의, 3=뉴스, 4=대담
- **행 메타데이터**: `---` 이후 `--key: value`. 연속 메타데이터 + 직후 row = 하나의 블록
- **대사**: `name[role]: (visual hint) dialogue text`

### 슬라이드 데이터 구조
| 필드 | 소스 | 설명 |
|------|------|------|
| `speaker` | 파싱 | {name, role} |
| `context` | 파싱 | 화자의 대사 |
| `metadata` | 파싱 | key-value (--key: value) |
| `visualHint` | 파싱 | 시각 요소 힌트, optional |
| `summary` | AI | context 요약, 1줄 |
| `image` | 기능3 | 검색 결과 (미구현) |
| `detail` | AI | context/image 설명 |

### UI 요소 → 데이터 소스 매핑
| ElementName | 소스 | 비고 |
|-------------|------|------|
| `callout1` | metadata | `key · value, …` 1줄 |
| `callout2` | speaker | 듀얼 스타일: name(bold) + role(medium) |
| `title` | summary | nullable (AI 의존) |
| `body` | context | 대사 본문 |
| `image` | image | nullable (기능3 의존) |
| `caption` | detail | nullable (AI 의존) |

## 개발 로드맵

| 기능 | 상태 | 설명 |
|------|------|------|
| **기능1** 템플릿 | Phase 1-3 완료 | 프리셋 + .pptx 추출 + 커스텀 빌더 |
| **기능1** Phase 4 | 대기 | AI 기반 템플릿 추천 (기능5 이후) |
| **기능2** 레이아웃 | Phase 1-2 완료 | elements 배열 + 에디터 (Lecture 전용) |
| **기능2** Phase 3 | **다음** | .pptx 업로드 시 배치 정보 추출 |
| **기능3** | 미착수 | 관련 시각적 정보 색인 |
| **기능4** | 미착수 | 관련 외부 정보 색인 |
| **기능5** | 미착수 | 대사 토큰화 및 핵심 추출 |
| **기능6** | 미착수 | 듀얼 출력 (.pptx + Google Slides) |

### 핵심 타입 구조 (기능2)
- `SlideTemplate { elements: TemplateElement[] }`
- `TemplateElement { name: ElementName, layout: ElementLayout, styles: ElementFontStyle[], enabled?: boolean }`
- `ElementLayout { position, size, zIndex, gridSize? }` — gridSize: snap 간격 (0=off, undefined=0.1")
- callout2: styles[0]=name(primary,bold), styles[1]=role(secondary,derived)
- 슬라이드 구성: 표지(Cover) + 콘텐츠만 (엔딩 제거)

## UI 컨벤션
- **테마**: macOS Terminal 모노크롬 (font-mono, gray 팔레트)
- **글로벌 클래스**: `.t-card`, `.t-btn`, `.t-btn-text`, `.t-code`, `.t-input-border`, `.input-tab`
- **애니메이션**: `animate-pulse-attention` (1.2s pulse), `animate-palette-flash` (0.8s 1회), `animate-blink`
- **버튼 그룹**: `[del] / [edit]` 순서, `/` 구분자, edit는 `font-bold`
- **카드 선택**: `[*]` title 우측 인라인

## Vercel 설정
- `svelte.config.js`: adapter-vercel, runtime nodejs22.x, maxDuration 60
- 환경변수: `GEMINI_API_KEY`, `GEMINI_MODEL`

## 참고: Google Slides API
- 템플릿 인스턴스화 없음. `presentations.create` + `batchUpdate`로 생성
- 이미지: 공개 URL만, OAuth: `presentations` + `drive`
- Rate Limit: 유저당 분 60 요청
