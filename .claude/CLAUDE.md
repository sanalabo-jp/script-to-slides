# Script-to-Slides 프로젝트 메모리

## 프로젝트 개요
대본(스크립트) 파일을 슬라이드 프레젠테이션으로 자동 변환하는 웹 유틸리티.
- **대본 형식**: `name[role]: (description) dialogue` — 각 줄이 1개 슬라이드
- **배포 URL**: https://script-to-slides-five.vercel.app
- **GitHub**: sanalabo-jp/script-to-slides
- **현재 버전**: beta-0.0.1 (1차 구현 완료, 2025-02-09)

## 브랜치 전략
- **main**: 안정 릴리스 브랜치. beta 이후 정식 버전(0.0.1~)부터 직접 feature 분기 → PR 머지
- **dev**: 개발 통합 브랜치. beta 기간 동안 feature 브랜치의 머지 대상
- **feature/\***: dev에서 분기, 기능 구현 후 dev에 병합
- **태그**: beta-0.0.1 (현재) → beta 탈출 시 0.0.1로 정식 태깅

## 기술 스택
- **프레임워크**: SvelteKit 5 + TypeScript
- **배포**: Vercel (Hobby plan, adapter-vercel, maxDuration: 60s)
- **슬라이드 생성**:
  - pptxgenjs v4.0.1 — 클라이언트 사이드 .pptx 다운로드
  - Google Slides API — 서버 사이드 Google Slides 생성 (구현 예정)
- **AI 분석**: Google Gemini (@google/genai)
  - Gemini API Key: Vercel 환경변수 `GEMINI_API_KEY`
  - 모델: Vercel 환경변수 `GEMINI_MODEL` (현재 `gemini-3-flash-preview`)
  - 코드 기본값: `gemini-2.5-flash`
  - 폴백 체인: 설정 모델 → `gemini-2.5-flash` → `gemini-2.0-flash` → 정적 fallback
  - thinking 모델에 `thinkingBudget: 2048` 설정

## 아키텍처 (데이터 흐름)
```
Upload (.txt) → scriptParser.ts → ParseResult
  → /api/analyze (서버: Gemini AI) → 구조화된 데이터 (GeminiAnalysisResult)
    ├→ [pptxgenjs]        → .pptx 로컬 다운로드
    └→ [Google Slides API] → Google Slides URL 반환 (구현 예정)
```

## 핵심 파일 구조
```
src/
├── lib/
│   ├── ai/
│   │   ├── geminiClient.ts     # Gemini API 호출 + fallbackAnalysis()
│   │   └── prompts.ts          # AI 프롬프트 (발화자 키, JSON 형식 강제)
│   ├── generator/
│   │   ├── slideGenerator.ts   # PPTX 생성 (title + content + ending slides)
│   │   ├── themeEngine.ts      # AI 테마 → pptxgenjs config (safeColor 포함)
│   │   └── visualMapper.ts     # AI 시각요소 → pptxgenjs shapes (safeColor 포함)
│   ├── parser/
│   │   └── scriptParser.ts     # 대본 텍스트 파싱 (name[role]: (desc) dialogue)
│   ├── types/
│   │   └── index.ts            # 타입 정의 (ScriptLine, GeminiAnalysisResult 등)
│   └── components/
│       ├── FileUpload.svelte   # 파일 업로드 UI
│       └── ScriptPreview.svelte # 파싱 결과 미리보기
├── routes/
│   ├── +page.svelte            # 메인 페이지 (4단계 UI + 클라이언트 PPTX 생성)
│   ├── +layout.svelte          # 레이아웃
│   └── api/
│       ├── analyze/+server.ts  # Gemini AI 분석 API (모델 폴백 체인)
│       └── generate/+server.ts # (미사용 - 클라이언트로 이동됨)
└── app.d.ts
```

## Vercel 설정
- `vercel.json`: `{ "$schema": "...", "framework": "sveltekit" }` (최소화)
- `svelte.config.js`: adapter-vercel, runtime nodejs22.x, maxDuration 60
- 환경변수: `GEMINI_API_KEY`, `GEMINI_MODEL` (All Environments)

## 대본 파일 포맷 (v2 — 확정)

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

--chapter: 제2장 스트레스의 매커니즘과 영향
강사[진행자]: (뇌 편도체 다이어그램) 스트레스를 느끼면 뇌의 편도체가 반응합니다.
```

### 파서 규칙
- **프론트매터**: 파일 최상단 ~ `---` 이전. `-key: value` 형식, 단일 줄바꿈 구분
  - `---` 구분자는 전후 1줄 공백을 두는 것을 관례로 함
  - type enum: 0=범용, 1=드라마, **2=강의(이번 버전)**, 3=뉴스, 4=대담
  - 유형별 고정 키 없이 권장 스키마로 운용, 추후 유형별 특화 확장
- **행 메타데이터**: `---` 이후 `--key: value` 형식. 연속된 라인만 유효 블록
  - 연속 메타데이터 + 바로 이어지는 row = 하나의 블록
  - 블록 아래 연속된 row는 동일 metadata 공유
  - 이중 줄바꿈으로 분리 시 별개 블록 (metadata ↔ row 단절 시 metadata 파기)
- **description**: `()` 내 시각 요소 힌트. optional, 비어있거나 없으면 null
- **dialogue**: `name[role]:` 뒤의 대사 텍스트

### 슬라이드 데이터 구조 (파싱+AI 처리 후)
| 필드 | 소스 | 설명 |
|------|------|------|
| `speaker` | 파싱 (name[role]) | {name, role} — metadata와 동등 계층 |
| `context` | 파싱 (dialogue) | 화자의 대사, 슬라이드 주요 콘텐츠 |
| `metadata` | 파싱 (--key: value) | key-value 자유 구성 |
| `visualHint` | 파싱 (description) | 시각 요소 힌트, optional |
| `summary` | AI 생성 | context 요약, 최대 28자 1줄 |
| `image` | 검색/색인 (기능3) | 프론트매터+metadata+토큰 기반 검색 결과 |
| `detail` | AI 생성 | context 및 image 설명 |
- image, detail은 콘텐츠 확정 후 생성. 기능 3, 5 구현 전까지 null

### UI 요소 매핑 (초안 — 레이아웃 상세는 기능2에서 확정)
- **callout1_label**: speaker 표시 (name, role — 쉼표 구분), 1줄 고정, 11pt/#999999/regular
- **callout2_label**: metadata 표시 (value · 구분), 최대 2줄 (초과 시 …), 10pt/callout1보다 연한 색/regular
- **title_label**: summary, 14pt/#434343/bold, 1줄 overflow …
- **body_label**: context, 12pt/#434343/medium
- **image**: 4:3, 스타일 없음
- **caption_label**: detail, 9pt/lightgray/regular, left-align
- **폰트 패밀리**: Noto Sans (전체 공통)
- 특수 슬라이드: 표지 1장만 (topic, categories, 화자 목록)

## 개발 로드맵 (beta-0.0.1 이후)

### 기능 1: 슬라이드쇼 템플릿 지정 옵션
- 렌더러 비종속 추상 템플릿 데이터 구조(프로토콜) 정의
- 기본 프리셋 3종 (blank + 자체 제작 2종)
- UI Step 1: 템플릿 선택 → Step 2: 대본 입력 순서
- **Phase 1**: 프로토콜 정의 + 기본 프리셋
- **Phase 2**: .pptx 업로드 → 파서로 스타일 추출 → 프로토콜 변환
- **Phase 3**: 커스텀 템플릿 빌더 (레이아웃 + 컬러팔레트 조합)
- **Phase 4**: AI 기반 템플릿 추천 (기능5 이후)

### 기능 2: 슬라이드 컨텐츠 배치 방식 재정의
- 각 슬라이드 내 텍스트, 이미지, 키워드 등의 레이아웃 구성 로직 개선
- 배경/여백, image 부재 시 레이아웃 전환 등 상세 계획 이 시점에서 확정

### 기능 3: 관련 시각적 정보 색인 로직
- 각 슬라이드에 포함될 관련 시각 자료를 자동 색인
- 프론트매터 + metadata + 토큰화된 본문으로 이미지 검색

### 기능 4: 관련 외부 정보 색인 로직
- 각 슬라이드에 포함될 외부 링크, 검색 결과 등 참조 정보를 자동 색인

### 기능 5: 대사(row) 토큰화 및 핵심 추출
- 대본의 최소 단위(1줄 대사)를 토큰화하여 핵심사항 추출
- 토큰화 데이터를 활용한 문맥 기반 주요 정보 색인 및 분석 데이터셋 구축

### 기능 6: 듀얼 출력 지원 (로컬 .pptx + Google Slides)
- pptxgenjs를 통한 .pptx 로컬 다운로드 (기존)
- Google Slides API (presentations.create + batchUpdate)를 통한 Google Slides 생성
- 구조화된 데이터에서 두 렌더러로 분기하는 구조

## 참고: Google Slides API 조사 결과
- 템플릿 인스턴스화 메서드 없음. `presentations.create` + `batchUpdate`로 처음부터 생성 가능
- 이미지: 공개 URL만 지원 (PNG/JPEG/GIF), 비공개 Drive 이미지 직접 참조 불가
- OAuth 스코프: `presentations` (편집) + `drive` (파일 복제 시)
- Rate Limit: 무료, 유저당 분 60 요청

## 해결된 주요 버그들 (beta-0.0.1)
1. vercel.json functions 패턴 오류 → functions 키 제거
2. pptxgenjs ESM 로딩 실패 → 클라이언트 사이드로 이동
3. 슬라이드 2장만 생성 → 테마 키 매핑 폴백 체인 룩업
4. Gemini 모델명 404 → gemini-3-flash-preview로 수정
5. Gemini 503 과부하 → 모델 폴백 체인
6. pptxgenjs .replace() 에러 → safeColor() + String() 캐스팅
