<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NPopover, NScrollbar } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useCharactersStore } from '@/stores/yi/characters'

const { t } = useI18n()
const charactersStore = useCharactersStore()

const show = ref(false)
const search = ref('')

const currentCharacter = computed(() => charactersStore.activeCharacter)

const filteredCharacters = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = charactersStore.enabledCharacters
  if (!q) return list
  return list.filter(a =>
    a.name.toLowerCase().includes(q) ||
    (a.description || '').toLowerCase().includes(q)
  )
})

function pick(id: string) {
  charactersStore.setActiveCharacter(id)
  show.value = false
  search.value = ''
}

function onOpen(v: boolean) {
  if (v) search.value = ''
}
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
      <button class="yi-character-trigger" type="button">
        <img
          v-if="currentCharacter?.avatar"
          :src="currentCharacter.avatar"
          class="yi-character-avatar"
          alt=""
        />
        <span
          v-else
          class="yi-character-avatar-placeholder"
          :style="{ background: currentCharacter?.color || '#6366f1' }"
        >{{ (currentCharacter?.name || 'A')[0] }}</span>
        <span class="yi-character-label" :title="currentCharacter?.name || 'Character'">{{ currentCharacter?.name || 'Character' }}</span>
        <svg class="yi-character-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </template>
    <div class="yi-character-pop" @click.stop>
      <div class="yi-character-pop-head">
        <NInput
          v-model:value="search"
          :placeholder="t('models.searchPlaceholder') || 'Search...'"
          clearable
          size="small"
          class="yi-character-search"
        />
      </div>
      <NScrollbar style="max-height: 360px;">
        <div class="yi-character-list">
          <div
            v-for="character in filteredCharacters"
            :key="character.id"
            class="yi-character-item"
            :class="{ active: character.id === charactersStore.activeCharacterId }"
            @click="pick(character.id)"
          >
            <img
              v-if="character.avatar"
              :src="character.avatar"
              class="yi-character-item-avatar"
              alt=""
            />
            <span
              v-else
              class="yi-character-item-avatar-placeholder"
              :style="{ background: character.color || '#6366f1' }"
            >{{ character.name[0] }}</span>
            <div class="yi-character-item-info">
              <span class="yi-character-item-name">{{ character.name }}</span>
              <span v-if="character.description" class="yi-character-item-desc">{{ character.description }}</span>
            </div>
            <svg
              v-if="character.id === charactersStore.activeCharacterId"
              class="yi-character-check"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div v-if="filteredCharacters.length === 0" class="yi-character-empty">{{ t('models.noResults') || 'No results' }}</div>
        </div>
      </NScrollbar>
    </div>
  </NPopover>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.yi-character-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
}
.yi-character-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.yi-character-avatar-placeholder {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}
.yi-character-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}
.yi-character-arrow { color: $text-muted; flex-shrink: 0; }

.yi-character-pop {
  width: 320px;
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  overflow: hidden;
  .yi-character-pop-head { padding: 8px; border-bottom: 1px solid $border-color; }
}
.yi-character-list { padding: 4px 0; }
.yi-character-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: $text-primary;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background-color $transition-fast;
  &:hover { background: rgba(var(--accent-primary-rgb), 0.08); }
  &.active { background: rgba(var(--accent-primary-rgb), 0.12); font-weight: 500; }
}
.yi-character-item-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.yi-character-item-avatar-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}
.yi-character-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.yi-character-item-name { font-size: 13px; }
.yi-character-item-desc {
  font-size: 11px;
  color: $text-muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.yi-character-check { flex-shrink: 0; color: var(--accent-primary-rgb); }
.yi-character-empty { padding: 24px; text-align: center; font-size: 13px; color: $text-muted; }
</style>
