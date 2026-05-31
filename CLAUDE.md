# 러너스하이 — AI 학습 코치

스터디카페·학원용 태블릿 기반 AI 학습관리 모듈.
성적 기반 취약영역 분석 → AI 학습 플래닝 → 문제풀이 챗봇.

## 프로젝트 구조
/                      # 프론트엔드 (Vue 3 + Vite + TS + Tailwind v4)
├── src/
│   ├── pages/         # 페이지 컴포넌트
│   ├── components/    # 재사용 컴포넌트
│   ├── router/        # 라우터 (index.ts)
│   ├── styles/        # index.css, theme.css, fonts.css
│   ├── App.vue
│   └── main.ts        # 진입점
├── backend/           # 백엔드 (NestJS) — 상세는 backend/CLAUDE.md
├── vite.config.ts
├── tsconfig.json
└── index.html

## 프론트엔드
- import 별칭 `@/` = `src/`
- 명령어: `pnpm dev` (:5173) / `pnpm build` / `pnpm preview`

## 규칙
- Vue는 Composition API + `<script setup lang="ts">`.
- 페이지 데이터는 현재 하드코딩된 mock — API 연동 시 교체.
- 차트(Chart.js/ECharts)·수식(KaTeX)·LLM 클라이언트는 미설치 가능성 있음. 사용 전 package.json 확인.