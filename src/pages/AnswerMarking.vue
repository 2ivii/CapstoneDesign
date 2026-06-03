<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />

    <div class="flex-1 overflow-auto">
      <div class="max-w-[1600px] mx-auto p-8">
        <!-- Back Button -->
        <button
          @click="$router.push('/')"
          class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft :size="16" />
          이전 단계 (성적표 입력)
        </button>

        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">
                틀린 문항 1차 오답 정밀 마킹
              </h1>
              <p class="text-gray-600">
                각 과목별로 틀린 문제 번호를 선택하세요. 선택된 문항은 AI가 자동으로 분석합니다.
              </p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-600">총 선택된 오답</p>
              <p class="text-3xl font-bold text-rose-600">{{ getTotalWrongAnswers() }}개</p>
            </div>
          </div>
        </div>

        <!-- All Subjects in Horizontal Scroll -->
        <div class="overflow-x-auto pb-4">
          <div class="flex gap-6 min-w-max">
            <div
              v-for="subject in subjects"
              :key="subject.id"
              class="bg-white rounded-xl p-6 border-2 border-gray-200 flex-shrink-0 w-[280px]"
            >
              <!-- Subject Header -->
              <div class="mb-4 pb-3 border-b">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-lg font-bold text-gray-900">{{ subject.label }}</h3>
                  <span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">
                    {{ wrongAnswers[subject.id]?.size ?? 0 }}개 선택
                  </span>
                </div>
                <p class="text-xs text-gray-500">({{ subject.total }}문항)</p>
              </div>

              <!-- Question Grid -->
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="num in subject.total"
                  :key="num"
                  @click="toggleAnswer(subject.id, num)"
                  :class="[
                    'h-10 rounded-lg text-sm font-medium transition-all',
                    wrongAnswers[subject.id]?.has(num)
                      ? 'bg-rose-500 text-white shadow-md hover:bg-rose-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  {{ num }}
                </button>
              </div>

              <!-- Clear Button -->
              <button
                @click="clearSubject(subject.id)"
                class="w-full mt-4 pt-3 border-t text-xs text-gray-500 hover:text-gray-700"
              >
                전체 해제
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Actions -->
        <div class="mt-8 flex items-center justify-end">
          <div class="flex gap-3">
            <button
              @click="$router.push('/')"
              class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← 이전 단계 (점수 입력)
            </button>
            <button
              @click="$router.push('/analysis')"
              class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg"
            >
              AI 기반 오답 문항 분석 시작 →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { ArrowLeft } from 'lucide-vue-next'

const SUBJECT_TOTALS: Record<string, number> = {
  '국어': 45, '수학': 30, '영어': 45, '한국사': 20,
}

interface SubjectItem {
  id: string
  label: string
  total: number
}

const subjects = ref<SubjectItem[]>([])
const wrongAnswers = ref<Record<string, Set<number>>>({})

onMounted(() => {
  const stored = localStorage.getItem('learnershigh_exam_subjects')
  if (stored) {
    try {
      const parsed: Array<{ subject: string; wrong_answer: number[] }> = JSON.parse(stored)
      const subs: SubjectItem[] = parsed.map(s => ({
        id: s.subject,
        label: s.subject,
        total: SUBJECT_TOTALS[s.subject] ?? 25,
      }))
      const wa: Record<string, Set<number>> = {}
      parsed.forEach(s => { wa[s.subject] = new Set(s.wrong_answer) })
      subjects.value = subs
      wrongAnswers.value = wa
      return
    } catch {
      // fall through to defaults
    }
  }

  // Fallback when no API data
  const defaults: SubjectItem[] = [
    { id: '국어', label: '국어', total: 45 },
    { id: '수학', label: '수학', total: 30 },
    { id: '영어', label: '영어', total: 45 },
    { id: '한국사', label: '한국사', total: 20 },
  ]
  subjects.value = defaults
  wrongAnswers.value = Object.fromEntries(defaults.map(s => [s.id, new Set<number>()]))
})

const toggleAnswer = (id: string, num: number) => {
  const set = wrongAnswers.value[id]
  if (!set) return
  if (set.has(num)) set.delete(num)
  else set.add(num)
}

const clearSubject = (id: string) => {
  wrongAnswers.value[id]?.clear()
}

const getTotalWrongAnswers = () =>
  Object.values(wrongAnswers.value).reduce((sum, set) => sum + set.size, 0)
</script>
