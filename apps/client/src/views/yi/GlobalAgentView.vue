<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChatPanel from '@/components/yi/chat/ChatPanel.vue'
import { useAppStore } from '@/stores/yi/app'
import { useChatStore } from '@/stores/yi/chat'
import { useProfilesStore } from '@/stores/yi/profiles'
import { useSettingsStore } from '@/stores/yi/settings'

const appStore = useAppStore()
const chatStore = useChatStore()
const profilesStore = useProfilesStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const router = useRouter()

const routeSessionId = computed(() => {
  const value = route.params.sessionId
  return typeof value === 'string' && value.trim() ? value : null
})

const routeProfile = computed(() => {
  const value = route.query.profile
  return typeof value === 'string' && value.trim() ? value : null
})

async function loadRouteSession() {
  await chatStore.loadSessions(chatStore.sessionProfileFilter, routeSessionId.value)
  if (routeSessionId.value && chatStore.activeSessionId !== routeSessionId.value) {
    await router.replace({ name: 'yi.globalAgent' })
  }
}

onMounted(async () => {
  chatStore.setRuntimeMode('global_agent')
  appStore.loadModels()
  await Promise.all([
    profilesStore.fetchProfiles(),
    settingsStore.fetchSettings(),
  ])
  await loadRouteSession()
})

onUnmounted(() => {
  chatStore.setRuntimeMode('default')
})

watch([routeSessionId, routeProfile], async ([sessionId]) => {
  if (chatStore.runtimeMode !== 'global_agent' || !chatStore.sessionsLoaded) return
  if (!sessionId) {
    await chatStore.loadSessions(chatStore.sessionProfileFilter)
    return
  }
  if (chatStore.activeSessionId === sessionId) return

  const exists = chatStore.sessions.some(session => session.id === sessionId)
  if (!exists) {
    await loadRouteSession()
    return
  }

  await chatStore.switchSession(sessionId)
})
</script>

<template>
  <div class="global-agent-view">
    <ChatPanel />
  </div>
</template>

<style scoped lang="scss">
.global-agent-view {
  height: calc(100 * var(--vh));
  display: flex;
  flex-direction: column;
}
</style>
