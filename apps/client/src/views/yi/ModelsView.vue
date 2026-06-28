<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NInput, NSwitch, NEmpty, NTag, NButton, NPopconfirm, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import AddProviderModal from '@/components/yi/models/AddProviderModal.vue'
import { useModelsStore } from '@/stores/yi/models'
import type { YiProviderConfig } from '@/types/model'

const { t } = useI18n()
const modelsStore = useModelsStore()
const message = useMessage()

const searchQuery = ref('')
const selectedProviderId = ref<string | null>(null)
const showAddModal = ref(false)
const editingProvider = ref<YiProviderConfig | null>(null)
const fetchingModels = ref(false)

const filteredProviders = computed(() => {
  if (!searchQuery.value) return modelsStore.providers
  const q = searchQuery.value.toLowerCase()
  return modelsStore.providers.filter(p => p.name.toLowerCase().includes(q))
})

const selectedProvider = computed(() => {
  if (!selectedProviderId.value) return null
  return modelsStore.getProvider(selectedProviderId.value) || null
})

function selectProvider(id: string) {
  selectedProviderId.value = id
  editingProvider.value = null
}

function handleAddSaved(providerId: string) {
  showAddModal.value = false
  selectedProviderId.value = providerId
}

function startEditProvider() {
  if (!selectedProvider.value) return
  editingProvider.value = { ...selectedProvider.value }
}

function cancelEdit() {
  editingProvider.value = null
}

async function saveProviderEdit() {
  if (!editingProvider.value) return
  await modelsStore.updateProvider(editingProvider.value.id, {
    name: editingProvider.value.name,
    baseUrl: editingProvider.value.baseUrl,
    apiKey: editingProvider.value.apiKey,
  })
  editingProvider.value = null
  message.success(t('common.saved'))
}

async function fetchModels() {
  if (!selectedProvider.value) return
  fetchingModels.value = true
  try {
    const p = selectedProvider.value
    const targetUrl = p.baseUrl.replace(/\/$/, '') + '/models'
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`
    const headers: Record<string, string> = {}
    if (p.apiKey) headers['Authorization'] = `Bearer ${p.apiKey}`

    const resp = await fetch(proxyUrl, { headers })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()

    const modelIds: string[] = (data.data || data.models || []).map((m: any) => m.id || m.name).filter(Boolean)
    if (modelIds.length === 0) {
      message.warning(t('models.noModelsFetched'))
      return
    }

    // Replace model list entirely, preserve visibility for existing models
    const existingVisibility = new Map(p.models.map(m => [m.id, m.visible]))
    const newModels = modelIds.map(id => ({
      id,
      name: id,
      visible: existingVisibility.get(id) ?? true,
    }))

    modelsStore.updateProvider(p.id, {
      models: newModels,
    })
    message.success(t('models.fetchedModels', { count: modelIds.length }))
  } catch (e: any) {
    message.error(e?.message || t('models.fetchFailed'))
  } finally {
    fetchingModels.value = false
  }
}

function handleDelete(id: string) {
  modelsStore.deleteProvider(id)
  if (selectedProviderId.value === id) selectedProviderId.value = null
  message.success(t('common.deleted'))
}

onMounted(() => {
  modelsStore.loadFromServer()
})
</script>

<template>
  <div class="models-view">
    <div class="models-left">
      <div class="models-left-header">
        <n-input
          v-model:value="searchQuery"
          :placeholder="t('models.search')"
          clearable
          size="small"
        />
        <n-button type="primary" size="small" @click="showAddModal = true">+</n-button>
      </div>
      <div class="models-left-items">
        <n-empty v-if="filteredProviders.length === 0" :description="t('models.noProviders')" />
        <div
          v-for="p in filteredProviders"
          :key="p.id"
          class="provider-item"
          :class="{ selected: selectedProviderId === p.id }"
          @click="selectProvider(p.id)"
        >
          <div class="provider-item-info">
            <div class="provider-item-name">{{ p.name }}</div>
            <div class="provider-item-count">{{ p.models.length }} {{ t('models.models') }}</div>
          </div>
          <n-tag v-if="p.builtin" size="tiny" type="info" :bordered="false">
            {{ t('models.builtin') }}
          </n-tag>
        </div>
      </div>
    </div>

    <div class="models-right">
      <div v-if="!selectedProvider" class="models-right-empty">
        {{ t('models.selectProvider') }}
      </div>
      <div v-else class="models-right-content">
        <!-- Provider detail -->
        <div class="provider-detail">
          <div class="provider-detail-header">
            <h3>{{ selectedProvider.name }}</h3>
            <div class="provider-detail-actions">
              <n-button v-if="!editingProvider" size="tiny" quaternary @click="startEditProvider">
                {{ t('common.edit') }}
              </n-button>
              <n-popconfirm
                v-if="!selectedProvider.builtin"
                @positive-click="handleDelete(selectedProvider!.id)"
              >
                <template #trigger>
                  <n-button size="tiny" quaternary type="error">
                    {{ t('common.delete') }}
                  </n-button>
                </template>
                {{ t('models.confirmDelete') }}
              </n-popconfirm>
            </div>
          </div>

          <!-- View mode -->
          <div v-if="!editingProvider" class="provider-info-view">
            <div class="info-row">
              <span class="info-label">URL</span>
              <span class="info-value">{{ selectedProvider.baseUrl }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">API Key</span>
              <span class="info-value">{{ selectedProvider.apiKey ? '••••••••' : '—' }}</span>
            </div>
          </div>

          <!-- Edit mode -->
          <div v-else class="provider-info-edit">
            <div class="edit-field">
              <label>{{ t('models.name') }}</label>
              <n-input v-model:value="editingProvider.name" size="small" />
            </div>
            <div class="edit-field">
              <label>URL</label>
              <n-input v-model:value="editingProvider.baseUrl" size="small" />
            </div>
            <div class="edit-field">
              <label>API Key</label>
              <n-input v-model:value="editingProvider.apiKey" type="password" size="small" show-password-on="click" />
            </div>
            <div class="edit-actions">
              <n-button size="small" @click="cancelEdit">{{ t('common.cancel') }}</n-button>
              <n-button type="primary" size="small" @click="saveProviderEdit">{{ t('common.save') }}</n-button>
            </div>
          </div>
        </div>

        <!-- Model list -->
        <div class="models-section">
          <div class="models-section-header">
            <span class="models-section-title">{{ t('models.modelList') }}</span>
            <div class="models-section-actions">
              <n-button size="tiny" :loading="fetchingModels" @click="fetchModels">
                {{ t('models.fetch') }}
              </n-button>
              <span class="models-section-count">{{ selectedProvider.models.length }}</span>
            </div>
          </div>
          <div class="models-list">
            <div v-if="selectedProvider.models.length === 0" class="models-empty">
              {{ t('models.noModels') }}
            </div>
            <div
              v-for="model in selectedProvider.models"
              :key="model.id"
              class="model-item"
            >
              <div class="model-item-info">
                <div class="model-item-name">{{ model.name }}</div>
                <div class="model-item-id">{{ model.id }}</div>
              </div>
              <n-switch
                :value="model.visible"
                size="small"
                @update:value="() => modelsStore.toggleModel(selectedProvider!.id, model.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <AddProviderModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @saved="handleAddSaved"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.models-view {
  display: flex;
  height: 100%;
  gap: 16px;
  padding: 16px;
}

/* Left panel */
.models-left {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.models-left-header {
  display: flex;
  gap: 8px;
}

.models-left-items {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.provider-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.provider-item:hover { background: rgba(255, 255, 255, 0.05); }
.provider-item.selected { background: rgba(255, 255, 255, 0.1); }

.provider-item-info { flex: 1; min-width: 0; }
.provider-item-name { font-weight: 500; font-size: 13px; }
.provider-item-count { font-size: 12px; opacity: 0.5; }

/* Right panel */
.models-right {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

.models-right-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.5;
}

.models-right-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Provider detail */
.provider-detail {
  border: 1px solid $border-color;
  border-radius: $radius-md;
  overflow: hidden;
}

.provider-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: $bg-secondary;
  border-bottom: 1px solid $border-color;
}

.provider-detail-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.provider-detail-actions {
  display: flex;
  gap: 4px;
}

.provider-info-view {
  padding: 12px 16px;
}

.info-row {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  font-size: 13px;
}

.info-label {
  width: 80px;
  color: $text-muted;
  flex-shrink: 0;
}

.info-value {
  color: $text-primary;
  font-family: $font-code;
  word-break: break-all;
}

.provider-info-edit {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.edit-field label {
  font-size: 12px;
  color: $text-secondary;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

/* Model list */
.models-section {
  border: 1px solid $border-color;
  border-radius: $radius-md;
  overflow: hidden;
}

.models-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: $bg-secondary;
  border-bottom: 1px solid $border-color;
}

.models-section-title {
  font-size: 14px;
  font-weight: 600;
}

.models-section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.models-section-count {
  font-size: 12px;
  color: $text-muted;
}

.models-list {
  max-height: 400px;
  overflow-y: auto;
}

.models-empty {
  padding: 20px;
  text-align: center;
  opacity: 0.5;
  font-size: 13px;
}

.model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  transition: background 0.15s;
}

.model-item:hover { background: rgba(255, 255, 255, 0.03); }

.model-item-info { flex: 1; min-width: 0; }
.model-item-name { font-size: 13px; font-weight: 500; }
.model-item-id { font-size: 11px; color: $text-muted; font-family: $font-code; }
</style>
