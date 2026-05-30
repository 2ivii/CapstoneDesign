<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />

    <div class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto p-8">
        <!-- Back Button -->
        <button
          @click="$router.push('/answer-marking')"
          class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft :size="16" />
          이전 단계 (틀린 문항 체크)
        </button>

        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">과목별 약점 분석</h1>
          <p class="text-gray-600">최근 3회 모의고사 기록을 바탕으로 분석한 과목별 취약점입니다</p>
        </div>

        <!-- Subject Tabs -->
        <div class="mb-6">
          <div class="grid w-full grid-cols-6 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              v-for="subject in subjects"
              :key="subject.id"
              @click="selectedSubject = subject.id"
              class="py-3 rounded-md font-medium transition-colors text-center text-sm"
              :class="selectedSubject === subject.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'"
              :style="selectedSubject === subject.id ? { borderBottom: `3px solid ${subject.color}` } : {}"
            >
              {{ subject.name }}
            </button>
          </div>

          <div class="space-y-6">
            <!-- Overview Cards -->
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500 mb-1">전체 정답률</p>
                    <p class="text-2xl font-bold" :style="{ color: currentSubjectData.color }">
                      {{ currentAnalysis.overallAccuracy }}%
                    </p>
                  </div>
                  <Target :size="32" class="text-gray-400" />
                </div>
              </div>

              <div class="bg-white rounded-xl p-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500 mb-1">현재 등급</p>
                    <p class="text-2xl font-bold text-gray-900">{{ currentAnalysis.grade }}</p>
                  </div>
                  <BookOpen :size="32" class="text-gray-400" />
                </div>
              </div>

              <div class="bg-white rounded-xl p-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500 mb-1">최근 추세</p>
                    <div class="flex items-center gap-2">
                      <TrendingUp v-if="currentAnalysis.trend === 'up'" :size="20" class="text-emerald-600" />
                      <TrendingDown v-else :size="20" class="text-red-600" />
                      <span :class="['text-lg font-bold', currentAnalysis.trend === 'up' ? 'text-emerald-600' : 'text-red-600']">
                        {{ currentAnalysis.trend === 'up' ? '상승' : '하락' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-xl p-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500 mb-1">취약 개념 수</p>
                    <p class="text-2xl font-bold text-amber-600">
                      {{ currentAnalysis.weakConcepts.length }}개
                    </p>
                  </div>
                  <AlertCircle :size="32" class="text-amber-400" />
                </div>
              </div>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-2 gap-6">
              <!-- Unit Accuracy Bar Chart -->
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="text-lg font-bold mb-4">단원별 정답률</h3>
                <svg viewBox="0 0 400 280" class="w-full" style="height: 300px;">
                  <!-- Grid lines + Y labels -->
                  <g v-for="tick in [0, 20, 40, 60, 80, 100]" :key="tick">
                    <line
                      x1="50" :y1="240 - (tick / 100) * 220"
                      x2="390" :y2="240 - (tick / 100) * 220"
                      stroke="#f3f4f6" stroke-width="1"
                    />
                    <text x="44" :y="244 - (tick / 100) * 220" font-size="10" fill="#9ca3af" text-anchor="end">{{ tick }}</text>
                  </g>
                  <!-- Axes -->
                  <line x1="50" y1="20" x2="50" y2="240" stroke="#e5e7eb" stroke-width="1" />
                  <line x1="50" y1="240" x2="390" y2="240" stroke="#e5e7eb" stroke-width="1" />
                  <!-- Bars -->
                  <g v-for="(unit, i) in currentAnalysis.unitAccuracy" :key="unit.unit">
                    <rect
                      :x="50 + i * (340 / currentAnalysis.unitAccuracy.length) + (340 / currentAnalysis.unitAccuracy.length) * 0.15"
                      :y="240 - (unit.accuracy / 100) * 220"
                      :width="(340 / currentAnalysis.unitAccuracy.length) * 0.7"
                      :height="(unit.accuracy / 100) * 220"
                      :fill="currentSubjectData.color"
                      rx="4"
                    >
                      <title>{{ unit.unit }}: {{ unit.accuracy }}% ({{ unit.correct }}/{{ unit.total }})</title>
                    </rect>
                    <text
                      :x="50 + i * (340 / currentAnalysis.unitAccuracy.length) + (340 / currentAnalysis.unitAccuracy.length) * 0.5"
                      y="258"
                      font-size="9"
                      fill="#6b7280"
                      text-anchor="middle"
                    >{{ unit.unit }}</text>
                  </g>
                </svg>
              </div>

              <!-- Recent Score Trend Line Chart -->
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="text-lg font-bold mb-4">최근 3회 성적 추이</h3>
                <svg viewBox="0 0 420 280" class="w-full" style="height: 300px;">
                  <!-- Grid lines + left Y labels (score) -->
                  <g v-for="tick in [0, 20, 40, 60, 80, 100]" :key="tick">
                    <line
                      x1="50" :y1="240 - (tick / 100) * 220"
                      x2="360" :y2="240 - (tick / 100) * 220"
                      stroke="#f3f4f6" stroke-width="1"
                    />
                    <text x="44" :y="244 - (tick / 100) * 220" font-size="10" fill="#9ca3af" text-anchor="end">{{ tick }}</text>
                  </g>
                  <!-- Right Y labels (grade) -->
                  <g v-for="grade in [1, 3, 5, 7, 9]" :key="grade">
                    <text
                      x="366"
                      :y="244 - ((9 - grade) / 8) * 220"
                      font-size="9"
                      fill="#94a3b8"
                      text-anchor="start"
                    >{{ grade }}등급</text>
                  </g>
                  <!-- Axes -->
                  <line x1="50" y1="20" x2="50" y2="240" stroke="#e5e7eb" stroke-width="1" />
                  <line x1="50" y1="240" x2="365" y2="240" stroke="#e5e7eb" stroke-width="1" />
                  <line x1="365" y1="20" x2="365" y2="240" stroke="#e5e7eb" stroke-width="1" />
                  <!-- Score line -->
                  <polyline
                    :points="scoreLinePoints"
                    fill="none"
                    :stroke="currentSubjectData.color"
                    stroke-width="2"
                  />
                  <!-- Grade line (dashed) -->
                  <polyline
                    :points="gradeLinePoints"
                    fill="none"
                    stroke="#94a3b8"
                    stroke-width="2"
                    stroke-dasharray="5 5"
                  />
                  <!-- Score dots + tooltips -->
                  <circle
                    v-for="(s, i) in currentAnalysis.recentScores"
                    :key="'sd' + i"
                    :cx="65 + i * (280 / (currentAnalysis.recentScores.length - 1))"
                    :cy="240 - (s.score / 100) * 220"
                    r="5"
                    :fill="currentSubjectData.color"
                  >
                    <title>{{ s.exam }}월 모의고사 - 점수: {{ s.score }}점</title>
                  </circle>
                  <!-- Grade dots + tooltips -->
                  <circle
                    v-for="(s, i) in currentAnalysis.recentScores"
                    :key="'gd' + i"
                    :cx="65 + i * (280 / (currentAnalysis.recentScores.length - 1))"
                    :cy="240 - ((9 - s.grade) / 8) * 220"
                    r="5"
                    fill="#94a3b8"
                  >
                    <title>{{ s.exam }}월 모의고사 - 등급: {{ s.grade }}등급</title>
                  </circle>
                  <!-- X labels -->
                  <text
                    v-for="(s, i) in currentAnalysis.recentScores"
                    :key="'xl' + i"
                    :x="65 + i * (280 / (currentAnalysis.recentScores.length - 1))"
                    y="258"
                    font-size="10"
                    fill="#6b7280"
                    text-anchor="middle"
                  >{{ s.exam }}</text>
                  <!-- Legend -->
                  <rect x="58" y="13" width="14" height="4" :fill="currentSubjectData.color" rx="2" />
                  <text x="76" y="18" font-size="10" fill="#6b7280">점수</text>
                  <line x1="115" y1="15" x2="129" y2="15" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3 3" />
                  <text x="133" y="18" font-size="10" fill="#6b7280">등급</text>
                </svg>
              </div>
            </div>

            <!-- Weak Concepts -->
            <div class="bg-white rounded-xl p-6 shadow-sm">
              <div class="flex items-center gap-2 mb-6">
                <AlertCircle :size="20" class="text-amber-600" />
                <h3 class="text-lg font-bold">취약 개념 및 유형</h3>
              </div>
              <div class="space-y-4">
                <div
                  v-for="(item, index) in currentAnalysis.weakConcepts"
                  :key="index"
                  class="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <h3 class="font-semibold text-gray-900">{{ item.concept }}</h3>
                      <span
                        :class="[
                          'text-xs px-2 py-1 rounded font-medium',
                          item.difficulty === '상' ? 'bg-red-100 text-red-700' :
                          item.difficulty === '중' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        ]"
                      >
                        난이도 {{ item.difficulty }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600">최근 3회 모의고사에서 총 {{ item.wrongCount }}문제 오답</p>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-bold text-red-600">{{ item.wrongCount }}</p>
                    <p class="text-xs text-gray-500">오답 문항</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Unit Details -->
            <div class="bg-white rounded-xl p-6 shadow-sm">
              <h3 class="text-lg font-bold mb-6">단원별 상세 정보</h3>
              <div class="space-y-4">
                <div
                  v-for="(unit, index) in currentAnalysis.unitAccuracy"
                  :key="index"
                  class="space-y-2"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-gray-900">{{ unit.unit }}</span>
                    <span class="text-sm text-gray-600">{{ unit.correct }}/{{ unit.total }} ({{ unit.accuracy }}%)</span>
                  </div>
                  <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-2 rounded-full transition-all duration-500"
                      :style="{ width: unit.accuracy + '%', backgroundColor: currentSubjectData.color }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Actions -->
        <div class="mt-8 flex items-center justify-between">
          <button
            @click="$router.push('/answer-marking')"
            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← 이전 단계 (틀린 문항 체크)
          </button>
          <button
            @click="$router.push('/ai-planner')"
            class="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg flex items-center gap-2"
          >
            <Sparkles :size="16" />
            AI 학습 플래너 생성 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { ArrowLeft, Target, BookOpen, TrendingUp, TrendingDown, AlertCircle, Sparkles } from 'lucide-vue-next'

const selectedSubject = ref('korean')

const subjects = [
  { id: 'korean', name: '국어', color: '#10b981' },
  { id: 'math', name: '수학', color: '#3b82f6' },
  { id: 'english', name: '영어', color: '#8b5cf6' },
  { id: 'science1', name: '생명과학1', color: '#f59e0b' },
  { id: 'science2', name: '지구과학1', color: '#06b6d4' },
  { id: 'history', name: '한국사', color: '#ec4899' },
]

const analysisData: Record<string, any> = {
  korean: {
    overallAccuracy: 78,
    grade: '2등급',
    trend: 'up',
    unitAccuracy: [
      { unit: '문학', accuracy: 85, total: 15, correct: 13 },
      { unit: '독서', accuracy: 72, total: 20, correct: 14 },
      { unit: '언어와 매체', accuracy: 75, total: 10, correct: 7 },
    ],
    weakConcepts: [
      { concept: '고전소설 주제 파악', wrongCount: 4, difficulty: '상' },
      { concept: '비문학 추론 문제', wrongCount: 6, difficulty: '상' },
      { concept: '문법 - 음운 변동', wrongCount: 3, difficulty: '중' },
    ],
    recentScores: [
      { exam: '3월', score: 72, grade: 3 },
      { exam: '4월', score: 76, grade: 2 },
      { exam: '5월', score: 78, grade: 2 },
    ],
  },
  math: {
    overallAccuracy: 65,
    grade: '3등급',
    trend: 'down',
    unitAccuracy: [
      { unit: '수열', accuracy: 55, total: 8, correct: 4 },
      { unit: '미분', accuracy: 70, total: 10, correct: 7 },
      { unit: '적분', accuracy: 68, total: 7, correct: 5 },
      { unit: '기하', accuracy: 60, total: 5, correct: 3 },
    ],
    weakConcepts: [
      { concept: '수열의 극한 응용', wrongCount: 5, difficulty: '상' },
      { concept: '적분을 이용한 넓이', wrongCount: 4, difficulty: '상' },
      { concept: '도함수 활용', wrongCount: 3, difficulty: '중' },
    ],
    recentScores: [
      { exam: '3월', score: 70, grade: 2 },
      { exam: '4월', score: 68, grade: 3 },
      { exam: '5월', score: 65, grade: 3 },
    ],
  },
  english: {
    overallAccuracy: 88,
    grade: '1등급',
    trend: 'up',
    unitAccuracy: [
      { unit: '듣기', accuracy: 95, total: 17, correct: 16 },
      { unit: '독해-주제', accuracy: 85, total: 10, correct: 8 },
      { unit: '독해-빈칸', accuracy: 80, total: 8, correct: 6 },
      { unit: '독해-순서', accuracy: 90, total: 10, correct: 9 },
    ],
    weakConcepts: [
      { concept: '빈칸 추론 (고난도)', wrongCount: 2, difficulty: '상' },
      { concept: '장문 독해', wrongCount: 2, difficulty: '중' },
      { concept: '어법 판단', wrongCount: 1, difficulty: '중' },
    ],
    recentScores: [
      { exam: '3월', score: 84, grade: 1 },
      { exam: '4월', score: 86, grade: 1 },
      { exam: '5월', score: 88, grade: 1 },
    ],
  },
  science1: {
    overallAccuracy: 75,
    grade: '2등급',
    trend: 'up',
    unitAccuracy: [
      { unit: '생명과학의 이해', accuracy: 90, total: 3, correct: 3 },
      { unit: '세포와 연속성', accuracy: 70, total: 6, correct: 4 },
      { unit: '항상성과 조절', accuracy: 65, total: 7, correct: 5 },
      { unit: '유전', accuracy: 80, total: 4, correct: 3 },
    ],
    weakConcepts: [
      { concept: '호르몬과 항상성', wrongCount: 3, difficulty: '상' },
      { concept: '유전자 발현', wrongCount: 2, difficulty: '상' },
      { concept: '신경계', wrongCount: 2, difficulty: '중' },
    ],
    recentScores: [
      { exam: '3월', score: 70, grade: 3 },
      { exam: '4월', score: 73, grade: 2 },
      { exam: '5월', score: 75, grade: 2 },
    ],
  },
  science2: {
    overallAccuracy: 70,
    grade: '2등급',
    trend: 'down',
    unitAccuracy: [
      { unit: '고체 지구', accuracy: 75, total: 6, correct: 4 },
      { unit: '대기와 해양', accuracy: 65, total: 7, correct: 5 },
      { unit: '우주', accuracy: 72, total: 7, correct: 5 },
    ],
    weakConcepts: [
      { concept: '판 구조론', wrongCount: 3, difficulty: '상' },
      { concept: '기압과 날씨', wrongCount: 4, difficulty: '중' },
      { concept: '별의 특성', wrongCount: 2, difficulty: '중' },
    ],
    recentScores: [
      { exam: '3월', score: 75, grade: 2 },
      { exam: '4월', score: 72, grade: 2 },
      { exam: '5월', score: 70, grade: 2 },
    ],
  },
  history: {
    overallAccuracy: 82,
    grade: '2등급',
    trend: 'up',
    unitAccuracy: [
      { unit: '선사·고대', accuracy: 85, total: 5, correct: 4 },
      { unit: '고려 시대', accuracy: 80, total: 5, correct: 4 },
      { unit: '조선 시대', accuracy: 78, total: 5, correct: 4 },
      { unit: '근현대사', accuracy: 88, total: 5, correct: 4 },
    ],
    weakConcepts: [
      { concept: '고대 국가의 발전', wrongCount: 2, difficulty: '중' },
      { concept: '조선 시대 정치 제도', wrongCount: 1, difficulty: '중' },
      { concept: '근대 개화기', wrongCount: 1, difficulty: '하' },
    ],
    recentScores: [
      { exam: '3월', score: 78, grade: 2 },
      { exam: '4월', score: 80, grade: 2 },
      { exam: '5월', score: 82, grade: 2 },
    ],
  },
}

const currentAnalysis = computed(() => analysisData[selectedSubject.value])
const currentSubjectData = computed(() => subjects.find(s => s.id === selectedSubject.value)!)

const scoreLinePoints = computed(() => {
  const scores = currentAnalysis.value.recentScores
  const n = scores.length
  const step = n > 1 ? 280 / (n - 1) : 0
  return scores.map((s: any, i: number) => {
    const x = 65 + i * step
    const y = 240 - (s.score / 100) * 220
    return `${x},${y}`
  }).join(' ')
})

const gradeLinePoints = computed(() => {
  const scores = currentAnalysis.value.recentScores
  const n = scores.length
  const step = n > 1 ? 280 / (n - 1) : 0
  return scores.map((s: any, i: number) => {
    const x = 65 + i * step
    const y = 240 - ((9 - s.grade) / 8) * 220
    return `${x},${y}`
  }).join(' ')
})
</script>
