<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />

    <!-- New Chat Dialog (과목 선택만) -->
    <div
      v-if="showNewChatDialog"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      @click.self="showNewChatDialog = false"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-lg font-bold mb-1">새 대화 만들기</h2>
        <p class="text-sm text-gray-600 mb-4">어떤 과목으로 시작할까요?</p>
        <div class="grid grid-cols-2 gap-3 mb-6">
          <button
            v-for="subject in subjects"
            :key="subject.id"
            @click="newChatSubject = subject.id"
            :class="[
              'p-3 rounded-lg border-2 text-sm font-medium transition-all text-left',
              newChatSubject === subject.id
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            ]"
          >
            <span
              class="inline-block w-2 h-2 rounded-full mr-2 align-middle"
              :style="{ backgroundColor: subject.color }"
            />
            {{ subject.name }}
          </button>
        </div>
        <div class="flex justify-end gap-2">
          <button
            @click="showNewChatDialog = false"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >취소</button>
          <button
            @click="createNewChat"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
          >시작하기</button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-hidden flex">
      <!-- Chat List Sidebar -->
      <div class="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div class="p-4 border-b">
          <button
            @click="showNewChatDialog = true"
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus :size="16" />
            새 대화
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div
            v-for="chat in chatRooms"
            :key="chat.id"
            @click="currentChatId = chat.id"
            :class="[
              'p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors group',
              currentChatId === chat.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''
            ]"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <MessageSquare :size="16" class="text-gray-500 flex-shrink-0" />
                  <h3 class="text-sm font-semibold text-gray-900 truncate">{{ chat.title }}</h3>
                </div>
                <p class="text-xs text-gray-600 truncate">{{ chat.lastMessage || '새 대화' }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatDate(chat.timestamp) }}</p>
              </div>
              <button
                @click.stop="deleteChat(chat.id)"
                class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
              >
                <Trash2 :size="16" class="text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="flex-1 flex flex-col">
        <!-- Header -->
        <div class="bg-white border-b p-4">
          <button
            @click="$router.push('/ai-planner')"
            class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft :size="16" />
            이전 단계 (AI 플래너)
          </button>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Sparkles :size="32" class="text-emerald-600" />
              <div>
                <h1 class="text-2xl font-bold text-gray-900">AI 문제풀이 챗봇</h1>
                <p class="text-sm text-gray-600">문제를 입력하면 AI가 단계별로 자세히 설명해드립니다</p>
              </div>
            </div>
            <span class="bg-emerald-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">AI 튜터 활성화</span>
          </div>

          <div v-if="currentChat" class="mt-3 flex items-center gap-2 flex-wrap">
            <span
              class="text-white text-xs font-medium px-2.5 py-1 rounded-full"
              :style="{ backgroundColor: subjects.find(s => s.id === currentChat!.subject)?.color }"
            >
              {{ subjects.find(s => s.id === currentChat!.subject)?.name }}
            </span>
            <span v-if="currentChat.examInfo" class="text-gray-500 text-xs">
              {{ examInfoLabel(currentChat.examInfo) }} {{ currentChat.examInfo.questionNo }}번
            </span>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="flex-1 overflow-hidden flex flex-col">
          <div class="flex-1 bg-white mx-4 mt-4 mb-0 rounded-t-xl shadow-sm overflow-hidden flex flex-col border border-gray-200">
            <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-4">
              <div
                v-for="message in currentMessages"
                :key="message.id"
                :class="['flex', message.role === 'user' ? 'justify-end' : 'justify-start']"
              >
                <div
                  :class="[
                    'max-w-[80%] rounded-lg p-4',
                    message.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900'
                  ]"
                >
                  <div v-if="message.role === 'assistant'" class="flex items-center gap-2 mb-2">
                    <Sparkles :size="16" class="text-emerald-600" />
                    <span class="text-xs font-semibold text-emerald-600">AI 튜터</span>
                  </div>
                  <div v-if="message.hasImage" class="mb-2 p-2 bg-white/10 rounded">
                    <ImageIcon :size="32" />
                    <p class="text-xs mt-1">이미지 첨부됨</p>
                  </div>
                  <div
                    class="chat-message text-sm"
                    v-html="renderMessage(message.content)"
                  />
                  <div :class="['text-xs mt-2', message.role === 'user' ? 'text-emerald-100' : 'text-gray-500']">
                    {{ formatTime(message.timestamp) }}
                  </div>
                </div>
              </div>

              <div v-if="isLoading" class="flex justify-start">
                <div class="bg-gray-100 rounded-lg p-4">
                  <div class="flex items-center gap-2">
                    <Sparkles :size="16" class="text-emerald-600 animate-pulse" />
                    <span class="text-sm text-gray-600">AI가 답변을 작성 중입니다...</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input Area -->
            <div class="border-t p-4">
              <!-- 이미지 첨부 시: 시험 정보 입력 폼 -->
              <div
                v-if="uploadedImage && currentChat && !currentChat.initialized"
                class="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <p class="text-xs font-semibold text-gray-500 mb-2">모의고사 정보</p>

                <!-- Row 1: Org / Year / Month -->
                <div class="flex flex-wrap gap-2 items-center mb-2">
                  <div class="flex gap-1">
                    <button
                      v-for="org in examOrgs"
                      :key="org"
                      @click="solveExamOrg = org"
                      :class="[
                        'px-2 py-1 rounded text-xs border transition-colors',
                        solveExamOrg === org
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      ]"
                    >{{ org }}</button>
                  </div>
                  <input
                    v-model="solveExamYear"
                    type="number"
                    min="2020"
                    max="2030"
                    class="w-20 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="학년도"
                  />
                  <select
                    v-if="solveExamOrg !== '수능'"
                    v-model="solveExamMonth"
                    class="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option v-for="m in examMonths" :key="m" :value="String(m)">{{ m }}월</option>
                  </select>
                </div>

                <!-- Row 2: Grade / Question No -->
                <div class="flex flex-wrap gap-2 items-center">
                  <div v-if="solveExamOrg !== '수능'" class="flex gap-1">
                    <button
                      v-for="grade in examGrades"
                      :key="grade"
                      @click="solveExamGrade = grade"
                      :class="[
                        'px-2 py-1 rounded text-xs border transition-colors',
                        solveExamGrade === grade
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      ]"
                    >{{ grade }}</button>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-gray-500">문항</span>
                    <input
                      v-model="solveQuestionNo"
                      type="number"
                      min="1"
                      max="45"
                      class="w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="번호"
                    />
                    <span class="text-red-500 text-xs">*</span>
                  </div>
                </div>
              </div>

              <!-- Send error -->
              <p v-if="sendError" class="text-red-500 text-xs mb-2">{{ sendError }}</p>

              <!-- Image preview -->
              <div v-if="uploadedImage" class="mb-3 relative inline-block">
                <img :src="uploadedImage" alt="업로드된 이미지" class="h-20 rounded border" />
                <button
                  @click="clearImage"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X :size="12" />
                </button>
              </div>

              <div class="flex gap-2">
                <div class="flex gap-2">
                  <label class="cursor-pointer">
                    <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" capture="environment" />
                    <div class="p-2 border-2 border-gray-300 rounded-lg hover:border-emerald-500 transition-colors">
                      <Camera :size="20" class="text-gray-600" />
                    </div>
                  </label>
                  <label class="cursor-pointer">
                    <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
                    <div class="p-2 border-2 border-gray-300 rounded-lg hover:border-emerald-500 transition-colors">
                      <Upload :size="20" class="text-gray-600" />
                    </div>
                  </label>
                </div>
                <textarea
                  v-model="inputText"
                  @keydown.enter.exact.prevent="handleEnterKey"
                  :placeholder="currentChat && !currentChat.initialized ? '이미지를 첨부하면 모의고사 정보를 입력할 수 있습니다.' : '추가 질문을 입력하세요... (Shift+Enter로 줄바꿈)'"
                  class="flex-1 min-h-[60px] resize-none border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  @click="handleSendMessage"
                  :disabled="isLoading || (!inputText.trim() && !uploadedImage)"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-lg disabled:opacity-50"
                >
                  <Send :size="20" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import MarkdownIt from 'markdown-it'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import katex from 'katex'
import DOMPurify from 'dompurify'
import 'katex/dist/katex.min.css'
import Sidebar from '@/components/Sidebar.vue'
import {
  ArrowLeft, Send, Sparkles, Camera, Upload, X, Plus,
  MessageSquare, Trash2, Image as ImageIcon
} from 'lucide-vue-next'

// ── KaTeX / Markdown ──────────────────────────────────────────────────────────

const renderKatex = (source: string, displayMode: boolean) =>
  katex.renderToString(source, { displayMode, throwOnError: false, strict: 'ignore' })

type MarkdownItInstance = ReturnType<typeof MarkdownIt>

const markdownKatex = (md: MarkdownItInstance): void => {
  // 인라인 $...$
  md.inline.ruler.before('escape', 'math_inline', (state: StateInline, silent: boolean) => {
    if (state.src.charCodeAt(state.pos) !== 0x24) return false
    if (state.src.charCodeAt(state.pos + 1) === 0x24) return false // $$는 math_display가 처리
    const start = state.pos + 1
    const end = state.src.indexOf('$', start)
    if (end === -1 || end === start) return false
    if (state.src.charCodeAt(end - 1) === 0x5c) return false
    if (!silent) {
      const token = state.push('math_inline', 'math', 0)
      token.content = state.src.slice(start, end)
    }
    state.pos = end + 1
    return true
  })

  // 한 줄 $$...$$ — math_inline 앞에 삽입하여 $$ 우선 처리
  md.inline.ruler.before('math_inline', 'math_display', (state: StateInline, silent: boolean) => {
    if (state.src.charCodeAt(state.pos) !== 0x24) return false
    if (state.src.charCodeAt(state.pos + 1) !== 0x24) return false
    const start = state.pos + 2
    const end = state.src.indexOf('$$', start)
    if (end === -1) return false
    if (!silent) {
      const token = state.push('math_block', 'math', 0)
      token.content = state.src.slice(start, end)
    }
    state.pos = end + 2
    return true
  })

  // 멀티라인 $$ 블록
  md.block.ruler.before('fence', 'math_block', (
    state: StateBlock,
    startLine: number,
    endLine: number,
    silent: boolean,
  ) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const maxPos = state.eMarks[startLine]
    const firstLine = state.src.slice(startPos, maxPos).trim()
    if (firstLine !== '$$') return false
    let nextLine = startLine + 1
    const content: string[] = []
    for (; nextLine < endLine; nextLine += 1) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine]
      const lineEnd = state.eMarks[nextLine]
      const line = state.src.slice(lineStart, lineEnd)
      if (line.trim() === '$$') {
        if (!silent) {
          const token = state.push('math_block', 'math', 0)
          token.block = true
          token.content = content.join('\n')
          token.map = [startLine, nextLine + 1]
        }
        state.line = nextLine + 1
        return true
      }
      content.push(line)
    }
    return false
  })

  md.renderer.rules.math_inline = (tokens: Token[], idx: number) => renderKatex(tokens[idx].content, false)
  md.renderer.rules.math_block = (tokens: Token[], idx: number) => renderKatex(tokens[idx].content, true)
}

const markdown = new MarkdownIt({ html: false, breaks: true, linkify: true }).use(markdownKatex)
const renderMessage = (content: string) => DOMPurify.sanitize(markdown.render(content))

// ── Types ─────────────────────────────────────────────────────────────────────

type ExamInfo = {
  examYear: string
  examMonth: string
  examOrg: string
  examGrade: string
  questionNo: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  hasImage?: boolean
}

type ChatRoom = {
  id: string
  apiChatId?: number
  title: string
  subject: string
  lastMessage: string
  timestamp: Date
  messages: Message[]
  examInfo?: ExamInfo
  initialized: boolean
  messagesLoaded: boolean
}

type SessionResponse = {
  chatId: number
  name: string
  createdAt: string
  preview: string
}

type MessageResponse = {
  messageId: number
  sender: string
  content: string
  sendAt: string
}

type SolveResponse = {
  chatId?: number
  subject: string
  solution: string
  conceptTags: string[]
  confidence: 'high' | 'medium' | 'low'
  problemCount: number
  isValid: boolean
  errorMessage: string
}

type FollowupResponse = {
  chatId: number
  solution: string
  conceptTags: string[]
  confidence: 'high' | 'medium' | 'low'
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STUDENT_ID = 1

const subjects = [
  { id: 'math',    name: '수학',  color: '#10b981' },
  { id: 'korean',  name: '국어',  color: '#f59e0b' },
  { id: 'english', name: '영어',  color: '#3b82f6' },
  { id: 'science', name: '과학',  color: '#8b5cf6' },
  { id: 'social',  name: '사회',  color: '#06b6d4' },
  { id: 'history', name: '한국사', color: '#ec4899' },
]

const subjectToApi: Record<string, string> = {
  math: '수학', korean: '국어', english: '영어',
  science: '과학', social: '사회', history: '사회',
}

const nameToSubjectId: Record<string, string> = {
  '수학': 'math', '국어': 'korean', '영어': 'english',
  '과학': 'science', '사회': 'social',
}

function subjectIdFromName(name: string): string {
  return Object.entries(nameToSubjectId).find(([k]) => name.startsWith(k))?.[1] ?? 'math'
}

const examOrgs = ['교육청', '평가원', '수능'] as const
const examGrades = ['고1', '고2', '고3'] as const
const examMonths = [3, 4, 6, 7, 9, 10, 11]

// ── State ─────────────────────────────────────────────────────────────────────

const chatRooms = ref<ChatRoom[]>([])
const currentChatId = ref<string | null>(null)
const inputText = ref('')
const isLoading = ref(false)
const uploadedImage = ref<string | null>(null)
const uploadedFile = ref<File | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const sendError = ref('')

// Dialog state
const showNewChatDialog = ref(false)
const newChatSubject = ref('math')

// Solve 시험 정보 (이미지 첨부 시 입력)
const solveExamYear = ref('2025')
const solveExamMonth = ref('6')
const solveExamOrg = ref<string>('교육청')
const solveExamGrade = ref<string>('고3')
const solveQuestionNo = ref<number | null>(null)

// ── Computed ──────────────────────────────────────────────────────────────────

const currentChat = computed(() => chatRooms.value.find(c => c.id === currentChatId.value))
const currentMessages = computed(() => currentChat.value?.messages ?? [])

watch(currentMessages, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}, { deep: true })

// 채팅방 전환 시 메시지 lazy-load
watch(currentChatId, async (id) => {
  if (!id) return
  const chat = chatRooms.value.find(c => c.id === id)
  if (!chat || chat.messagesLoaded || !chat.apiChatId) return

  try {
    const res = await fetch(`/api/chat/messages/${chat.apiChatId}`)
    if (!res.ok) return
    const msgs = (await res.json()) as MessageResponse[]

    const idx = chatRooms.value.findIndex(c => c.id === id)
    if (idx === -1) return

    chatRooms.value[idx].messages = msgs.map(m => ({
      id: String(m.messageId),
      role: (m.sender === 'student' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(m.sendAt),
    }))
    chatRooms.value[idx].messagesLoaded = true

    const last = msgs[msgs.length - 1]
    if (last) chatRooms.value[idx].lastMessage = last.content.slice(0, 60)
  } catch (e) {
    console.error('메시지 로드 실패', e)
  }
}, { immediate: true })

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const res = await fetch(`/api/chat/sessions/${STUDENT_ID}`)
    if (!res.ok) return
    const sessions = (await res.json()) as SessionResponse[]

    chatRooms.value = sessions.map(s => ({
      id: `db-${s.chatId}`,
      apiChatId: s.chatId,
      title: s.name,
      subject: subjectIdFromName(s.name),
      lastMessage: s.preview,
      timestamp: new Date(s.createdAt),
      messages: [],
      initialized: true,
      messagesLoaded: false,
    }))

    if (chatRooms.value.length > 0) currentChatId.value = chatRooms.value[0].id
  } catch (e) {
    console.error('세션 로드 실패', e)
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function examInfoLabel(info: ExamInfo): string {
  if (info.examOrg === '수능') return `${info.examYear}년 수능`
  return `${info.examYear}년 ${info.examMonth}월 ${info.examOrg} ${info.examGrade}`
}

function buildChatTitle(subject: string, info: ExamInfo): string {
  const subjectName = subjects.find(s => s.id === subject)?.name ?? ''
  return `${subjectName} ${examInfoLabel(info)} ${info.questionNo}번`
}

// ── Dialog ────────────────────────────────────────────────────────────────────

const createNewChat = () => {
  const subjectName = subjects.find(s => s.id === newChatSubject.value)?.name ?? '새'
  const newChat: ChatRoom = {
    id: Date.now().toString(),
    title: `새 대화 - ${subjectName}`,
    subject: newChatSubject.value,
    lastMessage: '',
    timestamp: new Date(),
    messages: [
      {
        id: '0',
        role: 'assistant',
        content: '안녕하세요! AI 문제풀이 튜터입니다.\n\n문제 사진을 첨부하면 모의고사 정보를 입력하고 AI에게 풀이를 요청할 수 있습니다.',
        timestamp: new Date(),
      },
    ],
    initialized: false,
    messagesLoaded: true,
  }
  chatRooms.value.unshift(newChat)
  currentChatId.value = newChat.id
  showNewChatDialog.value = false
}

const deleteChat = (chatId: string) => {
  chatRooms.value = chatRooms.value.filter(c => c.id !== chatId)
  if (currentChatId.value === chatId) {
    currentChatId.value = chatRooms.value[0]?.id ?? null
  }
}

// ── API ───────────────────────────────────────────────────────────────────────

async function callSolve(chat: ChatRoom, examInfo: ExamInfo, file: File, userMessage?: string): Promise<SolveResponse> {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('studentId', String(STUDENT_ID))
  formData.append('subject', subjectToApi[chat.subject] ?? '')
  formData.append('examYear', examInfo.examYear)
  formData.append('examMonth', examInfo.examMonth)
  formData.append('examOrg', examInfo.examOrg)
  formData.append('examGrade', examInfo.examGrade)
  formData.append('questionNo', examInfo.questionNo)
  if (userMessage) formData.append('message', userMessage)

  const res = await fetch('/api/chat/solve', { method: 'POST', body: formData })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message ?? '풀이 요청에 실패했습니다.')
  }
  return res.json() as Promise<SolveResponse>
}

async function callFollowup(chatId: number, message: string): Promise<FollowupResponse> {
  const res = await fetch('/api/chat/followup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message ?? '후속 질문에 실패했습니다.')
  }
  return res.json() as Promise<FollowupResponse>
}

// ── Send Message ──────────────────────────────────────────────────────────────

const handleEnterKey = (e: KeyboardEvent) => {
  if (e.isComposing || e.keyCode === 229) return  // 한글 IME 조합 중 무시
  handleSendMessage()
}

const handleSendMessage = async () => {
  if (!inputText.value.trim() && !uploadedFile.value) return

  const chat = currentChat.value
  if (!chat) return

  // 첫 메시지: 이미지 필수
  if (!chat.initialized && !uploadedFile.value) {
    sendError.value = '첫 메시지에는 문제 이미지를 반드시 첨부해주세요.'
    return
  }

  // 첫 메시지: 시험 정보 validation
  if (!chat.initialized && uploadedFile.value) {
    if (!solveQuestionNo.value || isNaN(Number(solveQuestionNo.value))) {
      sendError.value = '문항 번호를 입력해주세요.'
      return
    }
    if (!solveExamYear.value) {
      sendError.value = '학년도를 입력해주세요.'
      return
    }
  }

  sendError.value = ''

  const chatIndex = chatRooms.value.findIndex(c => c.id === currentChatId.value)
  if (chatIndex === -1) return

  const messageText = inputText.value.trim()
  const imageFile = uploadedFile.value

  chatRooms.value[chatIndex].messages.push({
    id: Date.now().toString(),
    role: 'user',
    content: messageText || '이미지 문제 풀이 요청',
    timestamp: new Date(),
    hasImage: !!imageFile,
  })
  chatRooms.value[chatIndex].lastMessage = messageText || '이미지 문제 풀이 요청'
  chatRooms.value[chatIndex].timestamp = new Date()

  inputText.value = ''
  clearImage()
  isLoading.value = true

  try {
    let solution: string

    if (!chat.initialized && imageFile) {
      const examInfo: ExamInfo = {
        examYear: String(solveExamYear.value),
        examMonth: solveExamOrg.value === '수능' ? '' : String(solveExamMonth.value),
        examOrg: solveExamOrg.value,
        examGrade: solveExamOrg.value === '수능' ? '' : solveExamGrade.value,
        questionNo: String(solveQuestionNo.value),
      }

      const res = await callSolve(chat, examInfo, imageFile, messageText || undefined)

      if (!res.isValid) {
        solution = res.errorMessage || '이미지를 인식할 수 없습니다. 다시 시도해주세요.'
      } else {
        solution = res.solution
        if (res.chatId) chatRooms.value[chatIndex].apiChatId = res.chatId
        chatRooms.value[chatIndex].examInfo = examInfo
        chatRooms.value[chatIndex].title = buildChatTitle(chat.subject, examInfo)
        chatRooms.value[chatIndex].initialized = true
        solveQuestionNo.value = null
      }
    } else if (chat.apiChatId) {
      const res = await callFollowup(chat.apiChatId, messageText)
      solution = res.solution
    } else {
      solution = '세션 정보를 찾을 수 없습니다. 이미지를 첨부하여 다시 시작해주세요.'
    }

    chatRooms.value[chatIndex].messages.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: solution,
      timestamp: new Date(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '오류가 발생했습니다.'
    chatRooms.value[chatIndex].messages.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `오류: ${msg}`,
      timestamp: new Date(),
    })
  } finally {
    isLoading.value = false
  }
}

// ── Image Upload ──────────────────────────────────────────────────────────────

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadedFile.value = file
  const reader = new FileReader()
  reader.onloadend = () => { uploadedImage.value = reader.result as string }
  reader.readAsDataURL(file)
}

const clearImage = () => {
  uploadedImage.value = null
  uploadedFile.value = null
}

// ── Formatters ────────────────────────────────────────────────────────────────

const formatTime = (date: Date) =>
  date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

const formatDate = (date: Date) =>
  date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
</script>

<style scoped>
.chat-message {
  overflow-wrap: anywhere;
  line-height: 1.65;
}

.chat-message :deep(p) {
  margin: 0 0 0.75rem;
}

.chat-message :deep(p:last-child) {
  margin-bottom: 0;
}

.chat-message :deep(ul),
.chat-message :deep(ol) {
  margin: 0.5rem 0 0.75rem 1.25rem;
}

.chat-message :deep(ul) {
  list-style: disc;
}

.chat-message :deep(ol) {
  list-style: decimal;
}

.chat-message :deep(strong) {
  font-weight: 700;
}

.chat-message :deep(.katex-display) {
  margin: 0.75rem 0;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
