# Script-to-Slides 프로젝트 메모리

## 프로젝트 개요
대본(스크립트) 파일을 PowerPoint 프레젠테이션으로 자동 변환하는 웹 유틸리티.
- **대본 형식**: `name[role]: (description) dialogue` — 각 줄이 1개 슬라이드
- **배포 URL**: https://script-to-slides-five.vercel.app
- **GitHub**: sanalabo-jp/script-to-slides
- **상태**: 1차 구현 완료 (2025-02-09), 전체 파이프라인 정상 동작 확인

## 기술 스택
- **프레임워크**: SvelteKit 5 + TypeScript
- **배포**: Vercel (Hobby plan, adapter-vercel, maxDuration: 60s)
- **PPTX 생성**: pptxgenjs v4.0.1 — **클라이언트 사이드** (Vercel ESM 호환 문제로 서버→클라이언트 이동)
- **AI 분석**: Google Gemini (@google/genai)
  - Gemini API Key: Vercel 환경변수 `GEMINI_API_KEY`
  - 모델: Vercel 환경변수 `GEMINI_MODEL` (현재 `gemini-3-flash-preview`)
  - 코드 기본값: `gemini-2.5-flash`
  - 폴백 체인: 설정 모델 → `gemini-2.5-flash` → `gemini-2.0-flash` → 정적 fallback
  - thinking 모델에 `thinkingBudget: 2048` 설정

## 아키텍처 (데이터 흐름)
```
Upload (.txt) → scriptParser.ts → ParseResult
  → /api/analyze (서버: Gemini AI) → GeminiAnalysisResult
    → slideGenerator.ts (클라이언트: pptxgenjs) → .pptx download
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

## 해결된 주요 버그들
1. **vercel.json functions 패턴 오류** → functions 키 제거, SvelteKit 자체 라우팅 사용
2. **pptxgenjs ESM 로딩 실패 (Vercel)** → 서버→클라이언트 사이드로 PPTX 생성 이동
3. **슬라이드 2장만 생성 (핵심 버그)** → 테마 키 매핑: Gemini는 speaker 이름 키, 코드는 role 키로 조회 → 폴백 체인 룩업 구현
4. **Gemini 모델명 404** → `gemini-3-flash` (잘못됨) → `gemini-3-flash-preview` (정확한 API 식별자)
5. **Gemini 503 과부하** → 모델 폴백 체인 (3-flash-preview → 2.5-flash → 2.0-flash)
6. **pptxgenjs .replace() 에러** → safeColor() 헬퍼 + backgroundGradient 제거 + String() 캐스팅

## Vercel 설정
- `vercel.json`: `{ "$schema": "...", "framework": "sveltekit" }` (최소화)
- `svelte.config.js`: adapter-vercel, runtime nodejs22.x, maxDuration 60
- 환경변수: `GEMINI_API_KEY`, `GEMINI_MODEL` (All Environments)

## 테스트 대본
- 위치: `sample/test-lecture.txt`
- 10줄 한국어 대본, 3명 발화자: 김교수[진행자], 이수진[패널], 박연구원[전문가]
- 주제: AI의 미래

## 알려진 제한사항 / 향후 개선 가능
- pptxgenjs slide.background는 gradient 미지원 (solid color만)
- gemini-3-flash-preview가 503/504 발생 가능 (프리뷰 모델 한계)
- PDF 출력 미구현 (UI에 "Coming soon" 표시)
- 슬라이드 레이아웃/디자인 품질 개선 여지 있음
