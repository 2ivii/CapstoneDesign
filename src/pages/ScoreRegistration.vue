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

              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileSelect"
              />

              <!-- Drop Zone (no file) -->
              <div
                v-if="!previewUrl"
                @click="fileInputRef?.click()"
                @dragover.prevent
                @drop.prevent="handleDrop"
                class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-emerald-500 transition-colors cursor-pointer"
              >
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

              <!-- Image Preview -->
              <div v-else class="relative rounded-lg overflow-hidden border border-gray-200">
                <img :src="previewUrl" class="w-full object-contain max-h-64" alt="성적표 미리보기" />
                <button
                  @click="clearFile"
                  class="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                >
                  <X :size="16" />
                </button>
              </div>

              <div class="mt-6 flex gap-3">
                <button
                  @click="fileInputRef?.click()"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Upload :size="16" />
                  다시 촬영
                </button>
                <button
                  @click="fileInputRef?.click()"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Camera :size="16" />
                  갤러리 선택
                </button>
              </div>
            </div>

            <!-- Right: Score Table -->
            <div class="bg-white rounded-xl p-8 border-2 border-gray-200">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">자동 인식 결과</h2>
                <span v-if="!isLoading && apiSubjects.length > 0" class="text-sm text-emerald-600 font-medium">
                  {{ apiSubjects.length }}개 과목 인식됨
                </span>
              </div>

              <p class="text-sm text-gray-600 mb-6">
                성적표 이미지를 바탕으로 자동 분석한 점수를 확인하고 수정할 수 있습니다.
              </p>

              <!-- Loading -->
              <div v-if="isLoading" class="flex flex-col items-center justify-center py-12 gap-4">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
                <p class="text-gray-600 text-sm">AI가 성적표를 분석 중입니다...</p>
              </div>

              <!-- Error -->
              <div v-else-if="uploadError" class="py-8 text-center">
                <p class="text-red-500 mb-3 text-sm">{{ uploadError }}</p>
                <button @click="retryUpload" class="text-sm text-emerald-600 underline">
                  다시 시도
                </button>
              </div>

              <!-- Results -->
              <div v-else-if="apiSubjects.length > 0" class="space-y-4">
                <div class="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 pb-2 border-b">
                  <div>과목</div>
                  <div class="text-center">원점수</div>
                  <div class="text-center">백분위</div>
                  <div class="text-center">등급</div>
                </div>
                <div
                  v-for="sub in apiSubjects"
                  :key="sub.subject"
                  class="grid grid-cols-4 gap-4 items-center"
                >
                  <div class="font-medium text-gray-900">{{ sub.subject }}</div>
                  <div class="text-center">
                    <input
                      v-model.number="sub.score"
                      class="w-full text-center h-9 border border-gray-300 rounded px-2"
                    />
                  </div>
                  <div class="text-center">
                    <input
                      v-model.number="sub.percent"
                      class="w-full text-center h-9 border border-gray-300 rounded px-2"
                    />
                  </div>
                  <div class="text-center">
                    <span class="inline-flex items-center justify-center w-full h-9 bg-gray-50 rounded-md font-medium">
                      {{ sub.grade }}등급
                    </span>
                  </div>
                </div>
              </div>

              <!-- Empty -->
              <div v-else class="py-12 text-center text-gray-400 text-sm">
                <p>성적표 이미지를 업로드하면</p>
                <p class="mt-1">자동으로 분석됩니다.</p>
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
            @click="goToAnswerMarking"
            :disabled="isExtractingWrongAnswers"
            class="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            <span v-if="isExtractingWrongAnswers" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            {{ isExtractingWrongAnswers ? 'AI 오답 추출 중...' : '다음 - 오답 문항 입력 →' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import AutoGrading from '@/components/AutoGrading.vue'
import { Camera, Upload, Edit3, X } from 'lucide-vue-next'

const router = useRouter()
const STUDENT_ID = 1

const inputMethod = ref<'photo' | 'manual'>('photo')
const fileInputRef = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const isLoading = ref(false)
const uploadError = ref<string | null>(null)

interface ApiSubject {
  subject: string
  score: number
  grade: number
  percent: number
  wrong_answer: number[]
}

const apiSubjects = ref<ApiSubject[]>([])
const examId = ref<number | null>(null)

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

const processFile = (file: File) => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  uploadError.value = null
  uploadFile(file)
}

const clearFile = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  selectedFile.value = null
  apiSubjects.value = []
  examId.value = null
  uploadError.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const retryUpload = () => {
  if (selectedFile.value) uploadFile(selectedFile.value)
}

const uploadFile = async (file: File) => {
  isLoading.value = true
  uploadError.value = null
  apiSubjects.value = []

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await fetch(`/api/students/${STUDENT_ID}/exam/upload`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || `서버 오류 (${res.status})`)
    }
    const data: { exam_id: number; subjects: ApiSubject[] } = await res.json()
    examId.value = data.exam_id ?? null
    apiSubjects.value = data.subjects ?? []
  } catch (e: unknown) {
    uploadError.value = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

const isExtractingWrongAnswers = ref(false)

const goToAnswerMarking = async () => {
  if (examId.value && selectedFile.value && apiSubjects.value.length > 0) {
    isExtractingWrongAnswers.value = true
    try {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      const res = await fetch(`/api/students/${STUDENT_ID}/exam/${examId.value}/wrong-answers`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const data: { subjects: Array<{ subject: string; wrong_answer: number[] }> } = await res.json()
        const wrongMap = Object.fromEntries(data.subjects.map(s => [s.subject, s.wrong_answer]))
        apiSubjects.value = apiSubjects.value.map(s => ({
          ...s,
          wrong_answer: wrongMap[s.subject] ?? s.wrong_answer,
        }))
      } else {
        const errText = await res.text()
        console.error('오답 추출 API 오류:', res.status, errText)
      }
    } catch (e: unknown) {
      console.error('오답 추출 실패:', e)
    } finally {
      isExtractingWrongAnswers.value = false
    }
  }

  if (apiSubjects.value.length > 0) {
    localStorage.setItem('learnershigh_exam_subjects', JSON.stringify(apiSubjects.value))
  }
  router.push('/answer-marking')
}

// ── Manual grading ──────────────────────────────────────────────────────────

const ID_TO_NAME: Record<string, string> = {
  korean: '국어', math: '수학', english: '영어',
  science1: '생명과학1', science2: '지구과학1', history: '한국사',
}

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

const handleAutoGradingComplete = (
  results: Record<string, { score: number; total: number; grade: string; wrongQuestions: number[] }>
) => {
  apiSubjects.value = Object.keys(results).map(id => ({
    subject: ID_TO_NAME[id] ?? id,
    score: results[id].total,
    grade: parseInt(results[id].grade),
    percent: 0,
    wrong_answer: results[id].wrongQuestions,
  }))
  inputMethod.value = 'photo'
}
</script>
