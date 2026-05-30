<template>
  <div class="space-y-6">
    <!-- Subject Tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="(subject, index) in subjects"
        :key="subject.id"
        @click="activeSubject = index"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1',
          activeSubject === index
            ? 'bg-emerald-600 text-white'
            : results[subject.id]
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        {{ subject.name }}
        <Check v-if="results[subject.id]" :size="16" />
      </button>
    </div>

    <!-- Current Subject -->
    <div class="bg-white rounded-xl p-6 border-2 border-gray-200">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-bold text-gray-900">{{ currentSubject.name }}</h3>
          <p class="text-sm text-gray-600 mt-1">가채점 답안을 입력하세요 (1~5번)</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-600">입력 진행률</p>
          <p class="text-2xl font-bold text-emerald-600">{{ answeredCount }} / {{ currentSubject.total }}</p>
        </div>
      </div>

      <!-- Score Result Banner -->
      <div v-if="hasResult" class="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-emerald-700 font-medium">채점 완료</p>
            <p class="text-xs text-emerald-600 mt-1">
              틀린 문항: {{ results[currentSubject.id]!.wrongQuestions.length }}개
            </p>
          </div>
          <p class="text-3xl font-bold text-emerald-700">{{ results[currentSubject.id]!.score }}점</p>
        </div>
      </div>

      <!-- Answer Grid -->
      <div class="grid grid-cols-10 gap-3">
        <div
          v-for="num in currentSubject.total"
          :key="num"
          class="flex flex-col"
        >
          <label class="text-xs text-gray-500 mb-1 text-center font-medium">{{ num }}번</label>
          <input
            :value="currentAnswers[num] || ''"
            @input="handleAnswerChange(num, ($event.target as HTMLInputElement).value)"
            maxlength="1"
            :disabled="hasResult"
            placeholder="?"
            :class="[
              'w-full text-center h-12 text-lg font-bold uppercase border rounded-lg focus:outline-none',
              hasResult && currentAnswers[num] === currentSubject.correctAnswers[num - 1]
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : hasResult && currentAnswers[num] && currentAnswers[num] !== currentSubject.correctAnswers[num - 1]
                  ? 'bg-rose-50 border-rose-500 text-rose-700'
                  : 'border-gray-300 focus:border-emerald-500'
            ]"
          />
          <div v-if="hasResult" class="text-center mt-1">
            <Check
              v-if="currentAnswers[num] === currentSubject.correctAnswers[num - 1]"
              :size="16"
              class="text-emerald-600 mx-auto"
            />
            <X
              v-else-if="currentAnswers[num] && currentAnswers[num] !== currentSubject.correctAnswers[num - 1]"
              :size="16"
              class="text-rose-600 mx-auto"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 pt-6 border-t flex items-center justify-between">
        <button
          @click="resetCurrentSubject"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
        >
          입력 초기화
        </button>

        <template v-if="!hasResult">
          <button
            @click="calculateScore"
            :disabled="!isSubjectComplete"
            class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 text-sm"
          >
            채점하기 ({{ answeredCount }}/{{ currentSubject.total }})
          </button>
        </template>
        <template v-else>
          <button
            v-if="activeSubject < subjects.length - 1"
            @click="activeSubject++"
            class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm"
          >
            다음 과목 →
          </button>
          <button
            v-else
            @click="handleComplete"
            class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm"
          >
            채점 완료
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, X } from 'lucide-vue-next'

interface Subject {
  id: string
  name: string
  total: number
  correctAnswers: string[]
}

interface GradingResult {
  score: number
  total: number
  grade: string
  wrongQuestions: number[]
}

const props = defineProps<{
  subjects: Subject[]
}>()

const emit = defineEmits<{
  complete: [results: Record<string, GradingResult>]
}>()

const activeSubject = ref(0)
const allAnswers = ref<Record<string, Record<number, string>>>({})
const results = ref<Record<string, { score: number; wrongQuestions: number[] }>>({})

const currentSubject = computed(() => props.subjects[activeSubject.value])
const currentAnswers = computed(() => allAnswers.value[currentSubject.value.id] || {})
const answeredCount = computed(() =>
  Object.values(currentAnswers.value).filter(v => v).length
)
const isSubjectComplete = computed(() => answeredCount.value === currentSubject.value.total)
const hasResult = computed(() => !!results.value[currentSubject.value.id])

const handleAnswerChange = (questionNum: number, answer: string) => {
  if (!allAnswers.value[currentSubject.value.id]) {
    allAnswers.value[currentSubject.value.id] = {}
  }
  allAnswers.value[currentSubject.value.id][questionNum] = answer.toUpperCase()
}

const calculateScore = () => {
  const userAnswers = currentAnswers.value
  let correctCount = 0
  const wrongQuestions: number[] = []

  currentSubject.value.correctAnswers.forEach((correctAnswer, index) => {
    const num = index + 1
    const userAnswer = userAnswers[num]
    if (userAnswer === correctAnswer) {
      correctCount++
    } else if (userAnswer) {
      wrongQuestions.push(num)
    }
  })

  const score = Math.round((correctCount / currentSubject.value.total) * 100)
  results.value[currentSubject.value.id] = { score, wrongQuestions }
}

const resetCurrentSubject = () => {
  if (allAnswers.value[currentSubject.value.id]) {
    allAnswers.value[currentSubject.value.id] = {}
  }
  delete results.value[currentSubject.value.id]
}

const getGrade = (score: number): string => {
  if (score >= 90) return '1'
  if (score >= 80) return '2'
  if (score >= 70) return '3'
  if (score >= 60) return '4'
  return '5'
}

const handleComplete = () => {
  const finalResults: Record<string, GradingResult> = {}
  props.subjects.forEach(subject => {
    const result = results.value[subject.id] || { score: 0, wrongQuestions: [] }
    finalResults[subject.id] = {
      score: result.score,
      total: subject.total,
      grade: getGrade(result.score),
      wrongQuestions: result.wrongQuestions,
    }
  })
  emit('complete', finalResults)
}
</script>
