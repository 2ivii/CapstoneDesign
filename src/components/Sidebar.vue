<template>
  <div class="w-64 bg-[#2C3E37] h-screen flex flex-col text-white">
    <!-- Logo -->
    <div class="p-6 border-b border-white/10">
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
          <TrendingUp class="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 class="font-bold text-lg">에듀핏</h1>
          <p class="text-xs text-white/60">EduFit AI</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4">
      <div class="space-y-2">
        <router-link
          v-for="item in menuItems"
          :key="item.id"
          :to="item.path"
          v-slot="{ isActive }"
          class="block"
        >
          <div
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              isActive
                ? 'bg-emerald-600 text-white'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span class="text-sm flex-1">{{ item.label }}</span>
            <span
              v-if="item.badge && isActive"
              class="text-xs bg-white/20 px-2 py-0.5 rounded"
            >
              {{ item.badge }}
            </span>
          </div>
        </router-link>
      </div>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-white/10">
      <div class="flex items-center gap-3 px-4 py-3">
        <div class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
          <span class="text-sm">이</span>
        </div>
        <div class="text-sm">
          <p class="text-white/90">이민우</p>
          <p class="text-xs text-white/50">고등학생 3학년</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Camera, Target, Calendar, MessageSquare, TrendingUp, CheckSquare } from 'lucide-vue-next'

const menuItems = [
  { id: 'f1', label: '성적표 촬영', icon: Camera, path: '/', badge: '진행중' },
  { id: 'f1-1', label: '틀린 문항 정밀 체크', icon: CheckSquare, path: '/answer-marking' },
  { id: 'f2', label: '취약영역 분석', icon: Target, path: '/analysis' },
  { id: 'f3', label: 'AI 학습 플래닝', icon: Calendar, path: '/ai-planner' },
  { id: 'f4', label: 'AI 문제풀이 챗봇', icon: MessageSquare, path: '/ai-chatbot' },
]
</script>
