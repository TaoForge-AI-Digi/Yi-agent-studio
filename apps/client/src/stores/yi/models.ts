import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { YiProviderConfig } from '@/types/model'
import {
  fetchProviders,
  createProviderApi,
  updateProviderApi,
  deleteProviderApi,
} from '@/api/yi/models'

export const useModelsStore = defineStore('models', () => {
  const providers = ref<YiProviderConfig[]>([])
  const loading = ref(false)

  const enabledProviders = computed(() => providers.value.filter(p => p.enabled))

  function getProvider(id: string): YiProviderConfig | undefined {
    return providers.value.find(p => p.id === id)
  }

  async function loadFromServer() {
    loading.value = true
    try {
      providers.value = await fetchProviders()
    } finally {
      loading.value = false
    }
  }

  async function addProvider(config: Omit<YiProviderConfig, 'enabled'>): Promise<YiProviderConfig> {
    const provider = await createProviderApi(config)
    providers.value.push(provider)
    return provider
  }

  async function updateProvider(id: string, patch: Partial<YiProviderConfig>) {
    const updated = await updateProviderApi(id, patch)
    const idx = providers.value.findIndex(p => p.id === id)
    if (idx >= 0) {
      providers.value[idx] = updated
    } else {
      providers.value.push(updated)
    }
  }

  async function deleteProvider(id: string) {
    await deleteProviderApi(id)
    providers.value = providers.value.filter(p => p.id !== id)
  }

  async function toggleProvider(id: string) {
    const provider = providers.value.find(p => p.id === id)
    if (!provider) return
    await updateProvider(id, { enabled: !provider.enabled })
  }

  async function toggleModel(providerId: string, modelId: string) {
    const provider = providers.value.find(p => p.id === providerId)
    if (!provider) return
    const model = provider.models.find(m => m.id === modelId)
    if (!model) return
    const newModels = provider.models.map(m =>
      m.id === modelId ? { ...m, visible: !m.visible } : m
    )
    await updateProvider(providerId, { models: newModels })
  }

  async function setApiKey(providerId: string, apiKey: string) {
    await updateProvider(providerId, { apiKey })
  }

  function getVisibleModels(): Array<{ model: YiProviderConfig['models'][number]; provider: YiProviderConfig }> {
    const result: Array<{ model: YiProviderConfig['models'][number]; provider: YiProviderConfig }> = []
    for (const p of providers.value) {
      if (!p.enabled) continue
      for (const m of p.models) {
        if (m.visible) result.push({ model: m, provider: p })
      }
    }
    return result
  }

  return {
    providers,
    loading,
    enabledProviders,
    getProvider,
    loadFromServer,
    addProvider,
    updateProvider,
    deleteProvider,
    toggleProvider,
    toggleModel,
    setApiKey,
    getVisibleModels,
  }
})
