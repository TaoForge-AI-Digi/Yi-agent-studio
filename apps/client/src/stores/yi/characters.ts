import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Agent, AgentConfig } from '@/types/agent'
import {
  fetchCharacters,
  createCharacterApi,
  updateCharacterApi,
  deleteCharacterApi,
} from '@/api/yi/characters'

export const useCharactersStore = defineStore('characters', () => {
  const characters = ref<Agent[]>([])
  const activeCharacterId = ref<string>('general')

  const sortedCharacters = computed(() =>
    [...characters.value].sort((a, b) => {
      if (a.builtIn && !b.builtIn) return -1
      if (!a.builtIn && b.builtIn) return 1
      return (a.name || '').localeCompare(b.name || '')
    })
  )

  const enabledCharacters = computed(() =>
    sortedCharacters.value.filter(a => a.enabled !== false)
  )

  const activeCharacter = computed(() =>
    characters.value.find(a => a.id === activeCharacterId.value) || characters.value[0]
  )

  function getCharacter(id: string): Agent | undefined {
    return characters.value.find(a => a.id === id)
  }

  async function loadFromServer() {
    characters.value = await fetchCharacters()
  }

  async function createCharacter(config: AgentConfig): Promise<Agent> {
    const character = await createCharacterApi(config)
    characters.value.push(character)
    return character
  }

  async function updateCharacter(id: string, patch: Partial<AgentConfig>) {
    const updated = await updateCharacterApi(id, patch)
    const idx = characters.value.findIndex(a => a.id === id)
    if (idx >= 0) {
      characters.value[idx] = updated
    } else {
      characters.value.push(updated)
    }
  }

  async function deleteCharacter(id: string) {
    await deleteCharacterApi(id)
    characters.value = characters.value.filter(a => a.id !== id)
    if (activeCharacterId.value === id) activeCharacterId.value = 'general'
  }

  async function duplicateCharacter(id: string): Promise<Agent | undefined> {
    const source = getCharacter(id)
    if (!source) return
    return createCharacter({
      ...source,
      name: `${source.name} (copy)`,
      builtIn: undefined,
    })
  }

  function setActiveCharacter(id: string) {
    if (getCharacter(id)) activeCharacterId.value = id
  }

  return {
    characters,
    sortedCharacters,
    enabledCharacters,
    activeCharacter,
    activeCharacterId,
    getCharacter,
    loadFromServer,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    duplicateCharacter,
    setActiveCharacter,
  }
})
