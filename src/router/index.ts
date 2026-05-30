import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'ScoreRegistration',
    component: () => import('@/pages/ScoreRegistration.vue'),
  },
  {
    path: '/answer-marking',
    name: 'AnswerMarking',
    component: () => import('@/pages/AnswerMarking.vue'),
  },
  {
    path: '/analysis',
    name: 'WeaknessAnalysis',
    component: () => import('@/pages/WeaknessAnalysis.vue'),
  },
  {
    path: '/ai-planner',
    name: 'AIPlanner',
    component: () => import('@/pages/AIPlanner.vue'),
  },
  {
    path: '/ai-chatbot',
    name: 'AIChatbot',
    component: () => import('@/pages/AIChatbot.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
