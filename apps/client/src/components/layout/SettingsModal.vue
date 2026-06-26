<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/yi/app'
import { getStoredUsername, isStoredSuperAdmin } from '@/api/client'
import LanguageSwitch from '@/components/layout/LanguageSwitch.vue'
import ThemeSwitch from '@/components/layout/ThemeSwitch.vue'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const show = defineModel<boolean>('show', { required: true })

const isSuperAdmin = computed(() => isStoredSuperAdmin())
const username = computed(() => getStoredUsername())

// ponytail: 设置弹窗 — 核心入口聚合,点链关弹窗 + 跳路由
const items = computed(() => {
  const base = [
    { key: 'general', label: t('yi.settings.general'), icon: '⚙', route: 'yi.settings' },
    { key: 'models', label: t('sidebar.models'), icon: '◎', route: 'yi.models' },
    { key: 'mcp', label: t('sidebar.mcp'), icon: '⊞', route: 'yi.mcp' },
  ] as const
  if (isSuperAdmin.value) {
    return [
      ...base,
      { key: 'profiles', label: t('sidebar.profiles'), icon: '◉', route: 'yi.profiles' },
    ] as const
  }
  return base
})

function go(route: string) {
  show.value = false
  void router.push({ name: route })
}

const version = computed(() => appStore.serverVersion || '0.0.0')
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    :title="t('yi.settings.title')"
    style="width: 480px; max-width: calc(100vw - 32px);"
  >
    <div class="settings-modal">
      <div class="settings-meta">
        <div v-if="username" class="settings-user">
          <span class="settings-user-label">{{ t('yi.settings.signedInAs') }}</span>
          <span class="settings-user-name">{{ username }}</span>
        </div>
        <div class="settings-version">Yi v{{ version }}</div>
      </div>

      <div class="settings-section">
        <div class="settings-section-label">{{ t('yi.settings.preferences') }}</div>
        <div class="settings-row">
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-label">{{ t('yi.settings.navigation') }}</div>
        <div class="settings-list">
          <button
            v-for="it in items"
            :key="it.key"
            class="settings-item"
            type="button"
            @click="go(it.route)"
          >
            <span class="settings-item-icon">{{ it.icon }}</span>
            <span class="settings-item-label">{{ it.label }}</span>
            <svg class="settings-item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.settings-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.settings-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: $text-muted;
  .settings-user { display: inline-flex; gap: 6px; }
  .settings-user-name { color: $text-primary; font-weight: 500; }
  .settings-version { font-family: $font-code; }
}
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  .settings-section-label {
    font-size: 11px; font-weight: 600; color: $text-muted;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .settings-row { display: flex; gap: 8px; }
}
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.settings-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  color: $text-primary;
  transition: background-color $transition-fast, border-color $transition-fast;
  &:hover { background: rgba(var(--accent-primary-rgb), 0.06); border-color: $border-color; }
  .settings-item-icon {
    width: 22px; height: 22px; display: inline-grid; place-items: center;
    background: rgba(var(--accent-primary-rgb), 0.08);
    border-radius: 5px; color: $accent-primary; font-size: 13px;
  }
  .settings-item-label { flex: 1; }
  .settings-item-arrow { color: $text-muted; }
}
</style>
