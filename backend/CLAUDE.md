# 백엔드 (에듀핏)

NestJS 10 + TypeORM + PostgreSQL.

## 명령어 (이 폴더에서 실행)
- `npm run start:dev` (개발) / `npm run build` / `npm run typecheck`

## 구조
backend/
├── src/
│   ├── main.ts            # 진입점 (CORS, PORT)
│   ├── app.module.ts      # 루트 모듈 (ConfigModule + TypeORM 연결)
│   ├── entities/          # TypeORM 엔티티
│   │   ├── index.ts       # 배럴 export
│   │   ├── student.entity.ts
│   │   ├── mock-exam.entity.ts
│   │   ├── exam-subject.entity.ts
│   │   ├── exam-data.entity.ts
│   │   ├── weak-area.entity.ts
│   │   ├── study-plan.entity.ts
│   │   ├── plan-slot.entity.ts
│   │   ├── chat-session.entity.ts
│   │   └── chat-message.entity.ts
│   └── weak-area/         # 취약영역 분석 도메인
│       ├── weak-area.module.ts
│       ├── weak-area.controller.ts
│       └── weak-area.service.ts
├── nest-cli.json
├── .env.example           # DB 접속·PORT 환경변수 (실제 .env는 gitignore)
└── package.json

## 환경변수 (.env)
- `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` — Postgres 접속
- `DB_SYNC` — `true`면 엔티티 스키마 자동 동기화(개발용)
- `PORT` — 서버 포트(기본 3000)

## API
- `POST /students/:studentId/weak-areas` — 학생의 모든 과목에 대해 취약영역 분석·생성.
  틀린 문항(`ExamSubject.wrong_answer`) ↔ 문제 메타(`ExamData.category`)를 매칭해
  세부 개념별 오답을 집계 → `WeakArea` 저장(재호출 시 기존 결과 삭제 후 재생성).
  content 한 줄 생성은 `WeakAreaService.buildContent()`로 분리(향후 LLM 교체 지점).

## 엔티티 및 관계
- Student → ExamSubject, StudyPlan, ChatSession (각 1:N)
- MockExam → ExamSubject, ExamData (각 1:N)
- ExamSubject → WeakArea (1:N) / Student·MockExam에 N:1
- StudyPlan → PlanSlot (1:N)
- ChatSession → ChatMessage (1:N)
- 모든 PK는 `@PrimaryGeneratedColumn('increment')` (number 자동 증가).

## 규칙
- 신규 엔티티 추가 시 `entities/index.ts`에도 등록.
- 엔티티 컬럼/관계 변경 시 양방향(@OneToMany ↔ @ManyToOne) 일관성 유지.
