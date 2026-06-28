<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NTag, NEmpty, NButton, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useCharactersStore } from '@/stores/yi/characters'

const { t } = useI18n()
const message = useMessage()
const charactersStore = useCharactersStore()

const searchQuery = ref('')
const selectedId = ref<string | null>(null)

const filteredCharacters = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return charactersStore.sortedCharacters.filter(a =>
    !q || a.name.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q)
  )
})

const emit = defineEmits<{
  select: [id: string]
  edit: [id: string]
  create: []
}>()

function handleSelect(id: string) {
  selectedId.value = id
  emit('select', id)
}

async function handleDelete(id: string) {
  const character = charactersStore.getCharacter(id)
  if (!character || character.builtIn) return
  if (confirm(t('characters.deleteConfirmContent', { name: character.name }))) {
    await charactersStore.deleteCharacter(id)
    message.success(t('characters.deleted'))
  }
}
</script>

<template>
  <div class="character-list">
    <div class="character-list-header">
      <n-input
        v-model:value="searchQuery"
        :placeholder="t('characters.search')"
        clearable
        size="small"
      />
      <n-button type="primary" size="small" @click="emit('create')">
        {{ t('characters.create') }}
      </n-button>
    </div>
    <div class="character-list-items">
      <n-empty v-if="filteredCharacters.length === 0" :description="t('characters.empty')" />
      <div
        v-for="character in filteredCharacters"
        :key="character.id"
        class="character-list-item"
        :class="{ selected: selectedId === character.id }"
        @click="handleSelect(character.id)"
      >
        <div class="character-list-item-avatar" :style="{ borderColor: character.color || '#6366f1' }">
          <img v-if="character.avatar" :src="character.avatar" class="avatar-img" />
          <span v-else class="avatar-text">{{ character.name?.charAt(0) || '?' }}</span>
        </div>
        <div class="character-list-item-info">
          <div class="character-list-item-name">
            {{ character.name }}
            <n-tag v-if="character.builtIn" size="tiny" type="info" :bordered="false">
              {{ t('characters.builtIn') }}
            </n-tag>
          </div>
          <div class="character-list-item-desc">{{ character.description }}</div>
        </div>
        <div class="character-list-item-actions">
          <n-button quaternary size="tiny" @click.stop="emit('edit', character.id)">&#9998;</n-button>
          <n-button v-if="!character.builtIn" quaternary size="tiny" @click.stop="handleDelete(character.id)">&#128465;</n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.character-list { display: flex; flex-direction: column; gap: 8px; height: 100%; }
.character-list-header { display: flex; gap: 8px; }
.character-list-items { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.character-list-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
.character-list-item:hover { background: rgba(255, 255, 255, 0.05); }
.character-list-item.selected { background: rgba(255, 255, 255, 0.1); }
.character-list-item-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-text { font-size: 14px; font-weight: 600; opacity: 0.6; }
.character-list-item-info { flex: 1; min-width: 0; }
.character-list-item-name { font-weight: 500; display: flex; align-items: center; gap: 6px; font-size: 13px; }
.character-list-item-desc { font-size: 12px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.character-list-item-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
.character-list-item:hover .character-list-item-actions { opacity: 1; }
</style>
