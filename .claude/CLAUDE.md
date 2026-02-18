# Script-to-Slides 프로젝트 메모리

## 프로젝트 개요
대본(스크립트) 파일을 슬라이드 프레젠테이션으로 자동 변환하는 웹 유틸리티.
- **대본 형식**: `name[role]: (description) dialogue` — 각 줄이 1개 슬라이드
- **배포 URL**: https://script-to-slides-five.vercel.app
- **GitHub**: sanalabo-jp/script-to-slides
- **현재 버전**: v1.1.1
- **활성 브랜치**: main

## 브랜치 전략
- **main**: 안정 릴리스 브랜치. feature/fix 브랜치의 머지 대상
- **feature/\***, **fix/\***: main에서 분기, 작업 완료 후 main에 --no-ff 병합
- **dev**: 사용 종료 (beta 기간 한정 사용)
- **태그**: v1.0.0, v1.0.1, v1.0.2, v1.1.0, v1.1.1 (현재)

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
[1] Upload (File 탭 / Manual 탭) → [2] Preview → [3] Template Style → [3b] Template Layout (optional) → [4] Generate
```
- Template Layout: 레이아웃 에디터 (캔버스 드래그 + 리사이즈 + 팔레트 + 속성 패널)
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
│   │   ├── slideGenerator.ts     # PPTX 생성 (cover + content slides, elements 기반 zIndex 렌더링)
│   │   ├── themeEngine.ts        # AI 테마 → pptxgenjs config (safeColor 포함)
│   │   └── visualMapper.ts       # AI 시각요소 → pptxgenjs shapes (safeColor 포함)
│   ├── parser/
│   │   ├── scriptParser.ts       # 대본 텍스트 파싱 (name[role]: (desc) dialogue)
│   │   ├── pptxTemplateParser.ts # .pptx → SlideTemplate 추출 (JSZip + DOMParser, 색상 modifier + gradient fallback)
│   │   └── pptxTemplateUtils.ts  # 파서 순수 함수 + 타입 (색상 modifier, HSL 변환, mergeStyles, buildTemplate 등)
│   ├── templates/
│   │   ├── presets.ts            # 프리셋 3종 + LECTURE_LAYOUT 좌표 (elements 배열 구조)
│   │   ├── templateUtils.ts      # 템플릿 유틸 (findElement, getPrimaryStyle, deriveSecondaryFontStyle, createBlankCustomTemplate, resolveUniqueName)
│   │   └── layoutUtils.ts        # 레이아웃 좌표 변환 (toPixel/toInch, clamp, snap, ELEMENT_COLORS/LABELS, MIN_ELEMENT_SIZE, computeOverlaps, getNextZIndex, normalizeZIndexes, reorderZIndex, mixColors)
│   ├── types/
│   │   └── index.ts              # 타입 정의 (Position, Size, ElementLayout, ElementFontStyle, ElementName, TemplateElement, SlideTemplate 등)
│   ├── utils/
│   │   ├── colorUtils.ts         # 화자 시그니처 컬러 생성 (HSL 기반)
│   │   └── chatTransform.ts      # ChatMessage[] → ParseResult 변환
│   └── components/
│       ├── FileUpload.svelte     # 파일 업로드 UI (가이드 접힘 + 주의 애니메이션)
│       ├── ScriptPreview.svelte  # 파싱 결과 미리보기
│       ├── ManualInputMode.svelte # 채팅 입력 메인 래퍼
│       ├── FrontMatterForm.svelte # 프론트매터 설정 (type, topic, categories)
│       ├── ChatInputArea.svelte  # 대사 입력 폼 + 화자 선택
│       ├── ChatCell.svelte       # 메시지 셀 (편집/삭제, 좌우 정렬, field-sizing: content 동적 크기)
│       ├── SpeakerSelector.svelte  # 화자 드롭다운 (추가/제거/선택)
│       ├── MetadataModal.svelte   # 행 메타데이터 key-value 편집 모달
│       ├── TemplateSelector.svelte # 프리셋 탭 (프리셋 목록 + tooltip)
│       ├── CustomTemplateTab.svelte # 커스텀 탭 (다중 파일 업로드 + 자동 저장 + 템플릿 리스트 + 에디터)
│       ├── TemplatePreviewCard.svelte # 재사용 4:3 미리보기 카드 (항상 border-2, title bold truncate, desc truncate 1줄, [*] 인라인)
│       ├── TemplateEditor.svelte  # 인라인 폼 (elements 기반 편집 + callout2 secondary 자동파생)
│       ├── TemplateTooltip.svelte # hover 시 floating 상세 미리보기 (항상 마운트, visible && template으로 제어)
│       ├── LayoutEditor.svelte    # 레이아웃 에디터 오케스트레이터 (수평 flex: Canvas flex-1 + 사이드바 w-[20%], ResizeObserver 높이 동기화, z-index re-rank 통합)
│       ├── LayoutCanvas.svelte    # 캔버스 — 불투명 배경 + zIndex 라벨 + 혼합색 겹침 해칭 + 드래그 이동/리사이즈(요소별 gridSize snap) + 드롭 타겟 + 우클릭 컨텍스트 메뉴 + outline 선택 + isolate
│       ├── LayoutPalettePopover.svelte # 캔버스 우측 하단 팝오버 — draggable 리스트 + opacity-35/hover + 빈 캔버스 시 opacity-100 + pulse + flash pulse(요소 제거 시 1회) + capture phase dismiss
│       └── LayoutPropertyPanel.svelte # 속성 패널 — 캔버스 우측 사이드바(h-full) + 세로 Figma 레이아웃 (Element name + ELEMENT_COLORS dot / Position & Size / Snap + custom 토글) + t-input-border
├── routes/
│   ├── +page.svelte              # 메인 페이지 (4단계 UI, template-style/template-layout 분리)
│   ├── +layout.svelte            # 레이아웃
│   └── api/
│       ├── analyze/+server.ts    # Gemini AI 분석 API (모델 폴백 체인)
│       └── generate/+server.ts   # (미사용 - 클라이언트로 이동됨)
└── app.css                        # 터미널 스타일 유틸리티 (t-card, t-btn 등), 애니메이션
```

## Svelte 5 주의사항
- `$state` proxy에 `structuredClone()` 직접 사용 불가 → `$state.snapshot()`으로 먼저 unwrap
- 탭/조건부 컴포넌트 상태 보존: `{#if}` 대신 `class:hidden` 사용 (destroy/recreate 방지)
- TemplateEditor의 `initialTemplate` prop은 `$state.snapshot`으로 unwrap 후 `structuredClone`으로 독립 복사

## CSS/레이아웃 주의사항
- **border-width 변경 → 레이아웃 시프트**: 선택 시 `outline` + `outline-offset:-1px` 사용 (box model 무영향). border는 항상 1px 유지
- **`isolation: isolate`**: 캔버스에 적용 — 내부 z-index(요소 1-6, 해칭 998)가 외부 팝오버(z:100)와 독립
- **capture phase 이벤트**: `addEventListener(type, handler, true)` — `stopPropagation()`이 bubble만 차단하므로 팝오버 dismiss에 활용
- **`field-sizing: content`**: 폼 요소 크기를 값에 맞춰 자동 조절 (Chrome 123+, Edge 123+, Firefox/Safari 미지원)
- **`w-fit` + `<input>` 기본 크기**: `<input type="text">`는 default `size=20` (~150px). `w-fit` 부모 안에서 `w-full` 사용 시 순환 참조 → 브라우저가 intrinsic size 사용 → 의도치 않은 확장
- **`flex flex-col` + `align-items: stretch`**: `w-full` 없이도 부모 너비를 채우면서, intrinsic sizing에서는 각 자식의 max-content 기반으로 크기 결정
- **`h-full` + CSS Grid**: grid cell 안에 여러 요소가 있을 때 `h-full`이 전체 cell 높이로 확장 → 의도치 않은 크기 증가
- **flex 내 `truncate`**: flex 자식에 `min-w-0` 필수 (기본 `min-width: auto`가 overflow 방지)

## CustomTemplateTab 구조 (현재)
- **customTemplates[]**: 사용자 생성/추출 템플릿 리스트 (컴포넌트 내부 상태, hidden으로 탭 전환 시 보존)
- **Section 1**: Your Templates — grid-cols-3 + [del]/[edit] 버튼 (right-align, `/` 구분자), radio group 선택
- **Section 2**: Add New — 드롭존(항상 표시) + [create new template](에디터 닫힘 시만 표시). 다중 파일 추출 `multiple` 지원
- **Section 3**: Editor — 에디터 폼 + 라이브 프리뷰, [cancel] + [add this template]/[update template]
- **EditorMode**: 'none' | 'new-extract' | 'new-scratch' | 'edit'
- **다중 파일 업로드**: `handleFiles()` — 완전 추출(`isPartial=false`) → 자동 리스트 추가, 부분 추출(`isPartial=true`) → 에디터 열기
- **에디터 자동 저장**: `autoSaveEditorIfNeeded()` — 새 추출 시작 전 에디터에 미저장 내용이 있으면 자동 저장
- **중복 이름 처리**: `resolveUniqueName(name, existingNames)` → 자동 _1, _2 접미사
- **PPTX 다운로드 파일명**: `template.name` (공백 → `_`)

## UI 디자인 컨벤션
- **테마**: macOS Terminal 스타일 모노크롬 (font-mono, gray 팔레트)
- **CSS 클래스**: `@layer components`에 `.t-card`, `.t-btn`, `.t-btn-text`, `.t-code` 등 정의
- **애니메이션**: `animate-guide-attention` (비대칭 1.8s, gray-900 피크), `animate-palette-attention` (팔레트 전용 1.8s pulse), `animate-palette-flash` (전용 palette-flash 0.8s 1회), `animate-cell-in` (셀 슬라이드인)
- **탭 스타일**: `.input-tab`, `.input-tab-active` (File/Manual 전환용)
- **모달**: `.modal-overlay`, `.modal-card`
- **버튼 그룹**: `[del] / [edit]` 순서, `/` 구분자, edit는 `font-bold`
- **카드 선택 표시**: `[*]`를 title 우측 인라인 (인증마크 스타일, absolute 아님)

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

### UI 요소 → 데이터 소스 매핑 (확정, 구현 완료)
| ElementName | 데이터 소스 | 표시 규칙 | 상태 |
|-------------|------------|-----------|------|
| `callout1` | `metadata` | `key · value, key · value, …` 1줄 | 구현 완료 |
| `callout2` | `speaker` | name(bold, styles[0]) + role(medium, styles[1]), 듀얼 텍스트 런 | 구현 완료 |
| `title` | `summary` | 1줄 | nullable (AI/요약 의존) |
| `body` | `context` | 대사 본문, wrap + lineSpacing | 구현 완료 |
| `image` | `image` | 4:3 종횡비 | nullable (기능3 검색 의존) |
| `caption` | `detail` | 좌측 하단, left align | nullable (AI/분석 의존) |
- `visualHint`: UI 노출 없음, 내부 로직 전용 (이미지 검색 힌트 등)
- `lineNumber` / `slideNumber`: 슬라이드 표시 보류
- **폰트 패밀리**: Noto Sans (전체 공통 기본값)

## 개발 로드맵 (beta-0.0.1 이후)

### 기능 1: 슬라이드쇼 템플릿 지정 옵션
- Phase 1 완료: 렌더러 비종속 추상 템플릿 프로토콜 + 기본 프리셋 3종
- Phase 2 완료: .pptx 업로드 → JSZip+OpenXML 파서로 스타일 추출 → SlideTemplate 변환 (graceful degradation, 색상 modifier 지원, gradient fallback)
- Phase 3 완료: 커스텀 템플릿 빌더 (템플릿 리스트 + edit/delete + radio group + TemplateEditor)
- Phase 4: AI 기반 템플릿 추천 (기능5 이후)

### 기능 2: 슬라이드 컨텐츠 배치 방식 재정의
- **핵심**: SlideTemplate에 layout(배치 좌표) 정보 추가 + 사용자 정의 레이아웃 에디터
- **스코프**: Lecture(강의) 타입 전용, ScriptType별 레이아웃은 이후 확장
- Phase 1 완료: SlideTemplate.elements 배열 + 렌더러 리팩토링 + Lecture 프리셋 레이아웃 + 컴포넌트 전환
- Phase 2 완료: 레이아웃 에디터 (드래그 이동/리사이즈 + 팝오버 D&D + z-index re-rank + 우클릭 컨텍스트 메뉴 + outline 선택 + 혼합색 겹침 해칭 + isolate + capture phase dismiss + 고정 높이 속성 패널 + 요소별 snap 간격 + 빈 캔버스 팔레트 pulse)
- Phase 3: .pptx 업로드 시 배치 정보 추출 (기능1 Phase 2 확장)
- **슬라이드 구성**: 표지(Cover) + 콘텐츠만 (엔딩 슬라이드 제거)
- **타입 구조**: `SlideTemplate { elements: TemplateElement[] }`, 각 TemplateElement = `{ name: ElementName, layout: ElementLayout, styles: ElementFontStyle[], enabled?: boolean }`, `ElementLayout.gridSize?: number` (snap 간격, 0=off, undefined=0.1")
- **듀얼 스타일**: callout2(speaker)는 styles[0]=name(primary,bold), styles[1]=role(secondary,derived)
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
| feature/pptx-template-extract | 기능1 Phase 2+3 — .pptx 추출 + 커스텀 빌더 + 버그 수정 | `da6184c` |
| feature/slide-layout-system | 기능2 Phase 1+2 — 레이아웃 에디터 시스템 (v1.1.0) | `3ffd5b0` |

## 해결된 주요 버그들 (beta-0.0.1)
1. vercel.json functions 패턴 오류 → functions 키 제거
2. pptxgenjs ESM 로딩 실패 → 클라이언트 사이드로 이동
3. 슬라이드 2장만 생성 → 테마 키 매핑 폴백 체인 룩업
4. Gemini 모델명 404 → gemini-3-flash-preview로 수정
5. Gemini 503 과부하 → 모델 폴백 체인
6. pptxgenjs .replace() 에러 → safeColor() + String() 캐스팅

## 해결된 버그들 (기능1 Phase 2+3)
7. TemplatePreviewCard 크기 불균일 → w-full 추가 (h-full은 이후 제거)
8. Custom 탭 섹션 소멸 (DataCloneError) → structuredClone → $state.snapshot 전환
9. 탭 전환 시 customTemplates 상태 소실 → {#if} → class:hidden
10. Custom 탭 카드가 Preset 탭보다 큼 → h-full 제거 (grid cell 내 [del]/[edit] 포함 시 확장 문제)
11. ChatCell 버튼 순서 불일치 → [del]/[edit] 순서로 통일
12. Custom 드롭존 크기 부족 → FileUpload와 동일 py-24 px-8
13. TemplatePreviewCard border 선택 시 레이아웃 시프트 → 항상 border-2 유지 (color만 변경)
14. 툴팁 DOM 삽입/제거 → 항상 마운트 + visible && template 조건으로 제어
15. 파서 색상 modifier 미지원 → applyColorModifiers (tint/shade/lumMod/lumOff/satMod/satOff)
16. 단일 파일만 업로드 가능 + 에디터 미저장 소실 → handleFiles 다중 파일 + autoSaveEditorIfNeeded
17. ChatCell 편집 모드 너비 고정 → editWidth 제거, field-sizing: content, flex flex-col

## 해결된 버그들 (v1.0.2 UX)
18. 템플릿 삭제 시 잔존 툴팁 → handleDeleteTemplate()에서 명시적 tooltip 리셋 ({#each} DOM 즉시 제거로 onmouseleave 미발생)
19. 탭 전환 시 이전 선택 잔존 → selectedTemplate null 초기화 (Presets↔Custom 전환 시 Generate 버튼 부적절 활성화 방지)
20. 에디터 열린 상태에서 드롭존 숨김 → Section 2의 `{#if editorMode === 'none'}` 래핑 제거, 드롭존 항상 표시 + [create new template]만 조건부
