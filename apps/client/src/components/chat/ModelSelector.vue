<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NInput, NPopover, NScrollbar } from 'naive-ui'
import { useAppStore } from '@/stores/yi/app'
import { useProfilesStore } from '@/stores/yi/profiles'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const appStore = useAppStore()
const profilesStore = useProfilesStore()

const show = ref(false)
const search = ref('')
const collapsedGroups = ref<Record<string, boolean>>({})

const activeProfileName = computed(() => profilesStore.activeProfileName || 'default')
const activeModelGroups = computed(() => {
  const pm = appStore.profileModelGroups.find(e => e.profile === activeProfileName.value)
  return pm?.groups || []
})

const modelGroupsWithCustom = computed(() =>
  activeModelGroups.value.map(g => ({
    ...g,
    models: [
      ...g.models,
      ...(appStore.customModels[g.provider] || []).filter(m => !g.models.includes(m)),
    ],
  })),
)

function lower(v: unknown) {
  return typeof v === 'string' ? v.toLowerCase() : ''
}

const filteredGroups = computed(() => {
  const q = lower(search.value).trim()
  if (!q) return modelGroupsWithCustom.value
  return modelGroupsWithCustom.value
    .map(g => ({
      ...g,
      models: g.models.filter(m => {
        const dn = appStore.displayModelName(m, g.provider)
        return lower(m).includes(q) || lower(dn).includes(q)
      }),
    }))
    .filter(g => g.models.length > 0 || lower(g.label).includes(q))
})

function modelName(model: string, provider: string) {
  return appStore.displayModelName(model, provider)
}
function modelMeta(model: string, provider: string) {
  return activeModelGroups.value.find(g => g.provider === provider)?.model_meta?.[model]
}
function isCustom(model: string, provider: string) {
  return (appStore.customModels[provider] || []).includes(model)
}
function pick(model: string, provider: string) {
  if (modelMeta(model, provider)?.disabled) return
  appStore.switchModel(model, provider)
  show.value = false
  search.value = ''
}
function toggleGroup(p: string) {
  collapsedGroups.value[p] = !collapsedGroups.value[p]
}
function isCollapsed(p: string) { return !!collapsedGroups.value[p] }
function onOpen(v: boolean) {
  if (v) {
    collapsedGroups.value = {}
    search.value = ''
  }
}
const triggerLabel = computed(() =>
  appStore.displayModelName(appStore.selectedModel, appStore.selectedProvider) || '—',
)
</script>

<template>
  <NPopover
    :show="show"
    @update:show="(v: boolean) => { show = v; onOpen(v); }"
    trigger="click"
    placement="top-start"
    :show-arrow="false"
    raw
    :overlap="false"
  >
    <template #trigger>
      <button class="yi-model-trigger" type="button">
        <span class="yi-model-label" :title="triggerLabel">{{ triggerLabel }}</span>
        <svg class="yi-model-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </template>
    <div class="yi-model-pop" @click.stop>
      <div class="yi-model-pop-head">
        <NInput
          v-model:value="search"
          :placeholder="t('models.searchPlaceholder')"
          clearable
          size="small"
          class="yi-model-search"
        />
      </div>
      <NScrollbar style="max-height: 360px;">
        <div class="yi-model-list">
          <div v-for="g in filteredGroups" :key="g.provider" class="yi-model-group">
            <div class="yi-model-group-head" @click="toggleGroup(g.provider)">
              <svg
                class="yi-model-group-arrow" :class="{ collapsed: isCollapsed(g.provider) }"
                width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span class="yi-model-group-label">{{ g.label }}</span>
            </div>
            <div v-show="!isCollapsed(g.provider)" class="yi-model-group-items">
              <div
                v-for="m in g.models"
                :key="m"
                class="yi-model-item"
                :class="{
                  active: m === appStore.selectedModel && g.provider === appStore.selectedProvider,
                  disabled: !!modelMeta(m, g.provider)?.disabled,
                }"
                @click="pick(m, g.provider)"
              >
                <span class="yi-model-item-name">{{ modelName(m, g.provider) }}</span>
                <span v-if="modelMeta(m, g.provider)?.preview" class="yi-model-badge-preview">预览</span>
                <span v-if="isCustom(m, g.provider)" class="yi-model-badge-custom">自定义</span>
                <svg
                  v-if="m === appStore.selectedModel && g.provider === appStore.selectedProvider"
                  class="yi-model-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          </div>
          <div v-if="filteredGroups.length === 0" class="yi-model-empty">{{ t('models.noResults') || 'No results' }}</div>
        </div>
      </NScrollbar>
    </div>
  </NPopover>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.yi-model-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  border-radius: $radius-sm;
  background: transparent;
  border: 1px solid transparent;
  color: $text-secondary;
  font-size: 12px;
  cursor: pointer;
  max-width: 220px;

  &:hover { background: rgba(var(--accent-primary-rgb), 0.06); color: $text-primary; }
  &.active, &:focus-visible { color: $text-primary; }
}
.yi-model-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
.yi-model-arrow { color: $text-muted; flex-shrink: 0; }

.yi-model-pop {
  width: 320px;
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  overflow: hidden;
  .yi-model-pop-head { padding: 8px; border-bottom: 1px solid $border-color; }
}
.yi-model-list { padding: 4px 0; }
.yi-model-group { margin: 2px 0; }
.yi-model-group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: $text-muted;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;
  &:hover { color: $text-secondary; }
}
.yi-model-group-arrow {
  transition: transform $transition-fast;
  &.collapsed { transform: rotate(-90deg); }
}
.yi-model-group-items { padding: 0 4px; }
.yi-model-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: $text-primary;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background-color $transition-fast;
  &:hover { background: rgba(var(--accent-primary-rgb), 0.08); }
  &.active { background: rgba(var(--accent-primary-rgb), 0.12); font-weight: 500; }
  &.disabled { opacity: 0.45; cursor: not-allowed; }
}
.yi-model-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.yi-model-badge-preview {
  font-size: 10px; font-weight: 600;
  background: rgba(217, 119, 6, 0.22); color: #d97706;
  padding: 1px 5px; border-radius: 3px;
}
.yi-model-badge-custom {
  font-size: 10px; font-weight: 600;
  background: rgba(var(--accent-primary-rgb), 0.22); color: var(--accent-primary-rgb);
  padding: 1px 5px; border-radius: 3px;
}
.yi-model-check { flex-shrink: 0; color: var(--accent-primary-rgb); }
.yi-model-empty { padding: 24px; text-align: center; font-size: 13px; color: $text-muted; }
</style>
