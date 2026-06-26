# Agent-Session-Provider-MessageParts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete agent framework for Yi-agent-studio: Agent/Role system with soul+memory, opencode-style Session management (fork/queue/revert), Provider system with AI SDK integration, and composable Message Parts model.

**Architecture:** Frontend-only implementation (Phase 1). All types defined as TypeScript interfaces. Stores use Pinia. UI uses Naive UI. Backend API stubs return mock data. The existing `chat.ts` store (~1800 lines) will be refactored to use the new types while preserving Socket.IO streaming logic.

**Tech Stack:** Vue 3.5, Pinia 3, TypeScript 5.8, Naive UI 2, vue-router 4, vue-i18n 11, Socket.IO client

## Global Constraints

- Vue 3 Composition API with `<script setup lang="ts">`
- Pinia stores in `src/stores/hermes/`
- API modules in `src/api/hermes/`
- Components in `src/components/hermes/`
- Views in `src/views/hermes/`
- Types in `src/types/`
- i18n keys prefixed with `agents.`, `sessions.`, `providers.`, `messages.`
- All new files follow existing code style (no comments unless asked)
- YAGNI: No backend implementation, only type definitions + mock API stubs

---

## Phase 1: Type Definitions

### Task 1: Agent Types

**Files:**
- Create: `src/types/agent.ts`

**Interfaces:**
- Produces: `Agent`, `AgentConfig`, `AgentMemory`, `AgentPermission`, `BUILTIN_AGENTS`

- [ ] **Step 1: Create agent type definitions**

```typescript
// src/types/agent.ts

export interface AgentPermission {
  edit?: 'ask' | 'allow' | 'deny'
  bash?: 'ask' | 'allow' | 'deny'
  webfetch?: 'ask' | 'allow' | 'deny'
}

export interface AgentMemory {
  enabled: boolean
  maxEntries?: number
}

export interface Agent {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  soul?: string
  memory?: AgentMemory
  model?: string
  provider?: string
  tools?: Record<string, boolean>
  permissions?: AgentPermission
  maxSteps?: number
  mode?: 'primary' | 'subagent' | 'all'
  enabled?: boolean
  builtIn?: boolean
  createdAt?: number
  updatedAt?: number
}

export type AgentConfig = Omit<Agent, 'id' | 'builtIn' | 'createdAt' | 'updatedAt'>

export const BUILTIN_AGENTS: Agent[] = [
  {
    id: 'general',
    name: 'General',
    description: 'General-purpose assistant for everyday tasks',
    icon: '🤖',
    color: '#6366f1',
    soul: 'You are a helpful, harmless, and honest assistant.',
    mode: 'all',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'coder',
    name: 'Coder',
    description: 'Expert programmer for writing, debugging, and refactoring code',
    icon: '💻',
    color: '#10b981',
    soul: 'You are an expert programmer. Write clean, well-tested code. Follow language idioms and best practices.',
    permissions: { edit: 'allow', bash: 'ask', webfetch: 'allow' },
    mode: 'all',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    description: 'Code reviewer focused on security, performance, and best practices',
    icon: '🔍',
    color: '#f59e0b',
    soul: 'You are a senior code reviewer. Focus on security vulnerabilities, performance issues, and adherence to best practices.',
    permissions: { edit: 'deny', bash: 'deny', webfetch: 'allow' },
    mode: 'all',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Read-only codebase explorer for understanding architecture',
    icon: '🧭',
    color: '#8b5cf6',
    soul: 'You are a codebase explorer. Help users understand code architecture without modifying anything.',
    permissions: { edit: 'deny', bash: 'deny', webfetch: 'allow' },
    tools: { read: true, grep: true, glob: true, edit: false, write: false, bash: false },
    mode: 'all',
    enabled: true,
    builtIn: true,
  },
]
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS (no errors in agent.ts)

- [ ] **Step 3: Commit**

```bash
git add src/types/agent.ts
git commit -m "feat: add Agent type definitions with built-in agents"
```

---

### Task 2: Message Parts Types

**Files:**
- Create: `src/types/message.ts`

**Interfaces:**
- Produces: `Part` union type, `TextPart`, `ReasoningPart`, `ToolPart`, `StepStartPart`, `StepFinishPart`, `FilePart`, `AgentPart`, `ToolState`, `Message`

- [ ] **Step 1: Create message part type definitions**

```typescript
// src/types/message.ts

export type ToolState = 'pending' | 'running' | 'completed' | 'error'

export interface TextPart {
  type: 'text'
  text: string
}

export interface ReasoningPart {
  type: 'reasoning'
  text: string
}

export interface ToolPart {
  type: 'tool'
  name: string
  args: Record<string, unknown>
  state: ToolState
  result?: string
  error?: string
  callId: string
  startedAt?: number
  completedAt?: number
}

export interface StepStartPart {
  type: 'step-start'
  step: number
  agentId?: string
}

export interface StepFinishPart {
  type: 'step-finish'
  step: number
  cost?: number
  tokens?: { input: number; output: number; reasoning: number }
}

export interface FilePart {
  type: 'file'
  path: string
  content?: string
  diff?: string
  operation?: 'read' | 'create' | 'update' | 'delete'
}

export interface AgentPart {
  type: 'agent'
  agentId: string
  description?: string
}

export type Part =
  | TextPart
  | ReasoningPart
  | ToolPart
  | StepStartPart
  | StepFinishPart
  | FilePart
  | AgentPart

export interface Message {
  id: string
  sessionID: string
  role: 'user' | 'assistant'
  parts: Part[]
  time: {
    created: number
    completed?: number
  }
  agentId?: string
  model?: { providerID: string; modelID: string }
  tokens?: { input: number; output: number; reasoning: number; cache: { read: number; write: number } }
  cost?: number
  error?: { type: string; message: string }
  parentID?: string
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/types/message.ts
git commit -m "feat: add Message Part type definitions (opencode-style)"
```

---

### Task 3: Session Types

**Files:**
- Create: `src/types/session.ts`

**Interfaces:**
- Consumes: `Message` from `src/types/message.ts`
- Produces: `Session`, `SessionStatus`, `SessionSummary`, `SessionFork`

- [ ] **Step 1: Create session type definitions**

```typescript
// src/types/session.ts
import type { Message } from './message'

export type SessionStatusType = 'idle' | 'busy' | 'retry'

export interface SessionStatus {
  type: SessionStatusType
  attempt?: number
  message?: string
  next?: number
}

export interface SessionSummary {
  title?: string
  body?: string
  additions?: number
  deletions?: number
  files?: string[]
}

export interface SessionFork {
  parentID: string
  forkPointMessageID: string
  parentTitle?: string
}

export interface Session {
  id: string
  title: string
  agentId: string
  parentID?: string
  forkPointMessageID?: string
  version: number
  summary?: SessionSummary
  messages: Message[]
  status: SessionStatus
  time: { created: number; updated: number }
  model?: string
  provider?: string
  queueLength: number
  queuedMessages: Message[]
  revert?: { messageID: string; snapshot?: string }
  inputTokens?: number
  outputTokens?: number
  contextTokens?: number
}

export interface SessionCreateOptions {
  agentId?: string
  model?: string
  provider?: string
  parentID?: string
  forkPointMessageID?: string
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/types/session.ts
git commit -m "feat: add Session type definitions with fork/revert support"
```

---

### Task 4: Provider Types

**Files:**
- Create: `src/types/provider.ts`

**Interfaces:**
- Produces: `ProviderConfig`, `ModelConfig`, `Provider`, `Model`, `ProviderSource`

- [ ] **Step 1: Create provider type definitions**

```typescript
// src/types/provider.ts

export type ProviderSource = 'env' | 'config' | 'custom' | 'api'

export interface ModelConfig {
  id?: string
  name?: string
  attachment?: boolean
  reasoning?: boolean
  temperature?: boolean
  toolCall?: boolean
  cost?: { input: number; output: number; cacheRead: number; cacheWrite: number }
  limit?: { context: number; output: number }
  status?: 'alpha' | 'beta' | 'deprecated' | 'active'
}

export interface ProviderConfig {
  id: string
  name: string
  env?: string[]
  npm?: string
  models: Record<string, ModelConfig>
  options?: {
    apiKey?: string
    baseURL?: string
    timeout?: number | false
  }
}

export interface Model {
  id: string
  name: string
  providerID: string
  attachment?: boolean
  reasoning?: boolean
  temperature?: boolean
  toolCall?: boolean
  cost?: { input: number; output: number; cacheRead: number; cacheWrite: number }
  limit?: { context: number; output: number }
  status?: 'alpha' | 'beta' | 'deprecated' | 'active'
}

export interface Provider {
  id: string
  name: string
  source: ProviderSource
  env: string[]
  key?: string
  options: Record<string, unknown>
  models: Record<string, Model>
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/types/provider.ts
git commit -m "feat: add Provider type definitions (opencode-style)"
```

---

### Task 5: Update Message Type Index

**Files:**
- Create: `src/types/index.ts`

**Interfaces:**
- Consumes: all type files above
- Produces: barrel exports

- [ ] **Step 1: Create barrel export**

```typescript
// src/types/index.ts
export type { Agent, AgentConfig, AgentMemory, AgentPermission } from './agent'
export { BUILTIN_AGENTS } from './agent'
export type { Part, TextPart, ReasoningPart, ToolPart, StepStartPart, StepFinishPart, FilePart, AgentPart, ToolState, Message } from './message'
export type { Session, SessionStatus, SessionSummary, SessionFork, SessionCreateOptions, SessionStatusType } from './session'
export type { Provider, ProviderConfig, Model, ModelConfig, ProviderSource } from './provider'
```

- [ ] **Step 2: Verify barrel exports work**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add types barrel export"
```

---

## Phase 2: Agent Store + Management UI

### Task 6: Agent Store

**Files:**
- Create: `src/stores/hermes/agents.ts`

**Interfaces:**
- Consumes: `Agent`, `AgentConfig`, `BUILTIN_AGENTS` from `src/types/agent.ts`
- Produces: `useAgentsStore` with agents, CRUD, activeAgentId

- [ ] **Step 1: Create agents store**

```typescript
// src/stores/hermes/agents.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuid } from 'vue-uuid'
import type { Agent, AgentConfig } from '@/types/agent'
import { BUILTIN_AGENTS } from '@/types/agent'

const STORAGE_KEY = 'yi_agents'

function loadAgents(): Agent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...BUILTIN_AGENTS]
    const custom: Agent[] = JSON.parse(raw)
    return [...BUILTIN_AGENTS, ...custom]
  } catch {
    return [...BUILTIN_AGENTS]
  }
}

function saveCustomAgents(agents: Agent[]) {
  const custom = agents.filter(a => !a.builtIn)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
}

export const useAgentsStore = defineStore('agents', () => {
  const agents = ref<Agent[]>(loadAgents())
  const activeAgentId = ref<string>('general')

  const sortedAgents = computed(() =>
    [...agents.value].sort((a, b) => {
      if (a.builtIn && !b.builtIn) return -1
      if (!a.builtIn && b.builtIn) return 1
      return (a.name || '').localeCompare(b.name || '')
    })
  )

  const enabledAgents = computed(() =>
    sortedAgents.value.filter(a => a.enabled !== false)
  )

  const activeAgent = computed(() =>
    agents.value.find(a => a.id === activeAgentId.value) || agents.value[0]
  )

  function getAgent(id: string): Agent | undefined {
    return agents.value.find(a => a.id === id)
  }

  function createAgent(config: AgentConfig): Agent {
    const agent: Agent = {
      ...config,
      id: uuid(),
      builtIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    agents.value.push(agent)
    saveCustomAgents(agents.value)
    return agent
  }

  function updateAgent(id: string, patch: Partial<AgentConfig>) {
    const idx = agents.value.findIndex(a => a.id === id)
    if (idx === -1) return
    agents.value[idx] = { ...agents.value[idx], ...patch, updatedAt: Date.now() }
    saveCustomAgents(agents.value)
  }

  function deleteAgent(id: string) {
    const agent = agents.value.find(a => a.id === id)
    if (!agent || agent.builtIn) return
    agents.value = agents.value.filter(a => a.id !== id)
    if (activeAgentId.value === id) activeAgentId.value = 'general'
    saveCustomAgents(agents.value)
  }

  function duplicateAgent(id: string): Agent | undefined {
    const source = getAgent(id)
    if (!source) return
    return createAgent({
      ...source,
      name: `${source.name} (copy)`,
      builtIn: undefined,
    })
  }

  function setActiveAgent(id: string) {
    if (getAgent(id)) activeAgentId.value = id
  }

  return {
    agents,
    sortedAgents,
    enabledAgents,
    activeAgent,
    activeAgentId,
    getAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    duplicateAgent,
    setActiveAgent,
  }
})
```

- [ ] **Step 2: Verify store compiles**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/stores/hermes/agents.ts
git commit -m "feat: add agents store with CRUD and localStorage persistence"
```

---

### Task 7: Agent List Component

**Files:**
- Create: `src/components/hermes/agents/AgentList.vue`

**Interfaces:**
- Consumes: `useAgentsStore` from Task 6
- Produces: Agent list UI with select, search, enable/disable toggle

- [ ] **Step 1: Create AgentList component**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NInput, NSwitch, NTag, NEmpty } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useAgentsStore } from '@/stores/hermes/agents'

const { t } = useI18n()
const agentsStore = useAgentsStore()

const searchQuery = ref('')
const selectedId = ref<string | null>(null)

const filteredAgents = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return agentsStore.sortedAgents.filter(a =>
    !q || a.name.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q)
  )
})

const emit = defineEmits<{
  select: [id: string]
  edit: [id: string]
  delete: [id: string]
  create: []
}>()

function handleSelect(id: string) {
  selectedId.value = id
  emit('select', id)
}
</script>

<template>
  <div class="agent-list">
    <div class="agent-list-header">
      <n-input
        v-model:value="searchQuery"
        :placeholder="t('agents.search')"
        clearable
        size="small"
      />
      <n-button type="primary" size="small" @click="emit('create')">
        {{ t('agents.create') }}
      </n-button>
    </div>
    <div class="agent-list-items">
      <n-empty v-if="filteredAgents.length === 0" :description="t('agents.empty')" />
      <div
        v-for="agent in filteredAgents"
        :key="agent.id"
        class="agent-list-item"
        :class="{ selected: selectedId === agent.id }"
        @click="handleSelect(agent.id)"
      >
        <div class="agent-list-item-icon" :style="{ color: agent.color }">
          {{ agent.icon || '🤖' }}
        </div>
        <div class="agent-list-item-info">
          <div class="agent-list-item-name">
            {{ agent.name }}
            <n-tag v-if="agent.builtIn" size="tiny" type="info">
              {{ t('agents.builtIn') }}
            </n-tag>
          </div>
          <div class="agent-list-item-desc">{{ agent.description }}</div>
        </div>
        <n-switch
          :value="agent.enabled !== false"
          size="small"
          @update:value="(v: boolean) => agentsStore.updateAgent(agent.id, { enabled: v })"
          @click.stop
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-list { display: flex; flex-direction: column; gap: 8px; height: 100%; }
.agent-list-header { display: flex; gap: 8px; }
.agent-list-items { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.agent-list-item {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 12px; border-radius: 6px; cursor: pointer;
  transition: background 0.15s;
}
.agent-list-item:hover { background: var(--n-color-hover, rgba(255,255,255,0.05)); }
.agent-list-item.selected { background: var(--n-color-pressed, rgba(255,255,255,0.1)); }
.agent-list-item-icon { font-size: 20px; flex-shrink: 0; }
.agent-list-item-info { flex: 1; min-width: 0; }
.agent-list-item-name { font-weight: 500; display: flex; align-items: center; gap: 6px; }
.agent-list-item-desc { font-size: 12px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
```

- [ ] **Step 2: Verify component compiles**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/hermes/agents/AgentList.vue
git commit -m "feat: add AgentList component with search and enable/disable"
```

---

### Task 8: Agent Form Component

**Files:**
- Create: `src/components/hermes/agents/AgentForm.vue`

**Interfaces:**
- Consumes: `Agent`, `AgentConfig` from types, `useAgentsStore` from Task 6
- Produces: Agent create/edit form with all fields

- [ ] **Step 1: Create AgentForm component**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { NButton, NInput, NSelect, NSwitch, NSlider, NForm, NFormItem, NColorPicker } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { Agent, AgentConfig } from '@/types/agent'
import { useAgentsStore } from '@/stores/hermes/agents'

const { t } = useI18n()
const agentsStore = useAgentsStore()

const props = defineProps<{ agent?: Agent | null }>()
const emit = defineEmits<{ save: [config: AgentConfig]; cancel: [] }>()

const form = ref<AgentConfig>({
  name: '',
  description: '',
  icon: '🤖',
  color: '#6366f1',
  soul: '',
  memory: { enabled: false },
  permissions: { edit: 'ask', bash: 'ask', webfetch: 'allow' },
  mode: 'all',
  enabled: true,
})

watch(() => props.agent, (a) => {
  if (a) {
    form.value = {
      name: a.name,
      description: a.description,
      icon: a.icon,
      color: a.color,
      soul: a.soul,
      memory: a.memory ? { ...a.memory } : { enabled: false },
      model: a.model,
      provider: a.provider,
      tools: a.tools ? { ...a.tools } : undefined,
      permissions: a.permissions ? { ...a.permissions } : { edit: 'ask', bash: 'ask', webfetch: 'allow' },
      maxSteps: a.maxSteps,
      mode: a.mode,
      enabled: a.enabled,
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

function handleSave() {
  if (!form.value.name.trim()) return
  emit('save', { ...form.value })
}
</script>

<template>
  <n-form label-placement="left" label-width="120px" class="agent-form">
    <n-form-item :label="t('agents.form.name')">
      <n-input v-model:value="form.name" :placeholder="t('agents.form.namePlaceholder')" />
    </n-form-item>
    <n-form-item :label="t('agents.form.description')">
      <n-input v-model:value="form.description" type="textarea" :rows="2" />
    </n-form-item>
    <n-form-item :label="t('agents.form.icon')">
      <n-input v-model:value="form.icon" style="width: 80px" />
    </n-form-item>
    <n-form-item :label="t('agents.form.color')">
      <n-color-picker v-model:value="form.color" :show-alpha="false" style="width: 120px" />
    </n-form-item>
    <n-form-item :label="t('agents.form.soul')">
      <n-input v-model:value="form.soul" type="textarea" :rows="6" :placeholder="t('agents.form.soulPlaceholder')" />
    </n-form-item>
    <n-form-item :label="t('agents.form.mode')">
      <n-select v-model:value="form.mode" :options="modeOptions" />
    </n-form-item>
    <n-form-item :label="t('agents.form.maxSteps')">
      <n-slider v-model:value="form.maxSteps" :min="1" :max="50" :step="1" />
    </n-form-item>
    <n-form-item :label="t('agents.form.permissions')">
      <div class="permission-grid">
        <div v-for="perm in ['edit', 'bash', 'webfetch']" :key="perm" class="permission-row">
          <span>{{ perm }}</span>
          <n-select
            :value="form.permissions?.[perm as keyof typeof form.permissions] || 'ask'"
            :options="permissionOptions"
            size="small"
            style="width: 100px"
            @update:value="(v) => { if (!form.permissions) form.permissions = {}; form.permissions[perm as keyof typeof form.permissions] = v as any }"
          />
        </div>
      </div>
    </n-form-item>
    <n-form-item :label="t('agents.form.memory')">
      <n-switch v-model:value="form.memory!.enabled" />
    </n-form-item>
    <n-form-item :label="t('agents.form.enabled')">
      <n-switch v-model:value="form.enabled!" />
    </n-form-item>
    <div class="agent-form-actions">
      <n-button @click="emit('cancel')">{{ t('common.cancel') }}</n-button>
      <n-button type="primary" @click="handleSave">{{ t('common.save') }}</n-button>
    </div>
  </n-form>
</template>

<style scoped>
.agent-form { max-width: 600px; }
.permission-grid { display: flex; flex-direction: column; gap: 8px; }
.permission-row { display: flex; align-items: center; gap: 12px; }
.agent-form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
</style>
```

- [ ] **Step 2: Verify component compiles**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/hermes/agents/AgentForm.vue
git commit -m "feat: add AgentForm component for create/edit"
```

---

### Task 9: Agent Selector (Chat Input Integration)

**Files:**
- Create: `src/components/hermes/agents/AgentSelector.vue`

**Interfaces:**
- Consumes: `useAgentsStore` from Task 6
- Produces: Dropdown agent selector for chat input

- [ ] **Step 1: Create AgentSelector component**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { NPopover, NButton, NList, NListItem } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useAgentsStore } from '@/stores/hermes/agents'

const { t } = useI18n()
const agentsStore = useAgentsStore()

const currentAgent = computed(() => agentsStore.activeAgent)

function selectAgent(id: string) {
  agentsStore.setActiveAgent(id)
}
</script>

<template>
  <n-popover trigger="click" placement="bottom-start" :width="280">
    <template #trigger>
      <n-button quaternary size="small" class="agent-selector-trigger">
        <span class="agent-dot" :style="{ background: currentAgent?.color }"></span>
        {{ currentAgent?.name || 'Agent' }}
      </n-button>
    </template>
    <n-list :show-divider="false" hoverable clickable>
      <n-list-item
        v-for="agent in agentsStore.enabledAgents"
        :key="agent.id"
        :class="{ active: agent.id === agentsStore.activeAgentId }"
        @click="selectAgent(agent.id)"
      >
        <div class="agent-option">
          <span class="agent-dot" :style="{ background: agent.color }"></span>
          <div>
            <div class="agent-option-name">{{ agent.name }}</div>
            <div class="agent-option-desc">{{ agent.description }}</div>
          </div>
        </div>
      </n-list-item>
    </n-list>
  </n-popover>
</template>

<style scoped>
.agent-selector-trigger { display: flex; align-items: center; gap: 6px; }
.agent-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.agent-option { display: flex; align-items: center; gap: 10px; }
.agent-option-name { font-weight: 500; font-size: 13px; }
.agent-option-desc { font-size: 11px; opacity: 0.6; }
</style>
```

- [ ] **Step 2: Verify component compiles**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/hermes/agents/AgentSelector.vue
git commit -m "feat: add AgentSelector dropdown for chat input"
```

---

### Task 10: Agents Management View

**Files:**
- Create: `src/views/hermes/AgentsView.vue`

**Interfaces:**
- Consumes: `AgentList`, `AgentForm`, `useAgentsStore`
- Produces: Full-page agent management view

- [ ] **Step 1: Create AgentsView**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { NDrawer, NDrawerContent, NButton, NPopconfirm } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import AgentList from '@/components/hermes/agents/AgentList.vue'
import AgentForm from '@/components/hermes/agents/AgentForm.vue'
import { useAgentsStore } from '@/stores/hermes/agents'
import type { Agent, AgentConfig } from '@/types/agent'

const { t } = useI18n()
const agentsStore = useAgentsStore()

const showForm = ref(false)
const editingAgent = ref<Agent | null>(null)
const showSidebar = ref(true)

let mobileQuery: MediaQueryList | null = null

function handleCreate() {
  editingAgent.value = null
  showForm.value = true
}

function handleEdit(id: string) {
  const agent = agentsStore.getAgent(id)
  if (agent) {
    editingAgent.value = agent
    showForm.value = true
  }
}

function handleDelete(id: string) {
  agentsStore.deleteAgent(id)
}

function handleSave(config: AgentConfig) {
  if (editingAgent.value) {
    agentsStore.updateAgent(editingAgent.value.id, config)
  } else {
    agentsStore.createAgent(config)
  }
  showForm.value = false
  editingAgent.value = null
}

function handleDuplicate(id: string) {
  agentsStore.duplicateAgent(id)
}

function handleMobileChange(e: MediaQueryListEvent | MediaQueryList) {
  showSidebar.value = !e.matches
}

function onMounted() {
  mobileQuery = window.matchMedia('(max-width: 768px)')
  handleMobileChange(mobileQuery)
  mobileQuery.addEventListener('change', handleMobileChange)
}

function onUnmounted() {
  mobileQuery?.removeEventListener('change', handleMobileChange)
}
</script>

<template>
  <div class="agents-view" @mounted="onMounted" @unmounted="onUnmounted">
    <div class="agents-view-list" v-show="showSidebar">
      <agent-list
        @create="handleCreate"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
    <div class="agents-view-detail">
      <agent-form
        v-if="editingAgent || showForm"
        :agent="editingAgent"
        @save="handleSave"
        @cancel="showForm = false; editingAgent = null"
      />
      <div v-else class="agents-view-empty">
        {{ t('agents.selectOrCreate') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.agents-view {
  display: flex; height: 100%; gap: 16px; padding: 16px;
}
.agents-view-list { width: 300px; flex-shrink: 0; }
.agents-view-detail { flex: 1; overflow-y: auto; }
.agents-view-empty {
  display: flex; align-items: center; justify-content: center;
  height: 100%; opacity: 0.5;
}
@media (max-width: 768px) {
  .agents-view { flex-direction: column; }
  .agents-view-list { width: 100%; height: 200px; }
}
</style>
```

- [ ] **Step 2: Verify view compiles**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/views/hermes/AgentsView.vue
git commit -m "feat: add AgentsView management page"
```

---

### Task 11: Router + i18n Integration

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh.ts`

**Interfaces:**
- Consumes: `AgentsView` from Task 10
- Produces: `/yi/agents` route + i18n keys

- [ ] **Step 1: Add route**

Add to `src/router/index.ts` routes array:

```typescript
{
  path: '/yi/agents',
  name: 'yi.agents',
  component: () => import('@/views/hermes/AgentsView.vue'),
},
```

- [ ] **Step 2: Add i18n keys (en)**

Add to `src/i18n/locales/en.ts`:

```typescript
agents: {
  title: 'Agents',
  search: 'Search agents...',
  create: 'New Agent',
  empty: 'No agents found',
  builtIn: 'Built-in',
  selectOrCreate: 'Select an agent or create a new one',
  form: {
    name: 'Name',
    namePlaceholder: 'e.g. Code Reviewer',
    description: 'Description',
    icon: 'Icon',
    color: 'Color',
    soul: 'System Prompt',
    soulPlaceholder: 'Define the agent personality and behavior...',
    mode: 'Mode',
    maxSteps: 'Max Steps',
    permissions: 'Permissions',
    memory: 'Memory',
    enabled: 'Enabled',
  },
},
```

- [ ] **Step 3: Add i18n keys (zh)**

Add to `src/i18n/locales/zh.ts`:

```typescript
agents: {
  title: '角色',
  search: '搜索角色...',
  create: '新建角色',
  empty: '暂无角色',
  builtIn: '内置',
  selectOrCreate: '选择一个角色或新建',
  form: {
    name: '名称',
    namePlaceholder: '例如：代码审查员',
    description: '描述',
    icon: '图标',
    color: '颜色',
    soul: '系统提示词',
    soulPlaceholder: '定义角色的人格和行为...',
    mode: '模式',
    maxSteps: '最大步数',
    permissions: '权限',
    memory: '记忆',
    enabled: '启用',
  },
},
```

- [ ] **Step 4: Add sidebar entry**

Add to `src/components/layout/AppSidebar.vue` in the Agent group:

```vue
<route-link-item route-name="yi.agents" icon-class="ri-robot-line" :label="t('sidebar.agents')" />
```

- [ ] **Step 5: Verify everything compiles**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/router/index.ts src/i18n/locales/en.ts src/i18n/locales/zh.ts src/components/layout/AppSidebar.vue
git commit -m "feat: add agents route, i18n, and sidebar entry"
```

---

## Phase 3: Message Parts Adapter

### Task 12: Message Parts Conversion Utilities

**Files:**
- Create: `src/utils/message-parts.ts`

**Interfaces:**
- Consumes: `Message`, `Part` from `src/types/message.ts`
- Consumes: `Message` (old flat format) from `src/stores/hermes/chat.ts`
- Produces: `toPartMessage()`, `toFlatMessage()`, `extractText()`, `extractReasoning()`, `extractTools()`

- [ ] **Step 1: Create conversion utilities**

```typescript
// src/utils/message-parts.ts
import type { Message as PartMessage, Part, TextPart, ReasoningPart, ToolPart, StepStartPart, StepFinishPart } from '@/types/message'

/** Legacy flat message format from chat store */
export interface FlatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool' | 'command'
  content: string
  reasoning?: string
  toolName?: string
  toolCallId?: string
  toolArgs?: unknown
  toolResult?: unknown
  toolStatus?: 'running' | 'done' | 'error'
  toolDuration?: number
  isStreaming?: boolean
  timestamp: number
  finishReason?: string | null
}

/** Convert flat message to part-based message */
export function toPartMessage(flat: FlatMessage, sessionID: string): PartMessage {
  const parts: Part[] = []

  if (flat.content) {
    parts.push({ type: 'text', text: flat.content })
  }

  if (flat.reasoning) {
    parts.push({ type: 'reasoning', text: flat.reasoning })
  }

  if (flat.toolName) {
    const stateMap: Record<string, ToolPart['state']> = {
      running: 'running',
      done: 'completed',
      error: 'error',
    }
    parts.push({
      type: 'tool',
      name: flat.toolName,
      args: (typeof flat.toolArgs === 'object' ? flat.toolArgs : {}) as Record<string, unknown>,
      state: stateMap[flat.toolStatus || 'running'] || 'pending',
      result: flat.toolResult ? String(flat.toolResult) : undefined,
      callId: flat.toolCallId || '',
    })
  }

  return {
    id: flat.id,
    sessionID,
    role: flat.role === 'system' || flat.role === 'tool' || flat.role === 'command' ? 'assistant' : flat.role,
    parts,
    time: { created: flat.timestamp },
  }
}

/** Convert part-based message to flat message (for backwards compat) */
export function toFlatMessage(partMsg: PartMessage): FlatMessage {
  const textPart = partMsg.parts.find((p): p is TextPart => p.type === 'text')
  const reasoningPart = partMsg.parts.find((p): p is ReasoningPart => p.type === 'reasoning')
  const toolPart = partMsg.parts.find((p): p is ToolPart => p.type === 'tool')

  const statusMap: Record<ToolPart['state'], FlatMessage['toolStatus']> = {
    pending: 'running',
    running: 'running',
    completed: 'done',
    error: 'error',
  }

  return {
    id: partMsg.id,
    role: partMsg.role,
    content: textPart?.text || '',
    reasoning: reasoningPart?.text,
    toolName: toolPart?.name,
    toolCallId: toolPart?.callId,
    toolArgs: toolPart?.args,
    toolResult: toolPart?.result,
    toolStatus: toolPart ? statusMap[toolPart.state] : undefined,
    toolDuration: toolPart?.startedAt && toolPart?.completedAt
      ? (toolPart.completedAt - toolPart.startedAt) / 1000
      : undefined,
    timestamp: partMsg.time.created,
    finishReason: undefined,
  }
}

/** Extract text content from parts */
export function extractText(parts: Part[]): string {
  return parts
    .filter((p): p is TextPart => p.type === 'text')
    .map(p => p.text)
    .join('')
}

/** Extract reasoning from parts */
export function extractReasoning(parts: Part[]): string {
  return parts
    .filter((p): p is ReasoningPart => p.type === 'reasoning')
    .map(p => p.text)
    .join('')
}

/** Extract tool calls from parts */
export function extractTools(parts: Part[]): ToolPart[] {
  return parts.filter((p): p is ToolPart => p.type === 'tool')
}
```

- [ ] **Step 2: Verify utilities compile**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/utils/message-parts.ts
git commit -m "feat: add message parts conversion utilities (flat ↔ part-based)"
```

---

### Task 13: Update Chat Store to Use New Types

**Files:**
- Modify: `src/stores/hermes/chat.ts` (minimal changes)

**Interfaces:**
- Consumes: `PartMessage`, `FlatMessage`, `toPartMessage`, `toFlatMessage` from Task 12
- Consumes: `Agent` from `src/types/agent.ts`
- Produces: Chat store uses `agentId` instead of `agent` string

- [ ] **Step 1: Add agentId to Session interface**

In `src/stores/hermes/chat.ts`, update the `Session` interface:

```typescript
// Add after line 85 (agent?: string)
agentId?: string  // New: references Agent.id
```

- [ ] **Step 2: Update createSession to accept agentId**

In the `createSession` function (around line 952), add `agentId` parameter:

```typescript
function createSession(options: {
  // ...existing options...
  agentId?: string  // Add this
} = {}) {
  // In the session object creation, add:
  agentId: options.agentId || options.agent || 'general',
}
```

- [ ] **Step 3: Update startRun to pass agentId**

In the `startRun` function (around line 2041), add `agent_id` to the socket event:

```typescript
const agentId = activeSession.value?.agentId || activeSession.value?.agent || 'general'
// In the startRunViaSocket call, add:
agent_id: agentId,
```

- [ ] **Step 4: Verify store compiles**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/stores/hermes/chat.ts
git commit -m "feat: integrate agentId into chat store session and run"
```

---

## Phase 4: Session Enhancements (Fork/Revert/Queue)

### Task 14: Session Fork Support

**Files:**
- Modify: `src/stores/hermes/chat.ts`

**Interfaces:**
- Consumes: `Session.parentID`, `Session.forkPointMessageID` from `src/types/session.ts`
- Produces: `forkSession()` method

- [ ] **Step 1: Add forkSession method**

Add to the chat store's return object:

```typescript
function forkSession(sessionId: string, messageId: string) {
  const source = sessions.value.find(s => s.id === sessionId)
  if (!source) return

  const forkIndex = source.messages.findIndex(m => m.id === messageId)
  const forkedMessages = forkIndex >= 0 ? source.messages.slice(0, forkIndex + 1) : [...source.messages]

  const newSession = createSession({
    agent: source.agent,
    model: source.model,
    provider: source.provider,
    parentID: sessionId,
    forkPointMessageId: messageId,
  })

  newSession.messages = forkedMessages
  newSession.parentTitle = source.title
  sessions.value.push(newSession)
  activeSessionId.value = newSession.id
  saveActiveSessionId()
  return newSession
}
```

- [ ] **Step 2: Add revertToMessage method**

```typescript
function revertToMessage(sessionId: string, messageId: string) {
  const session = sessions.value.find(s => s.id === sessionId)
  if (!session) return

  const idx = session.messages.findIndex(m => m.id === messageId)
  if (idx < 0) return

  // Save snapshot before revert
  session.revert = {
    messageID: messageId,
    snapshot: JSON.stringify(session.messages),
  }

  // Truncate messages after the target
  session.messages = session.messages.slice(0, idx + 1)
  session.version++
}
```

- [ ] **Step 3: Verify store compiles**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/stores/hermes/chat.ts
git commit -m "feat: add forkSession and revertToMessage to chat store"
```

---

### Task 15: Session Queue Management

**Files:**
- Modify: `src/stores/hermes/chat.ts`

**Interfaces:**
- Consumes: existing `queueLengths` and `queuedRunIds`
- Produces: `enqueueMessage()`, `dequeueMessage()`, `cancelQueuedMessage()`

- [ ] **Step 1: Add queue methods**

```typescript
function enqueueMessage(sessionId: string, content: string, attachments?: Attachment[]) {
  const session = sessions.value.find(s => s.id === sessionId)
  if (!session) return

  const msg: Message = {
    id: `queued:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    role: 'user',
    content,
    timestamp: Date.now(),
    queued: true,
    attachments,
  }

  session.queuedMessages.push(msg)
  session.queueLength = session.queuedMessages.length
}

function cancelQueuedMessage(sessionId: string, messageId: string) {
  const session = sessions.value.find(s => s.id === sessionId)
  if (!session) return

  session.queuedMessages = session.queuedMessages.filter(m => m.id !== messageId)
  session.queueLength = session.queuedMessages.length
}
```

- [ ] **Step 2: Verify store compiles**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/stores/hermes/chat.ts
git commit -m "feat: add queue management methods to chat store"
```

---

## Phase 5: Integration & Polish

### Task 16: Update ChatView to Use AgentSelector

**Files:**
- Modify: `src/components/hermes/chat/ChatInput.vue`

**Interfaces:**
- Consumes: `AgentSelector` from Task 9
- Produces: Agent selector integrated into chat input area

- [ ] **Step 1: Add AgentSelector to ChatInput**

Import and place the AgentSelector next to the model selector:

```vue
<script setup lang="ts">
import AgentSelector from '@/components/hermes/agents/AgentSelector.vue'
// ...existing imports...
</script>

<template>
  <!-- Add before or after the existing model selector -->
  <agent-selector />
  <!-- ...existing template... -->
</template>
```

- [ ] **Step 2: Verify ChatInput compiles**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/hermes/chat/ChatInput.vue
git commit -m "feat: integrate AgentSelector into ChatInput"
```

---

### Task 17: Agent API Stubs

**Files:**
- Create: `src/api/hermes/agents.ts`

**Interfaces:**
- Consumes: `Agent`, `AgentConfig` from types
- Produces: `fetchAgents()`, `createAgent()`, `updateAgent()`, `deleteAgent()` (mock implementations)

- [ ] **Step 1: Create agent API stubs**

```typescript
// src/api/hermes/agents.ts
import type { Agent, AgentConfig } from '@/types/agent'
import { BUILTIN_AGENTS } from '@/types/agent'

const API_BASE = '/api/hermes/agents'

export async function fetchAgents(): Promise<Agent[]> {
  // Mock: return built-in agents + localStorage custom agents
  try {
    const raw = localStorage.getItem('yi_agents')
    const custom: Agent[] = raw ? JSON.parse(raw) : []
    return [...BUILTIN_AGENTS, ...custom]
  } catch {
    return [...BUILTIN_AGENTS]
  }
}

export async function createAgent(config: AgentConfig): Promise<Agent> {
  const agent: Agent = {
    ...config,
    id: `custom:${Date.now()}`,
    builtIn: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  // Mock: persist to localStorage
  const existing = JSON.parse(localStorage.getItem('yi_agents') || '[]')
  existing.push(agent)
  localStorage.setItem('yi_agents', JSON.stringify(existing))
  return agent
}

export async function updateAgent(id: string, patch: Partial<AgentConfig>): Promise<Agent> {
  const existing: Agent[] = JSON.parse(localStorage.getItem('yi_agents') || '[]')
  const idx = existing.findIndex(a => a.id === id)
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...patch, updatedAt: Date.now() }
    localStorage.setItem('yi_agents', JSON.stringify(existing))
    return existing[idx]
  }
  throw new Error(`Agent ${id} not found`)
}

export async function deleteAgent(id: string): Promise<void> {
  const existing: Agent[] = JSON.parse(localStorage.getItem('yi_agents') || '[]')
  const filtered = existing.filter(a => a.id !== id)
  localStorage.setItem('yi_agents', JSON.stringify(filtered))
}
```

- [ ] **Step 2: Verify API stubs compile**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/api/hermes/agents.ts
git commit -m "feat: add agent API stubs with localStorage mock"
```

---

### Task 18: Full Build Verification

**Files:**
- No new files

**Interfaces:**
- Consumes: all tasks above
- Produces: clean build

- [ ] **Step 1: Run type check**

Run: `cd apps/client && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Run dev server**

Run: `cd apps/client && pnpm dev`
Expected: Vite starts on port 5173

- [ ] **Step 3: Manual smoke test**

Navigate to `http://localhost:5173/#/yi/agents` — verify:
- Agent list renders with 4 built-in agents
- Search filters agents
- Click agent to select, form shows details
- Create new agent, it appears in list
- Toggle enable/disable
- Navigate to chat, AgentSelector shows current agent
- Switch agent in selector

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: complete agent framework integration (types, stores, UI)"
```

---

## Summary

| Phase | Tasks | Deliverable |
|-------|-------|-------------|
| 1 | 1-5 | Type definitions (Agent, Message, Session, Provider) |
| 2 | 6-11 | Agent store + management UI + route |
| 3 | 12-13 | Message Parts adapter + chat store integration |
| 4 | 14-15 | Session fork/revert/queue |
| 5 | 16-18 | Integration, API stubs, build verification |

**Total: 18 tasks, ~55 steps**
