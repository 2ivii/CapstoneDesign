<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />

    <div class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto p-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            모의고사 성적표 촬영 및 점수 데이터 보정
          </h1>
          <p class="text-gray-600">2026.05.27 19:09</p>
        </div>

        <!-- Tabs -->
        <div class="mb-6">
          <div class="flex gap-2 mb-6">
            <button
              @click="inputMethod = 'photo'"
              :class="[
                'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                inputMethod === 'photo'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              ]"
            >
              <Camera :size="16" />
              성적표 촬영
            </button>
            <button
              @click="inputMethod = 'manual'"
              :class="[
                'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                inputMethod === 'manual'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              ]"
            >
              <Edit3 :size="16" />
              수기입력 (자동채점)
            </button>
          </div>

          <!-- Photo Upload Method -->
          <div v-if="inputMethod === 'photo'" class="grid grid-cols-2 gap-8">
            <!-- Left: Upload Area -->
            <div class="bg-white rounded-xl p-8 border-2 border-gray-200">
              <h2 class="text-lg font-semibold mb-6">성적표 촬영 또는 스캔</h2>

              <div class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                <div class="flex flex-col items-center gap-4">
                  <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <Camera class="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p class="text-lg font-medium text-gray-700 mb-1">
                      성적표 업로드 또는 직접 촬영
                    </p>
                    <p class="text-sm text-gray-500">
                      사진을 드래그하거나 클릭하여 업로드하세요
                    </p>
                  </div>
                  <p class="text-xs text-gray-400 mt-2">
                    스마트폰으로 성적표를 촬영한 사진 또는 스캔본을 업로드하세요.<br />
                    명확하게 보일수록 정확도가 높아집니다.
                  </p>
                </div>
              </div>

              <div class="mt-6 flex gap-3">
                <button class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Upload :size="16" />
                  다시 촬영
                </button>
                <button class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Camera :size="16" />
                  갤러리 선택
                </button>
              </div>
            </div>

            <!-- Right: Score Table -->
            <div class="bg-white rounded-xl p-8 border-2 border-gray-200">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">자동 인식 결과</h2>
                <span class="text-sm text-emerald-600 font-medium">정확도: 98.2%</span>
              </div>

              <p class="text-sm text-gray-600 mb-6">
                성적표 이미지를 바탕으로 자동 분석한 점수를 확인하고 수정할 수 있습니다.
              </p>

              <div class="space-y-4">
                <!-- Table Header -->
                <div class="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 pb-2 border-b">
                  <div>과목</div>
                  <div class="text-center">원점수</div>
                  <div class="text-center">백분위</div>
                  <div class="text-center">등급</div>
                </div>

                <!-- Table Rows -->
                <div
                  v-for="subject in subjects"
                  :key="subject.id"
                  class="grid grid-cols-4 gap-4 items-center"
                >
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900">{{ subject.name }}</span>
                  </div>
                  <div class="text-center">
                    <input
                      v-model="subject.data.total"
                      class="w-full text-center h-9 border border-gray-300 rounded px-2"
                      placeholder="---"
                    />
                  </div>
                  <div class="text-center">
                    <input
                      v-model="subject.data.score"
                      class="w-full text-center h-9 border border-gray-300 rounded px-2"
                      placeholder="---"
                    />
                  </div>
                  <div class="text-center">
                    <span class="inline-flex items-center justify-center w-full h-9 bg-gray-50 rounded-md font-medium">
                      {{ subject.data.grade ? `${subject.data.grade}등급` : '---' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Manual Input Method with Auto Grading -->
          <div v-else>
            <AutoGrading :subjects="gradingSubjects" @complete="handleAutoGradingComplete" />
          </div>
        </div>

        <!-- Bottom Button -->
        <div class="mt-8 flex justify-end">
          <button
            @click="$router.push('/answer-marking')"
            class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium"
          >
            다음 - 오답 문항 입력 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import AutoGrading from '@/components/AutoGrading.vue'
import { Camera, Upload, Edit3 } from 'lucide-vue-next'

const inputMethod = ref<'photo' | 'manual'>('photo')

const scores = ref({
  korean:  { total: '85', score: '91', grade: '2' },
  math:    { total: '75', score: '82', grade: '3' },
  english: { total: '95', score: '98', grade: '1' },
  science: { total: '43', score: '90', grade: '2' },
  science2:{ total: '42', score: '89', grade: '2' },
  history: { total: '44', score: '92', grade: '2' },
})

const subjects = computed(() => [
  { id: 'korean',   name: '국어 (언어와 매체)', data: scores.value.korean   },
  { id: 'math',     name: '수학 (미적분)',       data: scores.value.math     },
  { id: 'english',  name: '영어',               data: scores.value.english  },
  { id: 'science',  name: '생명과학1',           data: scores.value.science  },
  { id: 'science2', name: '지구과학1',           data: scores.value.science2 },
  { id: 'history',  name: '한국사',             data: scores.value.history  },
])

const gradingSubjects = [
  {
    id: 'korean', name: '국어', total: 45,
    correctAnswers: ['1','2','1','3','1','1','1','4','2','5','2','4','2','4','1','2','2','4','2','4','2','2','4','2','4','2','4','2','4','2','4','2','4','2','4','2','4','2','4','2','4','2','2','4','1'],
  },
  {
    id: 'math', name: '수학', total: 30,
    correctAnswers: ['3','4','2','5','1','3','2','4','1','5','2','4','3','1','4','2','5','3','1','4','2','5','3','4','1','2','5','3','4','1'],
  },
  {
    id: 'english', name: '영어', total: 45,
    correctAnswers: ['1','2','1','3','1','1','1','4','2','5','2','4','2','4','1','2','2','4','2','4','2','2','4','2','4','2','4','2','4','2','4','2','4','2','4','2','4','2','4','2','4','2','2','4','1'],
  },
  {
    id: 'science1', name: '생명과학1', total: 20,
    correctAnswers: ['2','4','1','3','2','4','1','3','2','5','1','4','3','2','5','1','3','4','2','1'],
  },
  {
    id: 'science2', name: '지구과학1', total: 20,
    correctAnswers: ['3','1','4','2','5','3','1','4','2','3','5','1','4','2','3','1','5','4','2','3'],
  },
  {
    id: 'history', name: '한국사', total: 20,
    correctAnswers: ['4','2','3','1','5','2','4','1','3','2','4','5','1','3','2','4','1','5','3','2'],
  },
]

const handleAutoGradingComplete = (results: Record<string, { score: number; total: number; grade: string; wrongQuestions: number[] }>) => {
  const map: Record<string, keyof typeof scores.value> = {
    korean: 'korean', math: 'math', english: 'english',
    science1: 'science', science2: 'science2', history: 'history',
  }
  Object.keys(results).forEach(id => {
    const key = map[id]
    if (key) {
      scores.value[key] = {
        total: results[id].total.toString(),
        score: results[id].score.toString(),
        grade: results[id].grade,
      }
    }
  })
  inputMethod.value = 'photo'
}
</script>
