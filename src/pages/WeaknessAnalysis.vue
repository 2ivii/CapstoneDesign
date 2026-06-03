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

          <div v-if="isLoading" class="bg-white rounded-xl p-8 shadow-sm text-center text-gray-600">
            약점 분석 데이터를 불러오는 중입니다.
          </div>

          <div v-else-if="errorMessage" class="bg-white rounded-xl p-8 shadow-sm text-center text-red-600">
            {{ errorMessage }}
          </div>

          <div v-else class="space-y-6">
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
                    :cx="getScoreX(i, currentAnalysis.recentScores.length)"
                    :cy="240 - (s.score / 100) * 220"
                    r="5"
                    :fill="currentSubjectData.color"
                  >
                    <title>{{ s.exam }} 모의고사 - 점수: {{ s.score }}점</title>
                  </circle>
                  <!-- Grade dots + tooltips -->
                  <circle
                    v-for="(s, i) in currentAnalysis.recentScores"
                    :key="'gd' + i"
                    :cx="getScoreX(i, currentAnalysis.recentScores.length)"
                    :cy="240 - ((9 - s.grade) / 8) * 220"
                    r="5"
                    fill="#94a3b8"
                  >
                    <title>{{ s.exam }} 모의고사 - 등급: {{ s.grade }}등급</title>
                  </circle>
                  <!-- X labels -->
                  <text
                    v-for="(s, i) in currentAnalysis.recentScores"
                    :key="'xl' + i"
                    :x="getScoreX(i, currentAnalysis.recentScores.length)"
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
import { ref, computed, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { ArrowLeft, Target, BookOpen, TrendingUp, TrendingDown, AlertCircle, Sparkles } from 'lucide-vue-next'

type Trend = 'up' | 'down'
type Difficulty = '상' | '중' | '하'

type UnitAccuracy = {
  unit: string
  accuracy: number
  total: number
  correct: number
}

type WeakConcept = {
  concept: string
  wrongCount: number
  difficulty: Difficulty
}

type RecentScore = {
  exam: string
  score: number
  grade: number
}

type SubjectAnalysis = {
  id: string
  name: string
  overallAccuracy: number
  grade: string
  trend: Trend
  unitAccuracy: UnitAccuracy[]
  weakConcepts: WeakConcept[]
  recentScores: RecentScore[]
}

type SubjectTab = {
  id: string
  name: string
  color: string
}

const STUDENT_ID = 1
const API_BASE_URL =
  (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? 'http://localhost:3000'

const subjectColors: Record<string, string> = {
  korean: '#f59e0b',
  math: '#10b981',
  english: '#3b82f6',
  science1: '#8b5cf6',
  science2: '#06b6d4',
  history: '#ec4899',
  국어: '#f59e0b',
  수학: '#10b981',
  영어: '#3b82f6',
  사회: '#f97316',
  과학: '#06b6d4',
  한국사: '#ec4899',
  생명과학1: '#8b5cf6',
  지구과학1: '#06b6d4',
}

const subjectOrder = ['korean', 'math', 'english', '사회', '과학', 'history']

const emptyAnalysis: SubjectAnalysis = {
  id: '',
  name: '',
  overallAccuracy: 0,
  grade: '-',
  trend: 'up',
  unitAccuracy: [],
  weakConcepts: [],
  recentScores: [],
}

const selectedSubject = ref('')
const isLoading = ref(true)
const errorMessage = ref('')
const analysisData = ref<Record<string, SubjectAnalysis>>({})

const subjects = computed<SubjectTab[]>(() =>
  Object.values(analysisData.value)
    .sort((a, b) => {
      const aIndex = subjectOrder.indexOf(a.id)
      const bIndex = subjectOrder.indexOf(b.id)
      const normalizedAIndex = aIndex === -1 ? subjectOrder.length : aIndex
      const normalizedBIndex = bIndex === -1 ? subjectOrder.length : bIndex

      return normalizedAIndex - normalizedBIndex || a.name.localeCompare(b.name)
    })
    .map((subject) => ({
      id: subject.id,
      name: subject.name,
      color: subjectColors[subject.id] ?? '#64748b',
    })),
)

const currentAnalysis = computed(() => analysisData.value[selectedSubject.value] ?? emptyAnalysis)
const currentSubjectData = computed(
  () => subjects.value.find((subject) => subject.id === selectedSubject.value) ?? {
    id: '',
    name: '',
    color: '#64748b',
  },
)

const getScoreX = (index: number, total: number) => {
  if (total <= 1) {
    return 205
  }

  return 65 + index * (280 / (total - 1))
}

onMounted(async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${STUDENT_ID}/weak-areas/summary`)
    if (!response.ok) {
      throw new Error(`약점 분석 데이터를 불러오지 못했습니다. (${response.status})`)
    }

    const data = await response.json() as { subjects?: SubjectAnalysis[] }
    const nextAnalysisData = Object.fromEntries(
      (data.subjects ?? []).map((subject) => [subject.id, subject]),
    )

    analysisData.value = nextAnalysisData
    selectedSubject.value = subjects.value[0]?.id ?? ''
    errorMessage.value = data.subjects?.length ? '' : '조회할 과목 데이터가 없습니다.'
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : '약점 분석 데이터를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
})

const scoreLinePoints = computed(() => {
  const scores = currentAnalysis.value.recentScores
  return scores.map((s, i) => {
    const x = getScoreX(i, scores.length)
    const y = 240 - (s.score / 100) * 220
    return `${x},${y}`
  }).join(' ')
})

const gradeLinePoints = computed(() => {
  const scores = currentAnalysis.value.recentScores
  return scores.map((s, i) => {
    const x = getScoreX(i, scores.length)
    const y = 240 - ((9 - s.grade) / 8) * 220
    return `${x},${y}`
  }).join(' ')
})
</script>
