<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />

    <!-- New Chat Dialog -->
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

          <div v-if="currentChat" class="mt-3">
            <span
              class="text-white text-xs font-medium px-2.5 py-1 rounded-full"
              :style="{ backgroundColor: subjects.find(s => s.id === currentChat!.subject)?.color }"
            >
              {{ subjects.find(s => s.id === currentChat!.subject)?.name }}
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
                  <div class="whitespace-pre-wrap text-sm">{{ message.content }}</div>
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
              <div v-if="uploadedImage" class="mb-3 relative inline-block">
                <img :src="uploadedImage" alt="업로드된 이미지" class="h-20 rounded border" />
                <button
                  @click="uploadedImage = null"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X :size="12" />
                </button>
              </div>

              <div class="flex gap-2">
                <div class="flex gap-2">
                  <label class="cursor-pointer">
                    <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
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
                  @keydown.enter.exact.prevent="handleSendMessage"
                  placeholder="문제를 입력하세요... (Shift+Enter로 줄바꿈)"
                  class="flex-1 min-h-[60px] resize-none border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  @click="handleSendMessage"
                  :disabled="!inputText.trim() && !uploadedImage"
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
import { ref, computed, nextTick, watch } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import {
  ArrowLeft, Send, Sparkles, Camera, Upload, X, Plus,
  MessageSquare, Trash2, Image as ImageIcon
} from 'lucide-vue-next'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  hasImage?: boolean
}

type ChatRoom = {
  id: string
  title: string
  subject: string
  lastMessage: string
  timestamp: Date
  messages: Message[]
}

const subjects = [
  { id: 'math',     name: '수학',      color: '#10b981' },
  { id: 'korean',   name: '국어',      color: '#f59e0b' },
  { id: 'english',  name: '영어',      color: '#3b82f6' },
  { id: 'science1', name: '생명과학1', color: '#8b5cf6' },
  { id: 'science2', name: '지구과학1', color: '#06b6d4' },
  { id: 'history',  name: '한국사',    color: '#ec4899' },
]

const chatRooms = ref<ChatRoom[]>([
  {
    id: '1',
    title: '수학 - 극한 문제',
    subject: 'math',
    lastMessage: 'lim(x→0) (sin x)/x 의 값을 구하시오',
    timestamp: new Date(Date.now() - 3600000),
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: '안녕하세요! AI 문제풀이 튜터입니다. 📚\n\n궁금한 문제를 텍스트로 입력하거나 사진으로 찍어 올려주세요. 단계별로 자세히 설명해드리겠습니다.',
        timestamp: new Date(Date.now() - 3600000),
      },
    ],
  },
])

const currentChatId = ref('1')
const inputText = ref('')
const isLoading = ref(false)
const uploadedImage = ref<string | null>(null)
const showNewChatDialog = ref(false)
const newChatSubject = ref('math')
const messagesContainer = ref<HTMLElement | null>(null)

const currentChat = computed(() => chatRooms.value.find(c => c.id === currentChatId.value))
const currentMessages = computed(() => currentChat.value?.messages || [])

watch(currentMessages, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}, { deep: true })

const createNewChat = () => {
  const subjectName = subjects.find(s => s.id === newChatSubject.value)?.name
  const newChat: ChatRoom = {
    id: Date.now().toString(),
    title: `새 대화 - ${subjectName}`,
    subject: newChatSubject.value,
    lastMessage: '',
    timestamp: new Date(),
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: '안녕하세요! AI 문제풀이 튜터입니다. 📚\n\n궁금한 문제를 텍스트로 입력하거나 사진으로 찍어 올려주세요. 단계별로 자세히 설명해드리겠습니다.',
        timestamp: new Date(),
      },
    ],
  }
  chatRooms.value.unshift(newChat)
  currentChatId.value = newChat.id
  showNewChatDialog.value = false
}

const deleteChat = (chatId: string) => {
  chatRooms.value = chatRooms.value.filter(c => c.id !== chatId)
  if (currentChatId.value === chatId && chatRooms.value.length > 0) {
    currentChatId.value = chatRooms.value[0].id
  }
}

const handleSendMessage = () => {
  if (!inputText.value.trim() && !uploadedImage.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: inputText.value,
    timestamp: new Date(),
    hasImage: !!uploadedImage.value,
  }

  const chatIndex = chatRooms.value.findIndex(c => c.id === currentChatId.value)
  if (chatIndex !== -1) {
    const question = inputText.value
    chatRooms.value[chatIndex].messages.push(userMessage)
    chatRooms.value[chatIndex].lastMessage = inputText.value
    chatRooms.value[chatIndex].timestamp = new Date()
    if (chatRooms.value[chatIndex].messages.length === 2) {
      chatRooms.value[chatIndex].title =
        question.substring(0, 30) + (question.length > 30 ? '...' : '')
    }
  }

  inputText.value = ''
  isLoading.value = true

  setTimeout(() => {
    const subject = currentChat.value?.subject || ''
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: generateAIResponse(userMessage.content, subject),
      timestamp: new Date(),
    }
    if (chatIndex !== -1) {
      chatRooms.value[chatIndex].messages.push(aiResponse)
    }
    isLoading.value = false
    uploadedImage.value = null
  }, 1500)
}

function generateAIResponse(question: string, subject: string): string {
  if (subject === 'math') {
    return `**문제 분석**\n${question}\n\n**풀이 과정**\n\n**1단계: 개념 확인**\n이 문제는 극한의 기본 성질을 활용하는 문제입니다.\n\n**2단계: 공식 적용**\nlim(x→0) (sin x)/x = 1 (기본 극한 공식)\n\n**3단계: 계산**\n주어진 식에 공식을 적용하면 답은 **1**입니다.\n\n**핵심 개념**\n- 삼각함수의 극한\n- 로피탈 정리 (선택적)\n\n더 궁금한 점이 있으면 언제든 물어보세요! 😊`
  } else if (subject === 'korean') {
    return `**문제 분석**\n${question}\n\n**해설**\n\n**1. 작품의 배경**\n이 작품은 화자의 내면적 감정을 자연물에 투영하여 표현하고 있습니다.\n\n**2. 화자의 정서**\n- 주된 정서: 그리움, 고독\n- 표현 기법: 은유, 의인화\n\n**3. 시적 의미**\n화자는 자연을 통해 자신의 감정을 승화시키고 있습니다.\n\n추가로 궁금한 부분이 있으면 말씀해주세요!`
  } else if (subject === 'english') {
    return `**Question Analysis**\n${question}\n\n**Explanation**\n\n**What vs Which (관계대명사)**\n- What: 선행사 포함 "~하는 것"\n- Which: 선행사 필요, 사물을 지칭\n\n**Key Differences**\n1. What은 선행사 포함, Which는 선행사 필요\n2. What은 명사절, Which는 형용사절\n\n더 설명이 필요한 부분이 있나요?`
  } else if (subject === 'science1') {
    return `**문제 분석**\n${question}\n\n**개념 설명**\n\n**1. 핵심 개념**\n이 문제는 생명과학의 기본 원리를 이해하는 문제입니다.\n\n**2. 풀이 방법**\n- 단계별 접근\n- 관련 개념 연결\n\n궁금한 점이 있으면 물어보세요!`
  } else if (subject === 'science2') {
    return `**문제 분석**\n${question}\n\n**지구과학 개념**\n\n**1. 관련 이론**\n이 문제와 관련된 지구과학 이론을 설명드리겠습니다.\n\n**2. 핵심 포인트**\n- 중요 개념\n- 주의할 점\n\n추가 질문 있으시면 말씀해주세요!`
  } else if (subject === 'history') {
    return `**문제 분석**\n${question}\n\n**한국사 설명**\n\n**1. 역사적 배경**\n해당 시대의 역사적 배경과 맥락을 설명드리겠습니다.\n\n**2. 핵심 내용**\n- 주요 사건과 인물\n- 시대적 특징\n- 역사적 의의\n\n더 궁금한 점이 있으면 물어보세요!`
  }
  return `**질문 분석**\n${question}\n\n이 문제에 대해 자세히 설명해드리겠습니다. 단계별로 풀이해볼게요!\n\n추가 질문이 있으면 언제든 물어보세요! 😊`
}

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onloadend = () => {
      uploadedImage.value = reader.result as string
    }
    reader.readAsDataURL(file)
  }
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

const formatDate = (date: Date) =>
  date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
</script>
