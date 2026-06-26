<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NInput, NModal } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useModelsStore } from '@/stores/yi/models'
import type { YiProviderConfig } from '@/types/model'

const { t } = useI18n()
const modelsStore = useModelsStore()

const emit = defineEmits<{ close: []; saved: [providerId: string] }>()

interface ProviderPreset {
  id: string
  name: string
  icon: string
  baseUrl: string
}

const presets: ProviderPreset[] = [
  { id: 'deepseek', name: 'DeepSeek', icon: '🔵', baseUrl: 'https://api.deepseek.com/v1' },
  { id: 'openai', name: 'OpenAI', icon: '🟢', baseUrl: 'https://api.openai.com/v1' },
  { id: 'anthropic', name: 'Anthropic', icon: '🟤', baseUrl: 'https://api.anthropic.com' },
  { id: 'opencode-zen', name: 'OpenCode Zen', icon: '⚡', baseUrl: 'https://opencode.ai/zen/v1/' },
  { id: 'opencode-go', name: 'OpenCode Go', icon: '🚀', baseUrl: 'https://opencode.ai/zen/go/v1/' },
]

const showForm = ref(false)
const selectedPreset = ref<ProviderPreset | null>(null)
const formName = ref('')
const formUrl = ref('')
const formApiKey = ref('')

function selectPreset(preset: ProviderPreset) {
  selectedPreset.value = preset
  formName.value = preset.name
  formUrl.value = preset.baseUrl
  formApiKey.value = ''
  showForm.value = true
}

function selectCustom() {
  selectedPreset.value = null
  formName.value = ''
  formUrl.value = ''
  formApiKey.value = ''
  showForm.value = true
}

function goBack() {
  showForm.value = false
  selectedPreset.value = null
}

function handleSave() {
  if (!formName.value.trim() || !formUrl.value.trim()) return

  const id = formName.value.trim().toLowerCase().replace(/\s+/g, '-')

  // Check if already exists
  if (modelsStore.getProvider(id)) {
    // Update existing
    modelsStore.updateProvider(id, {
      name: formName.value.trim(),
      baseUrl: formUrl.value.trim(),
      apiKey: formApiKey.value.trim(),
    })
  } else {
    modelsStore.addProvider({
      id,
      name: formName.value.trim(),
      baseUrl: formUrl.value.trim(),
      apiKey: formApiKey.value.trim(),
      models: [],
      builtin: false,
    })
  }

  emit('saved', id)
}
</script>

<template>
  <n-modal :show="true" @update:show="(v: boolean) => { if (!v) emit('close') }">
    <div class="modal-content">
      <!-- Step 1: Select provider -->
      <div v-if="!showForm" class="provider-select">
        <h3>{{ t('models.addProvider') }}</h3>

        <div class="provider-section">
          <div class="section-label">{{ t('models.popular') }}</div>
          <div
            v-for="p in presets"
            :key="p.id"
            class="provider-option"
            @click="selectPreset(p)"
          >
            <span class="provider-icon">{{ p.icon }}</span>
            <span class="provider-name">{{ p.name }}</span>
            <span class="provider-add">+</span>
          </div>
        </div>

        <div class="provider-section">
          <div class="section-label">{{ t('models.other') }}</div>
          <div class="provider-option" @click="selectCustom">
            <span class="provider-icon">🔧</span>
            <span class="provider-name">{{ t('models.customProvider') }}</span>
            <span class="provider-add">+</span>
          </div>
        </div>
      </div>

      <!-- Step 2: Configure -->
      <div v-else class="provider-form">
        <div class="form-header">
          <button class="back-btn" @click="goBack">←</button>
          <h3>{{ selectedPreset?.name || t('models.customProvider') }}</h3>
        </div>

        <div class="form-body">
          <div class="form-field">
            <label>{{ t('models.name') }}</label>
            <n-input v-model:value="formName" size="small" />
          </div>
          <div class="form-field">
            <label>URL</label>
            <n-input v-model:value="formUrl" size="small" :placeholder="t('models.baseUrlPlaceholder')" />
          </div>
          <div class="form-field">
            <label>API Key</label>
            <n-input v-model:value="formApiKey" type="password" size="small" placeholder="sk-..." show-password-on="click" />
          </div>
        </div>

        <div class="form-actions">
          <n-button size="small" @click="emit('close')">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" size="small" :disabled="!formName.trim() || !formUrl.trim()" @click="handleSave">
            {{ t('common.save') }}
          </n-button>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.modal-content {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: 12px;
  width: 440px;
  max-height: 80vh;
  overflow-y: auto;
}

h3 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }

.provider-select { padding: 20px; }

.provider-section { margin-bottom: 16px; }

.section-label {
  font-size: 12px;
  color: $text-muted;
  margin-bottom: 8px;
  padding-left: 4px;
}

.provider-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.provider-option:hover { background: rgba(255, 255, 255, 0.05); }

.provider-icon { font-size: 18px; width: 24px; text-align: center; }
.provider-name { flex: 1; font-size: 14px; font-weight: 500; }

.provider-add {
  font-size: 18px;
  color: $text-muted;
  opacity: 0;
  transition: opacity 0.15s;
}

.provider-option:hover .provider-add { opacity: 1; }

.provider-form { padding: 20px; }

.form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-btn {
  background: none;
  border: none;
  color: $text-primary;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  &:hover { background: rgba(255, 255, 255, 0.05); }
}

.form-body { display: flex; flex-direction: column; gap: 12px; }

.form-field { display: flex; flex-direction: column; gap: 4px; }
.form-field label { font-size: 12px; color: $text-secondary; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid $border-color;
}
</style>
