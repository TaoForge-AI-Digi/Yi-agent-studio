import { createRouter, createWebHashHistory } from 'vue-router'
import { isStoredSuperAdmin } from '@/api/client'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/yi/chat',
    },
    {
      path: '/yi/chat',
      name: 'yi.chat',
      component: () => import('@/views/hermes/ChatView.vue'),
    },
    {
      path: '/yi/session/:sessionId',
      name: 'yi.session',
      component: () => import('@/views/hermes/ChatView.vue'),
    },
    {
      path: '/yi/history',
      name: 'yi.history',
      component: () => import('@/views/hermes/HistoryView.vue'),
    },
    {
      path: '/yi/history/session/:sessionId',
      name: 'yi.historySession',
      component: () => import('@/views/hermes/HistoryView.vue'),
    },
    {
      path: '/yi/global-agent',
      name: 'yi.globalAgent',
      component: () => import('@/views/hermes/GlobalAgentView.vue'),
    },
    {
      path: '/yi/global-agent/session/:sessionId',
      name: 'yi.globalAgentSession',
      component: () => import('@/views/hermes/GlobalAgentView.vue'),
    },
    {
      path: '/yi/jobs',
      name: 'yi.jobs',
      component: () => import('@/views/hermes/JobsView.vue'),
    },
    {
      path: '/yi/kanban',
      name: 'yi.kanban',
      component: () => import('@/views/hermes/KanbanView.vue'),
    },
    {
      path: '/yi/workflow',
      name: 'yi.workflow',
      component: () => import('@/views/hermes/WorkflowView.vue'),
    },
    {
      path: '/yi/models',
      name: 'yi.models',
      component: () => import('@/views/hermes/ModelsView.vue'),
    },
    {
      path: '/yi/profiles',
      name: 'yi.profiles',
      component: () => import('@/views/hermes/ProfilesView.vue'),
    },
    {
      path: '/yi/logs',
      name: 'yi.logs',
      component: () => import('@/views/hermes/LogsView.vue'),
    },
    {
      path: '/yi/usage',
      name: 'yi.usage',
      component: () => import('@/views/hermes/UsageView.vue'),
    },
    {
      path: '/yi/performance',
      name: 'yi.performance',
      component: () => import('@/views/hermes/PerformanceView.vue'),
      meta: { requiresSuperAdmin: true },
    },
    {
      path: '/yi/skills-usage',
      name: 'yi.skillsUsage',
      component: () => import('@/views/hermes/SkillsUsageView.vue'),
    },
    {
      path: '/yi/skills',
      name: 'yi.skills',
      component: () => import('@/views/hermes/SkillsView.vue'),
    },
    {
      path: '/yi/plugins',
      name: 'yi.plugins',
      component: () => import('@/views/hermes/PluginsView.vue'),
    },
    {
      path: '/yi/memory',
      name: 'yi.memory',
      component: () => import('@/views/hermes/MemoryView.vue'),
    },
    {
      path: '/yi/archive',
      name: 'yi.archive',
      component: () => import('@/views/hermes/ArchiveView.vue'),
    },
    {
      path: '/yi/marketplace',
      name: 'yi.marketplace',
      component: () => import('@/views/hermes/MarketplaceView.vue'),
    },
    {
      path: '/yi/settings',
      name: 'yi.settings',
      component: () => import('@/views/hermes/SettingsView.vue'),
    },
    {
      path: '/yi/channels',
      name: 'yi.channels',
      component: () => import('@/views/hermes/ChannelsView.vue'),
    },
    {
      path: '/yi/terminal',
      name: 'yi.terminal',
      component: () => import('@/views/hermes/TerminalView.vue'),
      meta: { requiresSuperAdmin: true },
    },
    {
      path: '/yi/group-chat',
      name: 'yi.groupChat',
      component: () => import('@/views/hermes/GroupChatView.vue'),
    },
    {
      path: '/yi/group-chat/room/:roomId',
      name: 'yi.groupChatRoom',
      component: () => import('@/views/hermes/GroupChatView.vue'),
    },
    {
      path: '/yi/files',
      name: 'yi.files',
      component: () => import('@/views/hermes/FilesView.vue'),
    },
    {
      path: '/yi/mcp',
      name: 'yi.mcp',
      component: () => import('@/views/hermes/McpManagerView.vue'),
      meta: { requiresSuperAdmin: true },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  // ponytail: 奕无登录,直接放行(除 super-admin 页面)
  if (to.meta.requiresSuperAdmin && !isStoredSuperAdmin()) {
    next({ name: 'yi.chat' })
    return
  }
  next()
})

export default router
