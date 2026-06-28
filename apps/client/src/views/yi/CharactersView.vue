<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import CharacterList from '@/components/yi/characters/CharacterList.vue'
import CharacterForm from '@/components/yi/characters/CharacterForm.vue'
import { useCharactersStore } from '@/stores/yi/characters'
import type { Agent, AgentConfig } from '@/types/agent'

const { t } = useI18n()
const charactersStore = useCharactersStore()

const showForm = ref(false)
const editingCharacter = ref<Agent | null>(null)
const showSidebar = ref(true)

let mobileQuery: MediaQueryList | null = null

function handleCreate() {
  editingCharacter.value = null
  showForm.value = true
}

function handleEdit(id: string) {
  const character = charactersStore.getCharacter(id)
  if (character) {
    editingCharacter.value = character
    showForm.value = true
  }
}

function handleSelect(id: string) {
  editingCharacter.value = charactersStore.getCharacter(id) || null
  showForm.value = true
}

async function handleSave(config: AgentConfig) {
  if (editingCharacter.value) {
    await charactersStore.updateCharacter(editingCharacter.value.id, config)
  } else {
    await charactersStore.createCharacter(config)
  }
  showForm.value = false
  editingCharacter.value = null
}

function handleCancel() {
  showForm.value = false
  editingCharacter.value = null
}

function handleMobileChange(e: MediaQueryListEvent | MediaQueryList) {
  showSidebar.value = !e.matches
}

onMounted(async () => {
  await charactersStore.loadFromServer()
  mobileQuery = window.matchMedia('(max-width: 768px)')
  handleMobileChange(mobileQuery)
  mobileQuery.addEventListener('change', handleMobileChange)
})

onUnmounted(() => {
  mobileQuery?.removeEventListener('change', handleMobileChange)
})
</script>

<template>
  <div class="characters-view">
    <div class="characters-view-list" v-show="showSidebar">
      <CharacterList
        @create="handleCreate"
        @edit="handleEdit"
        @select="handleSelect"
      />
    </div>
    <div class="characters-view-detail">
      <CharacterForm
        v-if="editingCharacter || showForm"
        :key="editingCharacter?.id || 'new'"
        :agent="editingCharacter"
        @save="handleSave"
        @cancel="handleCancel"
      />
      <div v-else class="characters-view-empty">
        {{ t('characters.selectOrCreate') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.characters-view { display: flex; height: 100%; gap: 16px; padding: 16px; }
.characters-view-list { width: 300px; flex-shrink: 0; }
.characters-view-detail { flex: 1; overflow-y: auto; min-height: 0; }
.characters-view-empty { display: flex; align-items: center; justify-content: center; height: 100%; opacity: 0.5; }
@media (max-width: 768px) {
  .characters-view { flex-direction: column; }
  .characters-view-list { width: 100%; height: 200px; }
}
</style>
