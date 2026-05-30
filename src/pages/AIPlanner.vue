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
                            backgroundColor: subjectMap[getCellBlock(day.key, rowIndex)!.subject].bgColor,
                            color: subjectMap[getCellBlock(day.key, rowIndex)!.subject].textColor
                          }"
                        >
                          <div class="flex items-center justify-between mb-0.5">
                            <span class="font-bold text-xs">{{ subjectMap[getCellBlock(day.key, rowIndex)!.subject].name }}</span>
                            <Sparkles
                              v-if="getCellBlock(day.key, rowIndex)!.concentration >= 80"
                              :size="12"
                              :style="{ color: subjectMap[getCellBlock(day.key, rowIndex)!.subject].textColor, opacity: 0.7 }"
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
              <div v-for="(info, key) in subjectMap" :key="key" class="flex items-center gap-2">
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
              <p class="text-sm text-gray-600">약점 분석 기반 학습 우선순위</p>
            </div>
            <div class="px-6 pb-6">
              <div class="space-y-4">
                <div
                  v-for="(subject, index) in subjectPriority"
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
                      <p class="text-sm font-bold">{{ subject.current }}등급 → {{ subject.target }}등급</p>
                    </div>
                  </div>
                  <div class="text-xs text-gray-500 mb-2">
                    취약 단원: {{ subject.weakUnits.join(', ') }}
                  </div>
                  <div v-if="subject.gap > 0" class="flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle :size="12" />
                    <span>등급 격차 {{ subject.gap }}단계 - 집중 학습 필요</span>
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
                  <div v-for="(subject, index) in subjectPriority" :key="index">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-gray-900">{{ subject.subject }}</span>
                      <span class="text-sm font-bold" :style="{ color: subject.color }">
                        {{ subject.percentage }}%
                        <span v-if="index === 0" class="text-xs text-emerald-600 ml-1">(기존의 2.2배 가중)</span>
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
                      집중 콘텐츠 패턴이 확복 오후 14시~16시에 가장 높은 "수학 미적분" 과목이 집중 예비로 선정되었습니다.
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
import Sidebar from '@/components/Sidebar.vue'
import { ArrowLeft, Clock, Sparkles, Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-vue-next'

type SubjectKey = 'math' | 'korean' | 'english' | 'science1' | 'rest'

const subjectMap: Record<SubjectKey, { name: string; color: string; bgColor: string; textColor: string }> = {
  math:     { name: '수학',      color: '#10b981', bgColor: '#d1fae5', textColor: '#065f46' },
  korean:   { name: '국어',      color: '#f59e0b', bgColor: '#fef3c7', textColor: '#92400e' },
  english:  { name: '영어',      color: '#3b82f6', bgColor: '#dbeafe', textColor: '#1e40af' },
  science1: { name: '생명과학1', color: '#8b5cf6', bgColor: '#ede9fe', textColor: '#5b21b6' },
  rest:     { name: '휴식',      color: '#9ca3af', bgColor: '#f3f4f6', textColor: '#4b5563' },
}

const timeSlots = ['06시', '08시', '10시', '12시', '14시', '16시', '18시', '20시', '22시']

const days = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
  { key: 'sun', label: '일' },
]

type ScheduleBlock = {
  subject: SubjectKey
  topic: string
  startRow: number
  rowSpan: number
  concentration: number
}

const weekSchedule: Record<string, ScheduleBlock[]> = {
  mon: [
    { subject: 'math',     topic: '미적분',   startRow: 0, rowSpan: 1, concentration: 85 },
    { subject: 'korean',   topic: '문학',     startRow: 1, rowSpan: 1, concentration: 75 },
    { subject: 'rest',     topic: '휴식',     startRow: 2, rowSpan: 1, concentration: 70 },
    { subject: 'rest',     topic: '점심',     startRow: 3, rowSpan: 1, concentration: 45 },
    { subject: 'english',  topic: '독해',     startRow: 4, rowSpan: 1, concentration: 65 },
    { subject: 'science1', topic: '유전',     startRow: 5, rowSpan: 1, concentration: 60 },
    { subject: 'rest',     topic: '휴식',     startRow: 6, rowSpan: 1, concentration: 50 },
    { subject: 'math',     topic: '적분 심화', startRow: 7, rowSpan: 1, concentration: 90 },
    { subject: 'science1', topic: '항상성',   startRow: 8, rowSpan: 1, concentration: 88 },
  ],
  tue: [
    { subject: 'math',     topic: '극한',     startRow: 0, rowSpan: 1, concentration: 85 },
    { subject: 'korean',   topic: '독서',     startRow: 1, rowSpan: 1, concentration: 75 },
    { subject: 'korean',   topic: '언어',     startRow: 2, rowSpan: 1, concentration: 70 },
    { subject: 'rest',     topic: '점심',     startRow: 3, rowSpan: 1, concentration: 45 },
    { subject: 'english',  topic: '문법',     startRow: 4, rowSpan: 1, concentration: 60 },
    { subject: 'math',     topic: '미분',     startRow: 5, rowSpan: 1, concentration: 60 },
    { subject: 'rest',     topic: '휴식',     startRow: 6, rowSpan: 1, concentration: 50 },
    { subject: 'english',  topic: '빈칸 추론', startRow: 7, rowSpan: 1, concentration: 90 },
    { subject: 'science1', topic: '세포',     startRow: 8, rowSpan: 1, concentration: 88 },
  ],
  wed: [
    { subject: 'math',     topic: '수열',     startRow: 0, rowSpan: 1, concentration: 85 },
    { subject: 'english',  topic: '독해',     startRow: 1, rowSpan: 1, concentration: 75 },
    { subject: 'korean',   topic: '문학',     startRow: 2, rowSpan: 1, concentration: 70 },
    { subject: 'rest',     topic: '점심',     startRow: 3, rowSpan: 1, concentration: 45 },
    { subject: 'english',  topic: '어휘',     startRow: 4, rowSpan: 1, concentration: 60 },
    { subject: 'science1', topic: '호르몬',   startRow: 5, rowSpan: 1, concentration: 60 },
    { subject: 'rest',     topic: '휴식',     startRow: 6, rowSpan: 1, concentration: 50 },
    { subject: 'korean',   topic: '비문학',   startRow: 7, rowSpan: 1, concentration: 90 },
    { subject: 'math',     topic: '미적분',   startRow: 8, rowSpan: 1, concentration: 88 },
  ],
  thu: [
    { subject: 'math',     topic: '적분',     startRow: 0, rowSpan: 1, concentration: 85 },
    { subject: 'science1', topic: '유전자',   startRow: 1, rowSpan: 1, concentration: 75 },
    { subject: 'english',  topic: '독해',     startRow: 2, rowSpan: 1, concentration: 70 },
    { subject: 'rest',     topic: '점심',     startRow: 3, rowSpan: 1, concentration: 45 },
    { subject: 'korean',   topic: '독서',     startRow: 4, rowSpan: 1, concentration: 60 },
    { subject: 'english',  topic: '빈칸',     startRow: 5, rowSpan: 1, concentration: 60 },
    { subject: 'rest',     topic: '휴식',     startRow: 6, rowSpan: 1, concentration: 50 },
    { subject: 'math',     topic: '수열 심화', startRow: 7, rowSpan: 1, concentration: 90 },
    { subject: 'science1', topic: '신경계',   startRow: 8, rowSpan: 1, concentration: 88 },
  ],
  fri: [
    { subject: 'math',     topic: '미적분',   startRow: 0, rowSpan: 1, concentration: 85 },
    { subject: 'korean',   topic: '문학',     startRow: 1, rowSpan: 1, concentration: 75 },
    { subject: 'science1', topic: '항상성',   startRow: 2, rowSpan: 1, concentration: 70 },
    { subject: 'rest',     topic: '점심',     startRow: 3, rowSpan: 1, concentration: 45 },
    { subject: 'english',  topic: '독해',     startRow: 4, rowSpan: 1, concentration: 60 },
    { subject: 'math',     topic: '극한',     startRow: 5, rowSpan: 1, concentration: 60 },
    { subject: 'rest',     topic: '휴식',     startRow: 6, rowSpan: 1, concentration: 50 },
    { subject: 'korean',   topic: '비문학',   startRow: 7, rowSpan: 1, concentration: 90 },
    { subject: 'science1', topic: '세포 분열', startRow: 8, rowSpan: 1, concentration: 88 },
  ],
  sat: [
    { subject: 'math',     topic: '모의고사', startRow: 0, rowSpan: 1, concentration: 85 },
    { subject: 'korean',   topic: '모의고사', startRow: 1, rowSpan: 1, concentration: 75 },
    { subject: 'english',  topic: '모의고사', startRow: 2, rowSpan: 1, concentration: 70 },
    { subject: 'rest',     topic: '점심',    startRow: 3, rowSpan: 1, concentration: 45 },
    { subject: 'science1', topic: '모의고사', startRow: 4, rowSpan: 1, concentration: 60 },
    { subject: 'rest',     topic: '휴식',    startRow: 5, rowSpan: 1, concentration: 60 },
    { subject: 'rest',     topic: '휴식',    startRow: 6, rowSpan: 1, concentration: 50 },
    { subject: 'math',     topic: '오답정리', startRow: 7, rowSpan: 1, concentration: 90 },
    { subject: 'korean',   topic: '오답정리', startRow: 8, rowSpan: 1, concentration: 88 },
  ],
  sun: [
    { subject: 'rest',     topic: '휴식',    startRow: 0, rowSpan: 1, concentration: 70 },
    { subject: 'rest',     topic: '휴식',    startRow: 1, rowSpan: 1, concentration: 70 },
    { subject: 'english',  topic: '어휘 복습', startRow: 2, rowSpan: 1, concentration: 65 },
    { subject: 'rest',     topic: '점심',    startRow: 3, rowSpan: 1, concentration: 45 },
    { subject: 'rest',     topic: '휴식',    startRow: 4, rowSpan: 1, concentration: 60 },
    { subject: 'math',     topic: '약점 복습', startRow: 5, rowSpan: 1, concentration: 60 },
    { subject: 'rest',     topic: '휴식',    startRow: 6, rowSpan: 1, concentration: 50 },
    { subject: 'science1', topic: '개념 정리', startRow: 7, rowSpan: 1, concentration: 85 },
    { subject: 'rest',     topic: '휴식',    startRow: 8, rowSpan: 1, concentration: 80 },
  ],
}

const subjectPriority = [
  { subject: '수학',      current: 3, target: 1, priority: 'urgent', gap: 2, weakUnits: ['수열의 극한', '적분'],             percentage: 34, color: '#10b981' },
  { subject: '국어',      current: 2, target: 1, priority: 'high',   gap: 1, weakUnits: ['비문학 추론', '고전소설'],          percentage: 24, color: '#f59e0b' },
  { subject: '영어',      current: 1, target: 1, priority: 'medium', gap: 0, weakUnits: ['빈칸 추론'],                        percentage: 22, color: '#3b82f6' },
  { subject: '생명과학1', current: 2, target: 1, priority: 'high',   gap: 1, weakUnits: ['호르몬과 항상성', '유전자 발현'],  percentage: 20, color: '#8b5cf6' },
]

function getCellBlock(dayKey: string, rowIndex: number): ScheduleBlock | undefined {
  return weekSchedule[dayKey].find(b => b.startRow === rowIndex)
}

function shouldRenderCell(dayKey: string, rowIndex: number): boolean {
  const schedule = weekSchedule[dayKey]
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
  if (priority === 'high')   return `${base} bg-orange-100 text-orange-700`
  return `${base} bg-gray-100 text-gray-700`
}

function priorityLabel(priority: string): string {
  if (priority === 'urgent') return '긴급'
  if (priority === 'high')   return '높음'
  return '보통'
}
</script>
