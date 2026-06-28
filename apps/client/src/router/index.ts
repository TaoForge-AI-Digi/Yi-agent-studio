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
      component: () => import('@/views/yi/ChatView.vue'),
    },
    {
      path: '/yi/session/:sessionId',
      name: 'yi.session',
      component: () => import('@/views/yi/ChatView.vue'),
    },
    {
      path: '/yi/history',
      name: 'yi.history',
      component: () => import('@/views/yi/HistoryView.vue'),
    },
    {
      path: '/yi/history/session/:sessionId',
      name: 'yi.historySession',
      component: () => import('@/views/yi/HistoryView.vue'),
    },
    {
      path: '/yi/global-agent',
      name: 'yi.globalAgent',
      component: () => import('@/views/yi/GlobalAgentView.vue'),
    },
    {
      path: '/yi/global-agent/session/:sessionId',
      name: 'yi.globalAgentSession',
      component: () => import('@/views/yi/GlobalAgentView.vue'),
    },
    {
      path: '/yi/jobs',
      name: 'yi.jobs',
      component: () => import('@/views/yi/JobsView.vue'),
    },
    {
      path: '/yi/kanban',
      name: 'yi.kanban',
      component: () => import('@/views/yi/KanbanView.vue'),
    },
    {
      path: '/yi/workflow',
      name: 'yi.workflow',
      component: () => import('@/views/yi/WorkflowView.vue'),
    },
    {
      path: '/yi/models',
      name: 'yi.models',
      component: () => import('@/views/yi/ModelsView.vue'),
    },
    {
      path: '/yi/logs',
      name: 'yi.logs',
      component: () => import('@/views/yi/LogsView.vue'),
    },
    {
      path: '/yi/usage',
      name: 'yi.usage',
      component: () => import('@/views/yi/UsageView.vue'),
    },
    {
      path: '/yi/performance',
      name: 'yi.performance',
      component: () => import('@/views/yi/PerformanceView.vue'),
      meta: { requiresSuperAdmin: true },
    },
    {
      path: '/yi/skills-usage',
      name: 'yi.skillsUsage',
      component: () => import('@/views/yi/SkillsUsageView.vue'),
    },
    {
      path: '/yi/skills',
      name: 'yi.skills',
      component: () => import('@/views/yi/SkillsView.vue'),
    },
    {
      path: '/yi/plugins',
      name: 'yi.plugins',
      component: () => import('@/views/yi/PluginsView.vue'),
    },
    {
      path: '/yi/archive',
      name: 'yi.archive',
      component: () => import('@/views/yi/ArchiveView.vue'),
    },
    {
      path: '/yi/marketplace',
      name: 'yi.marketplace',
      component: () => import('@/views/yi/MarketplaceView.vue'),
    },
    {
      path: '/yi/settings',
      name: 'yi.settings',
      component: () => import('@/views/yi/SettingsView.vue'),
    },
    {
      path: '/yi/channels',
      name: 'yi.channels',
      component: () => import('@/views/yi/ChannelsView.vue'),
    },
    {
      path: '/yi/terminal',
      name: 'yi.terminal',
      component: () => import('@/views/yi/TerminalView.vue'),
      meta: { requiresSuperAdmin: true },
    },
    {
      path: '/yi/group-chat',
      name: 'yi.groupChat',
      component: () => import('@/views/yi/GroupChatView.vue'),
    },
    {
      path: '/yi/group-chat/room/:roomId',
      name: 'yi.groupChatRoom',
      component: () => import('@/views/yi/GroupChatView.vue'),
    },
    {
      path: '/yi/files',
      name: 'yi.files',
      component: () => import('@/views/yi/FilesView.vue'),
    },
    {
      path: '/yi/mcp',
      name: 'yi.mcp',
      component: () => import('@/views/yi/McpManagerView.vue'),
      meta: { requiresSuperAdmin: true },
    },
    {
      path: '/yi/characters',
      name: 'yi.characters',
      component: () => import('@/views/yi/CharactersView.vue'),
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
