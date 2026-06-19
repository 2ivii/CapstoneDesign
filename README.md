# 에듀핏 (EduFit AI) - Vue.js 버전

React에서 Vue.js로 변환한 학습 관리 애플리케이션입니다.

## 📋 프로젝트 설명

이 프로젝트는 학생들의 성적 관리와 학습 계획을 돕는 AI 기반 웹 애플리케이션입니다.

### 주요 기능

1. **성적표 촬영** - 성적표를 업로드하고 자동으로 점수를 인식
2. **오답 마킹** - 틀린 문항을 선택하고 관리
3. **약점 분석** - 과목별 취약점을 시각화하여 분석
4. **AI 학습 플래너** - 집중도 패턴 기반 최적 학습 시간표 생성
5. **AI 챗봇** - 문제 풀이를 도와주는 AI 튜터

## 🚀 시작하기

### 필요 조건

- Node.js 18.0 이상
- pnpm (권장) 또는 npm

### 설치 방법

```bash
# 1. 의존성 설치
pnpm install
# 또는
npm install

# 2. 개발 서버 실행
pnpm dev
# 또는
npm run dev

# 3. 브라우저에서 http://localhost:5173 접속
```

### 빌드

```bash
# 프로덕션 빌드
pnpm build

# 빌드 결과 미리보기
pnpm preview
```

## 🛠 기술 스택

- **Vue 3** - 프론트엔드 프레임워크
- **TypeScript** - 타입 안정성
- **Vue Router** - 라우팅
- **Tailwind CSS v4** - 스타일링
- **Vite** - 빌드 도구
- **lucide-vue-next** - 아이콘

## 📁 프로젝트 구조

```
vue-conversion/
├── src/
│   ├── components/      # 재사용 가능한 컴포넌트
│   │   └── Sidebar.vue
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── ScoreRegistration.vue
│   │   ├── AnswerMarking.vue
│   │   ├── WeaknessAnalysis.vue
│   │   ├── AIPlanner.vue
│   │   └── AIChatbot.vue
│   ├── router/         # 라우터 설정
│   │   └── index.ts
│   ├── styles/         # 스타일 파일
│   │   ├── index.css
│   │   ├── theme.css
│   │   └── fonts.css
│   ├── App.vue         # 루트 컴포넌트
│   └── main.ts         # 앱 진입점
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

## 🎨 디자인 시스템

### 색상 테마

- **Primary**: Emerald (에메랄드 그린)
- **Secondary**: Gray
- **Accent**: Purple, Orange, Blue

### 주요 컴포넌트

- Sidebar 네비게이션
- 과목별 탭
- 점수 입력 폼
- 문항 선택 그리드
- 차트 및 통계 카드

## 📱 페이지 구조

1. **/ (ScoreRegistration)** - 성적표 촬영 및 점수 입력
2. **/answer-marking** - 틀린 문항 마킹
3. **/analysis** - 과목별 약점 분석
4. **/ai-planner** - AI 학습 플래너
5. **/ai-chatbot** - AI 문제풀이 챗봇

## 🔄 React에서 Vue로 변환된 주요 변경 사항

### 1. 상태 관리
```typescript
// React
const [state, setState] = useState(initialValue)

// Vue
const state = ref(initialValue)
```

### 2. 이벤트 처리
```vue
<!-- React -->
<button onClick={handleClick}>

<!-- Vue -->
<button @click="handleClick">
```

### 3. 조건부 렌더링
```vue
<!-- React -->
{condition && <Component />}

<!-- Vue -->
<Component v-if="condition" />
```

### 4. 리스트 렌더링
```vue
<!-- React -->
{items.map(item => <Component key={item.id} />)}

<!-- Vue -->
<Component v-for="item in items" :key="item.id" />
```

## 📝 라이선스

이 프로젝트는 원본 디자인을 Vue.js로 변환한 것입니다.

## 🤝 기여

버그 리포트나 기능 제안은 Issues를 통해 제출해주세요.

---

**Note**: 이 프로젝트는 React 버전에서 디자인을 그대로 유지하면서 Vue.js로 변환되었습니다.
