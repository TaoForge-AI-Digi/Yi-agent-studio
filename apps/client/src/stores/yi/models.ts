import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { YiProviderConfig, YiModelConfig } from '@/types/model'
import { BUILTIN_PROVIDERS } from '@/types/model'

const STORAGE_KEY = 'yi_providers'

function loadProviders(): YiProviderConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...BUILTIN_PROVIDERS]
    const saved: YiProviderConfig[] = JSON.parse(raw)
    // Merge: keep saved data, add any new builtins
    const savedIds = new Set(saved.map(p => p.id))
    const newBuiltins = BUILTIN_PROVIDERS.filter(b => !savedIds.has(b.id))
    return [...saved, ...newBuiltins]
  } catch {
    return [...BUILTIN_PROVIDERS]
  }
}

function saveProviders(providers: YiProviderConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(providers))
}

export const useModelsStore = defineStore('models', () => {
  const providers = ref<YiProviderConfig[]>(loadProviders())
  const loading = ref(false)

  const enabledProviders = computed(() => providers.value.filter(p => p.enabled))

  function getProvider(id: string): YiProviderConfig | undefined {
    return providers.value.find(p => p.id === id)
  }

  function addProvider(config: Omit<YiProviderConfig, 'enabled'>) {
    const provider: YiProviderConfig = { ...config, enabled: true }
    providers.value.push(provider)
    saveProviders(providers.value)
  }

  function updateProvider(id: string, patch: Partial<YiProviderConfig>) {
    const idx = providers.value.findIndex(p => p.id === id)
    if (idx === -1) return
    providers.value[idx] = { ...providers.value[idx], ...patch }
    saveProviders(providers.value)
  }

  function deleteProvider(id: string) {
    const provider = providers.value.find(p => p.id === id)
    if (!provider || provider.builtin) return
    providers.value = providers.value.filter(p => p.id !== id)
    saveProviders(providers.value)
  }

  function toggleProvider(id: string) {
    const provider = providers.value.find(p => p.id === id)
    if (!provider) return
    provider.enabled = !provider.enabled
    saveProviders(providers.value)
  }

  function toggleModel(providerId: string, modelId: string) {
    const provider = providers.value.find(p => p.id === providerId)
    if (!provider) return
    const model = provider.models.find(m => m.id === modelId)
    if (!model) return
    model.visible = !model.visible
    saveProviders(providers.value)
  }

  function setApiKey(providerId: string, apiKey: string) {
    const provider = providers.value.find(p => p.id === providerId)
    if (!provider) return
    provider.apiKey = apiKey
    saveProviders(providers.value)
  }

  function getVisibleModels(): Array<{ model: YiModelConfig; provider: YiProviderConfig }> {
    const result: Array<{ model: YiModelConfig; provider: YiProviderConfig }> = []
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
    addProvider,
    updateProvider,
    deleteProvider,
    toggleProvider,
    toggleModel,
    setApiKey,
    getVisibleModels,
  }
})
