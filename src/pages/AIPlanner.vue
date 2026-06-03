<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />

    <div class="flex-1 overflow-auto">
      <div class="max-w-[1800px] mx-auto p-8">
        <!-- Back Button -->
        <button
          @click="$router.push('/analysis')"
          class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft :size="16" />
          이전 단계 (약점 분석)
        </button>

        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-2">
            <Sparkles :size="32" class="text-emerald-600" />
            <h1 class="text-3xl font-bold text-gray-900">AI 학습 플래너</h1>
          </div>
          <p class="text-gray-600">
            집중도 패턴과 과목별 약점을 분석하여 최적의 학습 시간표를 생성합니다
          </p>
        </div>

        <!-- Timetable Card -->
        <div class="bg-white rounded-xl shadow-sm mb-6">
          <div class="px-6 pt-6 pb-2">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <Clock :size="20" class="text-emerald-600" />
                <h3 class="text-lg font-bold">주간 학습 시간표</h3>
              </div>
              <div class="flex items-center gap-1 text-sm text-gray-600">
                <Sparkles :size="16" />
                <span>집중도 높은 시간대 표시</span>
              </div>
            </div>
            <p class="text-sm text-gray-600">집중도가 높은 시간대(새벽, 밤)에는 약점 과목을 배치했습니다</p>
          </div>

          <div class="px-6 pb-4">
            <div class="bg-white rounded-lg p-2">
              <table class="w-full border-collapse" style="table-layout: fixed;">
                <colgroup>
                  <col style="width: 60px;" />
                  <col v-for="day in days" :key="day.key" />
                </colgroup>
                <thead>
                  <tr>
                    <th class="p-2 text-xs font-semibold text-gray-700 text-center">시간</th>
                    <th v-for="day in days" :key="day.key" class="p-2 text-xs font-semibold text-gray-700 text-center">
                      {{ day.label }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(time, rowIndex) in timeSlots" :key="rowIndex">
                    <td class="p-1 text-center text-xs font-medium text-gray-500">{{ time }}</td>
                    <template v-for="day in days" :key="day.key">
                      <td
                        v-if="shouldRenderCell(day.key, rowIndex)"
                        :rowspan="getRowSpan(day.key, rowIndex)"
                        class="p-1"
                      >
                        <div
                          v-if="getCellBlock(day.key, rowIndex)"
                          class="h-full min-h-[48px] rounded-lg p-2 flex flex-col justify-center"
                          :style="{
                            backgroundColor: getSubjectStyle(getCellBlock(day.key, rowIndex)!.subject).bgColor,
                            color: getSubjectStyle(getCellBlock(day.key, rowIndex)!.subject).textColor
                          }"
                        >
                          <div class="flex items-center justify-between mb-0.5">
                            <span class="font-bold text-xs">{{ getSubjectStyle(getCellBlock(day.key, rowIndex)!.subject).name }}</span>
                            <Sparkles
                              v-if="getCellBlock(day.key, rowIndex)!.concentration >= 80"
                              :size="12"
                              :style="{ color: getSubjectStyle(getCellBlock(day.key, rowIndex)!.subject).textColor, opacity: 0.7 }"
                            />
                          </div>
                          <span class="text-xs opacity-80">{{ getCellBlock(day.key, rowIndex)!.topic }}</span>
                        </div>
                        <div v-else class="min-h-[48px]" />
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Legend -->
            <div class="mt-4 flex items-center gap-6 text-sm flex-wrap">
              <div v-for="info in subjectLegend" :key="info.name" class="flex items-center gap-2">
                <div class="w-4 h-4 rounded" :style="{ backgroundColor: info.bgColor }" />
                <span class="text-gray-600">{{ info.name }}</span>
              </div>
              <div class="flex items-center gap-1 ml-auto">
                <Sparkles :size="16" class="text-gray-500" />
                <span class="text-gray-600">= 집중도 높은 시간대</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Section - 2 Columns -->
        <div class="grid grid-cols-2 gap-6">
          <!-- Subject Priority -->
          <div class="bg-white rounded-xl shadow-sm">
            <div class="px-6 pt-6 pb-2">
              <div class="flex items-center gap-2 mb-1">
                <Target :size="20" class="text-emerald-600" />
                <h3 class="text-lg font-bold">과목별 우선순위</h3>
              </div>
              <p class="text-sm text-gray-600">최우선은 등급 격차 2단계 이상, 높음은 등급 격차 1단계 또는 취약 단원 3개 이상입니다</p>
            </div>
            <div class="px-6 pb-6">
              <div class="space-y-4">
                <div
                  v-for="(subject, index) in subjectPriorities"
                  :key="index"
                  class="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-lg text-gray-900">{{ subject.subject }}</span>
                      <span :class="priorityBadgeClass(subject.priority)">
                        {{ priorityLabel(subject.priority) }}
                      </span>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-gray-500">현재 → 목표</p>
                      <p class="text-sm font-bold">{{ formatGrade(subject.current) }} → {{ formatGrade(subject.target) }}</p>
                    </div>
                  </div>
                  <div class="text-xs text-gray-500 mb-2">
                    취약 단원: {{ subject.weakUnits.join(', ') }}
                  </div>
                  <div v-if="subject.gap > 0" class="flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle :size="12" />
                    <span>등급 격차 {{ subject.gap }}단계 - 집중 학습 필요</span>
                  </div>
                  <div v-else class="text-xs text-gray-500">
                    {{ priorityReason(subject) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Recommendations -->
          <div class="bg-white rounded-xl shadow-sm">
            <div class="px-6 pt-6 pb-2">
              <div class="flex items-center gap-2 mb-1">
                <TrendingUp :size="20" class="text-emerald-600" />
                <h3 class="text-lg font-bold">지능형 시간 가중치 산출</h3>
              </div>
              <p class="text-sm text-gray-600">등급·진척 등급차 및 과목도 변별 차별 가능성을 복합 연산한 보정 결과입니다.</p>
            </div>
            <div class="px-6 pb-6">
              <div class="mb-6">
                <p class="text-sm font-semibold text-gray-700 mb-3">실시간 산출된 과목별 시간 권장 비중</p>
                <div class="space-y-4">
                  <div v-for="(subject, index) in subjectPriorities" :key="index">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-gray-900">{{ subject.subject }}</span>
                      <span class="text-sm font-bold" :style="{ color: subject.color }">
                        {{ subject.percentage }}%
                      </span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all"
                        :style="{ width: `${subject.percentage}%`, backgroundColor: subject.color }"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="p-4 bg-emerald-50 rounded-lg border border-emerald-200 mb-4">
                <div class="flex items-start gap-2">
                  <TrendingUp :size="20" class="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p class="text-sm font-semibold text-emerald-900">비전 AI OTR 연동 집중도 분석 결과</p>
                    <p class="text-xs text-emerald-700 mt-1">
                      고집중 시간대 {{ timeWeightAnalysis.highConcentrationTimes.join(', ') }}에 우선순위가 높은 과목을 배치했습니다.
                    </p>
                  </div>
                </div>
              </div>

              <button class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium">
                <CheckCircle :size="16" />
                이 주의 AI 추천 시간표 최종 수락
              </button>
              <button class="w-full mt-2 border border-gray-300 hover:bg-gray-50 py-2.5 rounded-lg font-medium text-gray-700">
                설정 다시 만들기
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Actions -->
        <div class="mt-8 flex items-center justify-between">
          <button
            @click="$router.push('/analysis')"
            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← 이전 단계 (약점 분석)
          </button>
          <button
            @click="$router.push('/ai-chatbot')"
            class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg"
          >
            학습 시작하기 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { ArrowLeft, Clock, Sparkles, Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-vue-next'

type SubjectStyle = {
  name: string
  color: string
  bgColor: string
  textColor: string
}

type Priority = 'urgent' | 'high' | 'medium'

type SubjectPriority = {
  subject: string
  current: number | null
  target: number | null
  priority: Priority
  gap: number
  weakUnits: string[]
  percentage: number
  color: string
  weight: number
}

type ApiPlanSlot = {
  subject: string
  unit: string
  date: string
  start_time: string
  end_time: string
}

type ApiPlanResponse = {
  analysis?: {
    subjectPriorities?: SubjectPriority[]
    timeWeightAnalysis?: {
      totalStudySlots: number
      maxSubjectSlots: number
      highConcentrationTimes: string[]
      formula: string
    }
  }
  slots?: ApiPlanSlot[]
}

const STUDENT_ID = 1
const API_BASE_URL =
  (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? 'http://localhost:3000'

const baseSubjectStyles: Record<string, SubjectStyle> = {
  수학: { name: '수학', color: '#10b981', bgColor: '#d1fae5', textColor: '#065f46' },
  국어: { name: '국어', color: '#f59e0b', bgColor: '#fef3c7', textColor: '#92400e' },
  영어: { name: '영어', color: '#3b82f6', bgColor: '#dbeafe', textColor: '#1e40af' },
  사회: { name: '사회', color: '#f97316', bgColor: '#ffedd5', textColor: '#9a3412' },
  과학: { name: '과학', color: '#06b6d4', bgColor: '#cffafe', textColor: '#155e75' },
  한국사: { name: '한국사', color: '#ec4899', bgColor: '#fce7f3', textColor: '#9d174d' },
  생명과학1: { name: '생명과학1', color: '#8b5cf6', bgColor: '#ede9fe', textColor: '#5b21b6' },
  지구과학1: { name: '지구과학1', color: '#06b6d4', bgColor: '#cffafe', textColor: '#155e75' },
  휴식: { name: '휴식', color: '#9ca3af', bgColor: '#f3f4f6', textColor: '#4b5563' },
}

const timeSlots = ['06시', '08시', '10시', '12시', '14시', '16시', '18시', '20시', '22시']

const days = ref([
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
  { key: 'sun', label: '일' },
])

type ScheduleBlock = {
  subject: string
  topic: string
  startRow: number
  rowSpan: number
  concentration: number
}

const weekSchedule = ref<Record<string, ScheduleBlock[]>>({})
const subjectPriorities = ref<SubjectPriority[]>([])
const timeWeightAnalysis = ref({
  totalStudySlots: 0,
  maxSubjectSlots: 0,
  highConcentrationTimes: [] as string[],
  formula: '',
})

const startRowsByTime: Record<string, number> = {
  '06:00': 0,
  '08:00': 1,
  '10:00': 2,
  '12:00': 3,
  '14:00': 4,
  '16:00': 5,
  '18:00': 6,
  '20:00': 7,
  '22:00': 8,
}

const subjectLegend = computed(() => {
  const subjects = new Set<string>()
  for (const blocks of Object.values(weekSchedule.value)) {
    for (const block of blocks) {
      subjects.add(block.subject)
    }
  }

  return [...subjects].map((subject) => getSubjectStyle(subject))
})

onMounted(async () => {
  const response = await fetch(`${API_BASE_URL}/students/${STUDENT_ID}/study-plans/latest`)
  if (!response.ok) {
    return
  }

  const data = await response.json() as ApiPlanResponse
  subjectPriorities.value = data.analysis?.subjectPriorities ?? []
  timeWeightAnalysis.value = data.analysis?.timeWeightAnalysis ?? timeWeightAnalysis.value
  applyScheduleSlots(data.slots ?? [])
})

function applyScheduleSlots(slots: ApiPlanSlot[]) {
  const dateKeys = [...new Set(slots.map((slot) => slot.date))]
  days.value = dateKeys.map((date, index) => ({
    key: date,
    label: formatDayLabel(date, index),
  }))

  weekSchedule.value = Object.fromEntries(
    dateKeys.map((date) => [
      date,
      slots
        .filter((slot) => slot.date === date)
        .map((slot) => ({
          subject: slot.subject,
          topic: slot.unit,
          startRow: startRowsByTime[slot.start_time.slice(0, 5)] ?? 0,
          rowSpan: 1,
          concentration: getConcentration(slot.start_time.slice(0, 5)),
        }))
        .sort((a, b) => a.startRow - b.startRow),
    ]),
  )
}

function formatDayLabel(date: string, index: number): string {
  const fallbackLabels = ['월', '화', '수', '목', '금', '토', '일']
  const parsedDate = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) {
    return fallbackLabels[index] ?? date
  }

  return new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(parsedDate)
}

function getConcentration(startTime: string): number {
  if (startTime === '06:00' || startTime === '20:00' || startTime === '22:00') {
    return 90
  }
  if (startTime === '08:00' || startTime === '10:00') {
    return 75
  }
  if (startTime === '12:00' || startTime === '18:00') {
    return 45
  }
  return 60
}

function getSubjectStyle(subject: string): SubjectStyle {
  return baseSubjectStyles[subject] ?? {
    name: subject,
    color: '#64748b',
    bgColor: '#f1f5f9',
    textColor: '#334155',
  }
}

function formatGrade(grade: number | null): string {
  return grade === null ? '-' : `${grade}등급`
}

function getCellBlock(dayKey: string, rowIndex: number): ScheduleBlock | undefined {
  return weekSchedule.value[dayKey]?.find(b => b.startRow === rowIndex)
}

function shouldRenderCell(dayKey: string, rowIndex: number): boolean {
  const schedule = weekSchedule.value[dayKey] ?? []
  if (schedule.find(b => b.startRow === rowIndex)) return true
  return !schedule.some(b => b.startRow < rowIndex && b.startRow + b.rowSpan > rowIndex)
}

function getRowSpan(dayKey: string, rowIndex: number): number {
  const block = getCellBlock(dayKey, rowIndex)
  return block ? block.rowSpan : 1
}

function priorityBadgeClass(priority: string): string {
  const base = 'text-xs px-2 py-1 rounded font-medium'
  if (priority === 'urgent') return `${base} bg-red-100 text-red-700`
  if (priority === 'high') return `${base} bg-orange-100 text-orange-700`
  return `${base} bg-gray-100 text-gray-700`
}

function priorityLabel(priority: string): string {
  if (priority === 'urgent') return '최우선'
  if (priority === 'high') return '높음'
  return '보통'
}

function priorityReason(subject: SubjectPriority): string {
  const weakUnitCount = subject.weakUnits.filter((unit) => unit !== '기본 복습').length
  if (subject.priority === 'urgent') {
    return '등급 격차 2단계 이상 - 최우선 학습 필요'
  }
  if (subject.priority === 'high') {
    return weakUnitCount >= 3 ? `취약 단원 ${weakUnitCount}개 - 높음` : '등급 격차 1단계 - 높음'
  }

  return '등급 격차와 취약 단원 기준상 보통'
}
</script>
