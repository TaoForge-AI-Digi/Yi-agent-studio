<script setup lang="ts">
import { ref, watch } from 'vue'
import { NButton, NInput, NSelect, NSwitch, NSlider, NForm, NFormItem, NColorPicker } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { Agent, AgentConfig } from '@/types/agent'

const { t } = useI18n()

const props = defineProps<{ agent?: Agent | null }>()
const emit = defineEmits<{ save: [config: AgentConfig]; cancel: [] }>()

const form = ref<AgentConfig>({
  name: '',
  description: '',
  avatar: '',
  color: '#6366f1',
  soul: '',
  userProfile: '',
  memory: { enabled: false },
  memoryContent: '',
  permissions: { edit: 'ask', bash: 'ask', webfetch: 'allow' },
  maxSteps: 10,
  mode: 'all',
  enabled: true,
})

const editingSection = ref<'soul' | 'user' | 'memory' | null>(null)
const editContent = ref('')

watch(() => props.agent, (a) => {
  if (a) {
    form.value = {
      name: a.name, description: a.description, avatar: a.avatar || '', color: a.color,
      soul: a.soul || '', userProfile: a.userProfile || '',
      memory: a.memory ? { ...a.memory } : { enabled: false }, memoryContent: a.memoryContent || '',
      model: a.model, provider: a.provider, tools: a.tools ? { ...a.tools } : undefined,
      permissions: a.permissions ? { ...a.permissions } : { edit: 'ask', bash: 'ask', webfetch: 'allow' },
      maxSteps: a.maxSteps ?? 10, mode: a.mode, enabled: a.enabled,
    }
  }
}, { immediate: true })

const permissionOptions = [
  { label: 'Ask', value: 'ask' },
  { label: 'Allow', value: 'allow' },
  { label: 'Deny', value: 'deny' },
]

const modeOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Subagent', value: 'subagent' },
  { label: 'All', value: 'all' },
]

function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => { form.value.avatar = e.target?.result as string }
  reader.readAsDataURL(file)
  input.value = ''
}

function removeAvatar() { form.value.avatar = '' }

function startEdit(section: 'soul' | 'user' | 'memory') {
  editingSection.value = section
  if (section === 'soul') editContent.value = form.value.soul || ''
  else if (section === 'user') editContent.value = form.value.userProfile || ''
  else editContent.value = form.value.memoryContent || ''
}

function cancelEdit() { editingSection.value = null; editContent.value = '' }

function saveEdit() {
  if (!editingSection.value) return
  if (editingSection.value === 'soul') form.value.soul = editContent.value
  else if (editingSection.value === 'user') form.value.userProfile = editContent.value
  else form.value.memoryContent = editContent.value
  editingSection.value = null
  editContent.value = ''
}

function handleSave() {
  if (!form.value.name.trim()) return
  emit('save', { ...form.value })
}
</script>

<template>
  <div class="character-form">
    <div class="character-form-top">
      <div class="character-form-left">
        <div class="avatar-preview" :style="{ borderColor: form.color || '#6366f1' }">
          <img v-if="form.avatar" :src="form.avatar" class="avatar-img" />
          <span v-else class="avatar-placeholder">{{ form.name?.charAt(0) || '?' }}</span>
        </div>
        <n-color-picker v-model:value="form.color" :show-alpha="false" size="small" style="width: 100%" />
        <div class="avatar-actions">
          <label class="avatar-upload-btn">
            <input type="file" accept="image/*" hidden @change="handleAvatarUpload" />
            {{ t('characters.form.uploadAvatar') }}
          </label>
          <button v-if="form.avatar" class="avatar-remove-btn" @click="removeAvatar">
            {{ t('characters.form.removeAvatar') }}
          </button>
        </div>
      </div>
      <div class="character-form-right">
        <n-form-item :label="t('characters.form.name')" label-placement="top" size="small">
          <n-input v-model:value="form.name" :placeholder="t('characters.form.namePlaceholder')" />
        </n-form-item>
        <n-form-item :label="t('characters.form.description')" label-placement="top" size="small">
          <n-input v-model:value="form.description" type="textarea" :rows="2" />
        </n-form-item>
        <div class="character-form-row">
          <n-form-item :label="t('characters.form.mode')" label-placement="top" size="small" class="flex-1">
            <n-select v-model:value="form.mode" :options="modeOptions" />
          </n-form-item>
          <n-form-item :label="t('characters.form.maxSteps')" label-placement="top" size="small" class="flex-1">
            <n-slider v-model:value="form.maxSteps" :min="1" :max="50" :step="1" />
          </n-form-item>
        </div>
        <n-form-item :label="t('characters.form.enabled')" label-placement="top" size="small">
          <n-switch v-model:value="form.enabled!" />
        </n-form-item>
      </div>
    </div>

    <div class="character-form-sections">
      <!-- Soul -->
      <div class="memory-section">
        <div class="section-header">
          <div class="section-title-row">
            <span class="section-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span class="section-title">{{ t('characters.form.tabs.soul') }}</span>
          </div>
          <NButton v-if="editingSection !== 'soul'" size="tiny" quaternary @click="startEdit('soul')">
            <template #icon>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </template>
            {{ t('common.edit') }}
          </NButton>
        </div>
        <div v-if="editingSection !== 'soul'" class="section-body">
          <p v-if="!form.soul" class="empty-text">{{ t('characters.form.soulPlaceholder') }}</p>
          <div v-else class="content-text">{{ form.soul }}</div>
        </div>
        <div v-else class="section-edit">
          <textarea v-model="editContent" class="edit-textarea" :placeholder="t('characters.form.soulPlaceholder')" spellcheck="false" />
          <div class="edit-actions">
            <NButton size="small" @click="cancelEdit">{{ t('common.cancel') }}</NButton>
            <NButton size="small" type="primary" @click="saveEdit">{{ t('common.save') }}</NButton>
          </div>
        </div>
      </div>

      <!-- User Profile -->
      <div class="memory-section">
        <div class="section-header">
          <div class="section-title-row">
            <span class="section-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span class="section-title">{{ t('characters.form.tabs.user') }}</span>
          </div>
          <NButton v-if="editingSection !== 'user'" size="tiny" quaternary @click="startEdit('user')">
            <template #icon>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </template>
            {{ t('common.edit') }}
          </NButton>
        </div>
        <div v-if="editingSection !== 'user'" class="section-body">
          <p v-if="!form.userProfile" class="empty-text">{{ t('characters.form.userProfilePlaceholder') }}</p>
          <div v-else class="content-text">{{ form.userProfile }}</div>
        </div>
        <div v-else class="section-edit">
          <textarea v-model="editContent" class="edit-textarea" :placeholder="t('characters.form.userProfilePlaceholder')" spellcheck="false" />
          <div class="edit-actions">
            <NButton size="small" @click="cancelEdit">{{ t('common.cancel') }}</NButton>
            <NButton size="small" type="primary" @click="saveEdit">{{ t('common.save') }}</NButton>
          </div>
        </div>
      </div>

      <!-- Memory -->
      <div class="memory-section">
        <div class="section-header">
          <div class="section-title-row">
            <span class="section-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </span>
            <span class="section-title">{{ t('characters.form.tabs.memory') }}</span>
          </div>
          <div class="section-header-right">
            <n-switch v-model:value="form.memory!.enabled" size="small" />
            <NButton v-if="editingSection !== 'memory'" size="tiny" quaternary @click="startEdit('memory')">
              <template #icon>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </template>
              {{ t('common.edit') }}
            </NButton>
          </div>
        </div>
        <div v-if="editingSection !== 'memory'" class="section-body">
          <p v-if="!form.memory?.enabled" class="empty-text">{{ t('characters.form.memoryDisabledHint') }}</p>
          <p v-else-if="!form.memoryContent" class="empty-text">{{ t('characters.form.memoryPlaceholder') }}</p>
          <div v-else class="content-text">{{ form.memoryContent }}</div>
        </div>
        <div v-else class="section-edit">
          <textarea v-model="editContent" class="edit-textarea" :placeholder="t('characters.form.memoryPlaceholder')" spellcheck="false" />
          <div class="edit-actions">
            <NButton size="small" @click="cancelEdit">{{ t('common.cancel') }}</NButton>
            <NButton size="small" type="primary" @click="saveEdit">{{ t('common.save') }}</NButton>
          </div>
        </div>
      </div>
    </div>

    <div class="character-form-actions">
      <n-button @click="emit('cancel')">{{ t('common.cancel') }}</n-button>
      <n-button type="primary" @click="handleSave">{{ t('common.save') }}</n-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.character-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.character-form-top {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.character-form-left {
  width: 120px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-secondary;
}

.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { font-size: 28px; font-weight: 600; color: $text-muted; }

.avatar-actions { display: flex; gap: 8px; font-size: 12px; }
.avatar-upload-btn { color: $accent-primary; cursor: pointer; text-decoration: underline; }
.avatar-remove-btn { background: none; border: none; color: #ef4444; cursor: pointer; text-decoration: underline; font-size: 12px; }

.character-form-right { flex: 1; min-width: 0; }
.character-form-row { display: flex; gap: 16px; }
.flex-1 { flex: 1; }

.character-form-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memory-section {
  border: 1px solid $border-color;
  border-radius: $radius-md;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: $bg-secondary;
  border-bottom: 1px solid $border-color;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: $text-secondary;
  display: flex;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.section-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-body {
  padding: 16px;
  min-height: 40px;
}

.content-text {
  font-size: 13px;
  line-height: 1.6;
  color: $text-primary;
  white-space: pre-wrap;
  word-break: break-word;
}

.empty-text {
  color: $text-muted;
  font-style: italic;
  font-size: 13px;
  margin: 0;
}

.section-edit {
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}

.edit-textarea {
  width: 100%;
  height: 200px;
  padding: 12px;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-input;
  color: $text-primary;
  font-family: $font-code;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: $accent-primary;
  }
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.character-form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid $border-color;
}
</style>
