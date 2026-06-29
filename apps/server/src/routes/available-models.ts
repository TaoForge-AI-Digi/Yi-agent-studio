import { Hono } from 'hono'
import { modelStore } from '../store/models.js'

const availableModels = new Hono()

availableModels.get('/', (c) => {
  const providers = modelStore.getAll().filter(p => p.enabled)
  const groups = providers.map(p => ({
    provider: p.id,
    label: p.name,
    base_url: p.baseUrl,
    models: p.models.filter(m => m.visible).map(m => m.id),
    available_models: p.models.map(m => m.id),
    api_key: p.apiKey ? '***' : '',
    builtin: !!p.builtin,
  }))

  const defaultProvider = groups[0]?.provider || ''
  const defaultModel = groups[0]?.models[0] || ''

  return c.json({
    default: defaultModel,
    default_provider: defaultProvider,
    groups,
    allProviders: groups,
    profiles: [],
    model_aliases: {},
    model_visibility: {},
    custom_models: {},
  })
})

export default availableModels
