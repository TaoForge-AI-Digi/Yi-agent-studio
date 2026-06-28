# ChatView 页面完整规范 (最终版)

> 基于前端源码完整分析，覆盖所有组件的所有功能和交互。

---

## 目录

1. [组件层级总览](#组件层级总览)
2. [ChatView.vue](#1-chatviewvue)
3. [ChatPanel.vue](#2-chatpanelvue)
4. [SessionListItem.vue](#3-sessionlistitemvue)
5. [MessageList.vue](#4-messagelistvue)
6. [MessageItem.vue](#5-messageitemvue)
7. [ChatInput.vue](#6-chatinputvue)
8. [MarkdownRenderer.vue](#7-markdownrenderervue)
9. [OutlinePanel.vue](#8-outlinepanelvue)
10. [FilesPanel.vue](#9-filespanelvue)
11. [TerminalPanel.vue](#10-terminalpanelvue)
12. [后端接口需求汇总](#后端接口需求汇总)

---

## 组件层级总览

```
ChatView.vue
└── ChatPanel.vue
    │
    ├── [侧边栏]
    │   ├── PageSidebarNav (导航)
    │   ├── NInput (搜索框)
    │   ├── NSelect (分组过滤: none/workspace/profile/date)
    │   ├── NSelect (Profile 过滤)
    │   ├── SessionListItem[] (会话列表)
    │   ├── NDropdown (右键菜单)
    │   └── 设置按钮
    │
    ├── [弹窗]
    │   ├── NModal (重命名)
    │   ├── NModal (工作区设置)
    │   ├── NModal (模型选择器)
    │   ├── NModal (API 模式选择)
    │   └── NDrawer (新建对话表单)
    │
    ├── [聊天区域]
    │   ├── [顶栏]
    │   │   ├── 侧边栏 toggle
    │   │   ├── 标题 + workspace badge
    │   │   ├── 文件/终端面板 toggle
    │   │   ├── 大纲面板 toggle
    │   │   └── 复制 session ID
    │   │
    │   ├── MessageList.vue
    │   │   ├── VirtualMessageList.vue
    │   │   ├── MessageItem.vue
    │   │   ├── Fork 分隔符
    │   │   ├── 流式指示器 (thinking/tool/compression/abort)
    │   │   ├── 审批浮动面板
    │   │   ├── 澄清浮动面板
    │   │   └── 队列消息面板
    │   │
    │   └── ChatInput.vue
    │       ├── 顶部工具栏
    │       │   ├── CharacterSelector
    │       │   ├── 附件按钮
    │       │   ├── YiModelSelector
    │       │   ├── 推理强度选择
    │       │   ├── 自动语音开关
    │       │   ├── 工具追踪开关
    │       │   └── 上下文信息
    │       ├── 附件预览区
    │       ├── 输入区域 (textarea + Slash 命令)
    │       ├── VoiceDialogueControls
    │       ├── 停止按钮
    │       ├── 发送按钮
    │       ├── Skill Picker Modal
    │       └── Context Edit Modal
    │
    └── [右侧面板]
        ├── OutlinePanel.vue
        └── DrawerPanel.vue
            ├── FilesPanel.vue
            │   ├── FileTree
            │   ├── FileBreadcrumb
            │   ├── FileToolbar
            │   ├── FileList
            │   ├── FileEditor
            │   ├── FilePreview
            │   ├── FileContextMenu
            │   ├── FileUploadModal
            │   └── FileRenameModal
            └── TerminalPanel.vue
                ├── 终端侧边栏
                ├── 主题选择
                └── xterm.js 终端
```

---

## 1. ChatView.vue

**文件:** `apps/client/src/views/yi/ChatView.vue` (88 行)

**职责:** 页面入口，初始化加载

### 初始化流程

```typescript
onMounted(async () => {
  chatStore.setRuntimeMode('default')
  await Promise.all([
    appStore.loadModels(),
    profilesStore.fetchProfiles(),
    settingsStore.fetchSettings(),
  ])
  await chatStore.loadSessions()
  await loadRouteSession()
})
```

### 路由参数处理

```typescript
const routeSessionId = computed(() => route.params.sessionId as string | undefined)
const routeProfile = computed(() => (route.params.profile as string) || null)

watch([routeSessionId, routeProfile], async ([sessionId]) => {
  await loadRouteSession()
})

async function loadRouteSession() {
  const sessionId = routeSessionId.value
  if (sessionId && chatStore.sessions.some(s => s.id === sessionId)) {
    await chatStore.switchSession(sessionId, routeProfile.value)
  }
}
```

### Tab 标题

```typescript
const tabTitle = computed(() => {
  const session = chatStore.activeSession
  const title = session?.title || '新建对话'
  return `${title} - Yi Studio`
})
watch(tabTitle, (value) => { document.title = value }, { immediate: true })
```

### 后端接口

| 接口 | 用途 |
|------|------|
| `GET /models` | `appStore.loadModels()` |
| `GET /sessions` | `chatStore.loadSessions()` |
| `GET /config` | `settingsStore.fetchSettings()` |

---

## 2. ChatPanel.vue

**文件:** `apps/client/src/components/yi/chat/ChatPanel.vue` (2515 行)

**职责:** 聊天页面核心组件

### 2.1 侧边栏

#### 搜索和过滤

```typescript
const sidebarSearch = ref('')
const sidebarFilter = ref<'none' | 'workspace' | 'profile' | 'date'>('none')
const sessionProfileFilter = computed(() => chatStore.sessionProfileFilter)
```

**过滤选项:**
| 值 | 说明 |
|----|------|
| `'none'` | 不分组 |
| `'workspace'` | 按工作区分组 |
| `'profile'` | 按 Profile 分组 |
| `'date'` | 按日期分组 |

**Profile 过滤选项:**
```typescript
const profileFilterOptions = computed(() => [
  { label: '不分组', value: null },
  ...profilesStore.profiles.map(p => ({ label: p.name, value: p.name }))
])
```

**交互:**
| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 搜索输入 | `sidebarSearch` v-model | 无（本地过滤） |
| 分组过滤 | `sidebarFilter` v-model | 无（本地过滤） |
| Profile 过滤 | `handleProfileFilterChange()` | `GET /sessions?profile=X` |

#### 会话列表

```typescript
const pinnedSessions = computed(() => sortSessionsForSidebar(...))
const unpinnedSessions = computed(() => sortSessionsForSidebar(...))
```

**排序逻辑:**
- 置顶会话在前
- 按 `updatedAt` 降序排列

#### 批量操作

```typescript
const isBatchMode = ref(false)
const selectedSessionKeys = ref<Set<string>>(new Set())
const showBatchDeleteConfirm = ref(false)
const isBatchDeleting = ref(false)
```

**交互:**
| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 进入批量模式 | `toggleBatchMode()` | 无 |
| 选择会话 | `toggleSessionSelection(session)` | 无 |
| 全选 | `selectAllSessions()` | 无 |
| 批量删除 | `handleBatchDelete()` | `POST /sessions/batch-delete` |

### 2.2 右键菜单

```typescript
const contextSessionId = ref<string | null>(null)
const contextMenuOptions = computed(() => [
  { label: '置顶', key: 'pin', disabled: false },
  { label: '重命名', key: 'rename', disabled: false },
  { label: '设置工作区', key: 'workspace', disabled: false },
  { label: '切换模型', key: 'model', disabled: false },
  { label: '复制链接', key: 'copy-link', disabled: false },
  { label: '复制 ID', key: 'copy-id', disabled: false },
  { label: '导出', key: 'export-json', disabled: false },
  { label: '导出 (纯文本)', key: 'export-txt', disabled: false },
])
```

**交互:**
| 菜单项 | 处理函数 | 后端接口 |
|--------|----------|----------|
| 置顶 | `handleContextMenuSelect('pin')` | 无（localStorage） |
| 重命名 | `showRenameModal = true` | `PUT /sessions/:id/rename` |
| 设置工作区 | `showWorkspaceModal = true` | `PUT /sessions/:id/workspace` |
| 切换模型 | `openSessionModelModal()` | `PUT /sessions/:id/model` |
| 复制链接 | `copySessionLink()` | 无 |
| 复制 ID | `copySessionId()` | 无 |
| 导出 JSON | `handleContextMenuSelect('export-json')` | `GET /sessions/:id/export?format=json` |
| 导出 TXT | `handleContextMenuSelect('export-txt')` | `GET /sessions/:id/export?format=txt` |

### 2.3 重命名弹窗

```typescript
const showRenameModal = ref(false)
const renameValue = ref('')
const renameSessionId = ref<string | null>(null)
```

**交互:**
| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 确认重命名 | `handleRenameConfirm()` | `PUT /sessions/:id/rename` |

```typescript
async function handleRenameConfirm() {
  if (!renameSessionId.value || !renameValue.value.trim()) return
  await renameSession(renameSessionId.value, renameValue.value.trim())
  showRenameModal.value = false
}
```

### 2.4 工作区设置弹窗

```typescript
const showWorkspaceModal = ref(false)
const workspaceValue = ref('')
const workspaceSessionId = ref<string | null>(null)
```

**交互:**
| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 确认设置 | `handleWorkspaceConfirm()` | `PUT /sessions/:id/workspace` |

```typescript
async function handleWorkspaceConfirm() {
  if (!workspaceSessionId.value) return
  await setSessionWorkspace(workspaceSessionId.value, workspaceValue.value)
  showWorkspaceModal.value = false
}
```

### 2.5 模型选择弹窗

```typescript
const showSessionModelModal = ref(false)
const sessionModelSessionId = ref<string | null>(null)
const sessionModelSearch = ref('')
const sessionModelValue = ref('')
const sessionModelProvider = ref('')
const sessionModelCustomInput = ref('')
const sessionModelCustomProvider = ref('')
const sessionModelApiMode = ref<CodingAgentApiMode>('codex_responses')
```

**交互:**
| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 选择模型 | `selectSessionModel(model, provider)` | 无（本地选择） |
| 确认 API 模式 | `confirmSessionModelMode()` | `PUT /sessions/:id/model` |
| 自定义模型提交 | `handleSessionModelCustomSubmit()` | 无（本地选择） |

**模型分组:**
```typescript
const sessionModelGroupsWithCustom = computed(() => {
  const groups = sessionModelBaseGroups.value
  // 添加自定义模型选项
  return [...groups, { provider: 'custom', models: [{ id: 'custom', name: '自定义模型' }] }]
})
```

### 2.6 新建对话抽屉

```typescript
const showNewChatModal = ref(false)
const newChatAgent = ref<'yi' | 'claude-code' | 'codex'>('yi')
const newChatAgentMode = ref<'global' | 'scoped'>('scoped')
const newChatProfile = ref<string>('default')
const newChatProvider = ref<string>('')
const newChatModel = ref<string>('')
const newChatBaseUrl = ref<string>('')
const newChatApiKey = ref<string>('')
const newChatApiMode = ref<CodingAgentApiMode>('codex_responses')
const newChatWorkspace = ref<string>('')
```

**交互:**
| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 选择 Agent 类型 | `newChatAgent` v-model | 无 |
| 选择 Agent 模式 | `newChatAgentMode` v-model | 无 |
| 选择 Profile | `handleNewChatProfileChange()` | 无 |
| 选择 Provider | `handleNewChatProviderChange()` | 无 |
| 确认创建 | `confirmNewChat()` | 无（本地创建） |

```typescript
async function confirmNewChat() {
  chatStore.newChat({
    profile: newChatProfile.value,
    model: newChatModel.value,
    provider: newChatProvider.value,
    source: isNewChatGlobalCodingAgent.value ? 'global_agent' : 'cli',
    agent: newChatAgent.value === 'codex' ? 'codex' : newChatAgent.value === 'claude-code' ? 'claude' : 'yi',
    codingAgentId: isNewChatCodingAgent.value ? newChatAgent.value : undefined,
    codingAgentMode: newChatAgentMode.value,
    workspace: newChatWorkspace.value || undefined,
    baseUrl: newChatBaseUrl.value || undefined,
    apiKey: newChatApiKey.value || undefined,
    apiMode: newChatApiMode.value,
  })
  showNewChatModal.value = false
}
```

### 2.7 顶栏

```html
<header class="chat-header">
  <NButton @click="showSessions = !showSessions" /> <!-- 侧边栏 toggle -->
  <div class="header-title">
    {{ headerTitle }}
    <NTooltip v-if="activeSession?.workspace">
      <template #trigger>
        <span class="workspace-badge" @click="openActiveSessionWorkspace">
          📁 {{ workspaceName }}
        </span>
      </template>
      点击修改工作区
    </NTooltip>
  </div>
  <NButton @click="showToolPanel = !showToolPanel" /> <!-- 文件/终端面板 -->
  <NButton @click="showOutline = !showOutline" /> <!-- 大纲面板 -->
  <NButton @click="copySessionId()" /> <!-- 复制 ID -->
</header>
```

**交互:**
| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 切换侧边栏 | `showSessions = !showSessions` | 无 |
| 打开工作区设置 | `openActiveSessionWorkspace()` | `PUT /sessions/:id/workspace` |
| 切换文件/终端面板 | `showToolPanel = !showToolPanel` | 无 |
| 切换大纲面板 | `showOutline = !showOutline` | 无 |
| 复制 session ID | `copySessionId()` | 无 |

### 2.8 文件拖拽上传

```typescript
function hasDraggedFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types || []).includes('Files')
}

async function handleChatDrop(event: DragEvent) {
  event.preventDefault()
  chatDropCounter.value = 0
  isChatDropActive.value = false
  if (!hasDraggedFiles(event)) return
  
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length > 0 && chatInputRef.value) {
    chatInputRef.value.addFiles(files)
  }
}
```

**交互:**
| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 拖拽文件到聊天区域 | `handleChatDrop()` | `POST /upload` |

### 2.9 工具面板

```typescript
const showToolPanel = ref(false)
const activeToolPanel = ref<'files' | 'terminal'>('files')
const toolPanelWidth = ref(loadToolPanelWidth())
```

**交互:**
| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 切换面板 | `activeToolPanel = 'files' / 'terminal'` | 无 |
| 调整面板宽度 | `startToolResize()` | 无 |

### 2.10 后端接口汇总

| 方法 | 路径 | 用途 |
|------|------|------|
| `PUT` | `/sessions/:id/rename` | 重命名会话 |
| `PUT` | `/sessions/:id/workspace` | 设置工作区 |
| `PUT` | `/sessions/:id/model` | 切换模型 |
| `DELETE` | `/sessions/:id` | 删除会话 |
| `POST` | `/sessions/batch-delete` | 批量删除 |
| `GET` | `/sessions/:id/export` | 导出会话 |
| `POST` | `/upload` | 上传文件 |

---

## 3. SessionListItem.vue

**文件:** `apps/client/src/components/yi/chat/SessionListItem.vue` (463 行)

### Props

```typescript
const props = withDefaults(defineProps<{
  session: Session
  active: boolean
  pinned: boolean
  canDelete: boolean
  streaming?: boolean
  completedUnread?: boolean
  selectable?: boolean
  selected?: boolean
  showProfile?: boolean
  to?: string
}>(), { showProfile: true })
```

### Emits

```typescript
const emit = defineEmits<{
  select: []
  contextmenu: [event: MouseEvent]
  delete: []
  'toggle-select': []
}>()
```

### 显示内容

```
┌─────────────────────────────────┐
│ 📌 [置顶图标]    [未读红点]      │
│ 会话标题                         │
│ 🤖 Agent Logo  👤 Profile 名称   │
│ [流式动画] [警告图标] [时间]      │
└─────────────────────────────────┘
```

**计算属性:**
```typescript
const profileName = computed(() => props.session.profile || 'default')
const profileAvatar = computed(() => ...) // profile 头像
const profileHasModels = computed(() => ...) // profile 是否有模型
const profileModelsMissing = computed(() => ...) // 模型是否缺失
const isGlobalAgentSession = computed(() => props.session.source === 'global_agent')
const sessionAgentLogo = computed(() => ...) // Agent logo
```

### 交互

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击选择 | `onClick()` → `emit('select')` | 无 |
| 右键菜单 | `emit('contextmenu')` | 无 |
| 长按 (移动端 500ms) | `emit('contextmenu')` | 无 |
| 批量选择 | `emit('toggle-select')` | 无 |
| 删除确认 | `emit('delete')` | 无 |

**长按实现:**
```typescript
let longPressTimer: number | null = null
const longPressTriggered = ref(false)

function onTouchStart(e: TouchEvent) {
  longPressTriggered.value = false
  longPressTimer = window.setTimeout(() => {
    longPressTriggered.value = true
    emit('contextmenu')
  }, 500)
}

function onTouchEnd() {
  if (longPressTimer) clearTimeout(longPressTimer)
}

function onTouchMove() {
  if (longPressTimer) clearTimeout(longPressTimer)
}
```

### 后端接口

无直接 API 调用。

---

## 4. MessageList.vue

**文件:** `apps/client/src/components/yi/chat/MessageList.vue` (1629 行)

### 核心状态

```typescript
const chatStore = useChatStore()
const listRef = ref<InstanceType<typeof VirtualMessageList> | null>(null)
const showScrollBottomButton = ref(false)
const thinkingElapsedMs = ref(0)
const clarifyResponse = ref('')
```

### 滚动位置管理

```typescript
type SessionScrollSnapshot = {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
  wasNearBottom: boolean
}

const sessionScrollPositions = new Map<string, SessionScrollSnapshot>()

function saveSessionScrollPosition(sessionId: string) {
  // 保存当前会话的滚动位置
}

function applyInitialSessionScroll(sessionId: string) {
  // 恢复会话的滚动位置
}
```

### 消息过滤

```typescript
const displayMessages = computed(() => {
  const msgs = chatStore.messages
  // 过滤掉没有内容的 assistant 消息
  return msgs.filter(m => {
    if (m.role === 'assistant' && !m.content && !m.toolName) return false
    return true
  })
})
```

### Fork 分隔符

```typescript
const displayMessagesWithForkDivider = computed(() => {
  const messages = displayMessages.value
  const forkLineage = chatStore.activeSession?.parentSessionId
  // 在消息列表中插入 fork 分隔符
})
```

### 流式指示器

```typescript
const isThinkingIndicatorVisible = computed(() => chatStore.isRunActive || !!chatStore.abortState)
const formattedThinkingElapsed = computed(() => formatElapsed(thinkingElapsedMs.value))
const currentToolCalls = computed(() => {
  // 获取最后一条用户消息之后的工具调用
})
const visibleToolCalls = computed(() => {
  return currentToolCalls.value.filter(m => m.toolName)
})
```

### 用户交互与后端接口

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 滚动到底部 | `handleScrollBottomClick()` | 无 |
| 滚动到顶部 (加载更多) | `handleTopReach()` | `GET /sessions/:id/messages?offset=N` |
| 审批按钮 (once) | `handleApproval('once')` | Socket.IO `approval.respond` |
| 审批按钮 (session) | `handleApproval('session')` | Socket.IO `approval.respond` |
| 审批按钮 (always) | `handleApproval('always')` | Socket.IO `approval.respond` |
| 审批按钮 (deny) | `handleApproval('deny')` | Socket.IO `approval.respond` |
| 澄清输入框提交 | `handleClarify()` | Socket.IO `clarify.respond` |
| 澄清选项按钮 | `handleClarify(choice)` | Socket.IO `clarify.respond` |
| 队列消息移除 | `removeQueuedMessage(id)` | Socket.IO `cancel_queued_run` |
| Fork 分隔符链接 | `openForkParent()` | `GET /sessions/:parentId` |

### 加载更多消息

```typescript
async function handleTopReach() {
  const session = chatStore.activeSession
  if (!session || session.isLoadingOlderMessages || !session.hasMoreBefore) return
  
  const offset = session.loadedMessageCount || 0
  if (offset >= 300) return // LIVE_CHAT_MAX_LOADED_MESSAGES
  
  const page = await fetchSessionMessagesPage(session.id, offset, 150, session.profile)
  if (!page || page.messages.length === 0) {
    session.hasMoreBefore = false
    return
  }
  
  // 合并到现有消息列表
  const existingIds = new Set(session.messages.map(m => m.id))
  const olderMessages = mapYiMessages(page.messages).filter(m => !existingIds.has(m.id))
  session.messages = [...olderMessages, ...session.messages]
  session.loadedMessageCount = offset + page.messages.length
  session.hasMoreBefore = page.hasMore
}
```

### 暴露的方法

```typescript
defineExpose({ scrollToBottom, scrollToMessage, scrollToAnchor })
```

### Watch

```typescript
// 监听会话切换
watch(() => chatStore.activeSessionId, async (id, previousId) => {
  if (previousId) saveSessionScrollPosition(previousId)
  if (id) applyInitialSessionScroll(id)
}, { immediate: true })

// 监听消息变化
watch(() => [chatStore.activeSessionId, chatStore.messages.length], ([id, length]) => {
  // 自动滚动到底部
})

// 监听流式输出
watch(() => chatStore.isRunActive, (v) => {
  if (v) scrollToBottom({ frames: 4, keepAliveMs: 2000 })
})

// 监听焦点消息
watch(() => chatStore.focusMessageId, (messageId) => {
  if (messageId) scrollToMessage(messageId)
})
```

### 后端接口

| 方法 | 路径 | 用途 |
|------|------|------|
| `GET` | `/sessions/:id/messages` | 加载历史消息 (分页) |
| Socket.IO | `approval.respond` | 工具审批响应 |
| Socket.IO | `clarify.respond` | 澄清响应 |
| Socket.IO | `cancel_queued_run` | 取消排队消息 |

---

## 5. MessageItem.vue

**文件:** `apps/client/src/components/yi/chat/MessageItem.vue` (1735 行)

### Props

```typescript
const props = defineProps<{
  message: Message
  highlight?: boolean
  headingIdPrefix?: string
  showForkAction?: boolean
}>()
```

### 消息类型处理

```typescript
const isSystem = computed(() => props.message.role === 'system')
const isAgentError = computed(() => props.message.systemType === 'error')
const isCommandMessage = computed(() => props.message.systemType === 'command')
const isCommandError = computed(() => props.message.systemType === 'error')
const isStatusCommand = computed(() => props.message.commandAction === 'status')
```

### 工具消息显示

```typescript
const toolExpanded = ref(false)
const toolArgsPayload = computed(() => {
  const args = props.message.toolArgs
  if (!args) return null
  return formatToolPayload(args)
})
const toolResultPayload = computed(() => {
  const result = props.message.toolResult
  if (!result) return null
  return formatToolPayload(result, true)
})
const hasToolDetails = computed(() => {
  return toolArgsPayload.value || toolResultPayload.value
})
```

**显示结构:**
```
┌─────────────────────────────────┐
│ 🔧 tool_name          [▶ 展开] │
│ [运行中...] [错误] [完成]       │
├─────────────────────────────────┤
│ [展开后]                        │
│ 参数:                           │
│ { "path": "/file.txt" }        │
│                                 │
│ 结果:                           │
│ File content...                 │
└─────────────────────────────────┘
```

### 思考过程显示

```typescript
const hasThinking = computed(() => {
  const reasoning = props.message.reasoning
  return typeof reasoning === 'string' && reasoning.trim().length > 0
})

const thinkingExpanded = computed(() => {
  if (thinkingOverride.value !== null) return thinkingOverride.value
  // 流式时展开，完成后折叠
  return props.message.isStreaming || thinkingDurationMs.value < 5000
})

const thinkingDurationMs = computed(() => {
  // 计算思考过程时长
})
```

**显示结构:**
```
┌─────────────────────────────────┐
│ 💭 思考过程 [2.3s] [425 chars]  │
│ [▶ 展开/折叠]                   │
├─────────────────────────────────┤
│ 让我分析这个问题...             │
│ 首先需要理解...                 │
└─────────────────────────────────┘
```

### 用户消息显示

```typescript
const contentBlocks = computed(() => {
  const content = props.message.content
  if (typeof content === 'string') return null
  // 解析 ContentBlock[]
  return content
})

const isContentBlockArray = computed(() => {
  return Array.isArray(props.message.content)
})
```

**显示结构:**
```
┌─────────────────────────────────┐
│ 用户消息文本                     │
│                                 │
│ [图片预览] [文件卡片]            │
└─────────────────────────────────┘
```

### 助手消息显示

```typescript
const assistantProfileName = computed(() => {
  // 获取助手使用的 profile 名称
})
const assistantProfileAvatar = computed(() => {
  // 获取助手的 profile 头像
})
```

**显示结构:**
```
┌─────────────────────────────────┐
│ [助手头像]                      │
│ Markdown 渲染内容               │
│ [代码块] [图片] [表格]          │
│                                 │
│ [语音] [复制] [Fork] [时间]     │
└─────────────────────────────────┘
```

### 附件显示

```typescript
const hasAttachments = computed(() => {
  return props.message.attachments && props.message.attachments.length > 0
})
```

**显示结构:**
```
┌─────────────────────────────────┐
│ [图片缩略图] [图片缩略图]       │
│ 📄 file.txt (1.2 KB)           │
└─────────────────────────────────┘
```

### 交互

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 展开/折叠工具详情 | `toolExpanded = !toolExpanded` | 无 |
| 复制工具参数/结果 | `handleToolDetailClick()` | 无 |
| 预览附件图片 | `previewUrl = att.url` | 无 |
| 下载附件文件 | `handleAttachmentDownload(att)` | `GET /download?path=...` |
| 展开/折叠思考过程 | `toggleThinking()` | 无 |
| 预览 ContentBlock 图片 | `previewUrl = getContentFileUrl()` | 无 |
| 下载 ContentBlock 文件 | `downloadFile()` | `GET /download?path=...` |
| 语音播放按钮 | `handleSpeechToggle()` | TTS API |
| 复制消息内容 | `copyBubbleContent()` | 无 |
| Fork 对话 | `forkFromCurrentTail()` | Socket.IO `chat-run` |
| 关闭图片预览 | `previewUrl = null` | 无 |

### 语音播放

```typescript
const speech = useGlobalSpeech()
const canPlaySpeech = computed(() => {
  return props.message.role === 'assistant' && props.message.content.trim().length > 0
})
const isPlayingThisMessage = computed(() => speech.currentMessageId.value === props.message.id)
const isPausedThisMessage = computed(() => speech.isPaused.value && isPlayingThisMessage.value)

function handleSpeechToggle() {
  if (isPlayingThisMessage.value) {
    speech.toggle()
  } else {
    speech.toggle(props.message.id, props.message.content)
  }
}
```

### 复制消息内容

```typescript
async function copyBubbleContent() {
  const content = props.message.content
  if (typeof content === 'string') {
    await copyToClipboard(content)
    toast.success('已复制')
  }
}
```

### Fork 对话

```typescript
function forkFromCurrentTail() {
  chatStore.sendMessage('/fork', undefined)
}
```

### 后端接口

| 方法 | 路径 | 用途 |
|------|------|------|
| `GET` | `/download` | 下载文件 |
| Socket.IO | `chat-run` | Fork 对话 |

---

## 6. ChatInput.vue

**文件:** `apps/client/src/components/yi/chat/ChatInput.vue` (1648 行)

> 详见 `docs/CHAT_INPUT_SPEC.md`

### 核心功能

1. **顶部工具栏** (7 个控件)
2. **附件预览区**
3. **输入区域** (textarea + Slash 命令)
4. **语音输入** (VoiceDialogueControls)
5. **停止/发送按钮**
6. **弹窗** (Skill Picker + Context Edit)

### 后端接口

| 方法 | 路径 | 用途 |
|------|------|------|
| `POST` | `/upload` | 上传附件 |
| `POST` | `/stt` | 语音转文字 |
| `GET` | `/skills` | 获取技能列表 |
| `GET` | `/model-context` | 获取上下文长度 |
| `PUT` | `/model-context` | 设置上下文长度 |
| Socket.IO | `chat-run` | 发送消息 |
| Socket.IO | `abort` | 中止运行 |

---

## 7. MarkdownRenderer.vue

**文件:** `apps/client/src/components/yi/chat/MarkdownRenderer.vue` (855 行)

### Props

```typescript
const props = withDefaults(defineProps<{
  content: string
  mentionNames?: string[]
  headingIdPrefix?: string
}>(), {
  mentionNames: () => [],
  headingIdPrefix: '',
})
```

### 渲染特性

```typescript
const md: MarkdownIt = new MarkdownItConstructor({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) { /* 代码高亮 */ }
})

// 插件
md.use(markdownItKatex, { katex, throwOnError: false, strict: 'ignore' })
```

| 特性 | 实现 |
|------|------|
| 代码高亮 | highlight.js |
| LaTeX 公式 | KaTeX |
| Mermaid 图表 | mermaid.js |
| 表格 | markdown-it |
| 链接 | 新窗口打开 |
| 图片 | 点击预览 |
| 本地文件 | 文件卡片 |

### 渲染后处理

```typescript
const renderedHtml = computed(() => {
  let html = md.render(props.content)
  // 1. 添加 heading ID
  // 2. 替换图片 src
  // 3. 替换本地文件链接为文件卡片/视频/音频
  // 4. @提及高亮
  return html
})
```

### Mermaid 图表渲染

```typescript
async function renderMermaidDiagrams(): Promise<void> {
  // 查找所有 .mermaid 元素
  // 异步渲染 Mermaid 图表
  // 处理超时和错误
}
```

### 交互

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击代码块 | 复制到剪贴板 | 无 |
| 点击图片 | 预览大图 | 无 |
| 点击文件链接 | 下载文件 | `GET /download?path=...` |
| 点击链接 | 新窗口打开 | 无 |
| 点击文件预览 | 打开文件预览 | `GET /files/read?path=...` |

### 文件预览

```typescript
async function previewTextFile(path: string, fileName: string) {
  textPreviewLoading.value = true
  try {
    const content = await fetchFileText(path)
    textPreviewContent.value = content
    textPreviewFileName.value = fileName
    textPreviewVisible.value = true
  } finally {
    textPreviewLoading.value = false
  }
}
```

### 后端接口

| 方法 | 路径 | 用途 |
|------|------|------|
| `GET` | `/download` | 下载本地文件 |
| `GET` | `/files/read` | 获取文件内容用于预览 |

---

## 8. OutlinePanel.vue

**文件:** `apps/client/src/components/yi/chat/OutlinePanel.vue` (311 行)

### Props

```typescript
const props = defineProps<{ messages: Message[] }>()
```

### Emits

```typescript
const emit = defineEmits<{
  navigate: [target: { messageId: string; anchorId: string }]
}>()
```

### 数据结构

```typescript
interface OutlineItem {
  id: string
  type: 'user' | 'outline'
  content: string
  messageId: string
  level: number
  anchorId: string
}
```

### 大纲提取

```typescript
const outlineItems = computed<OutlineItem[]>(() => {
  const items: OutlineItem[] = []
  const messages = props.messages
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role === 'user') {
      // 提取用户问题
      items.push({
        id: `user-${msg.id}`,
        type: 'user',
        content: extractUserQuestion(msg.content),
        messageId: msg.id,
        level: 0,
        anchorId: `msg-${msg.id}`,
      })
      
      // 从下一条助手消息提取标题
      const nextAssistant = messages[i + 1]
      if (nextAssistant?.role === 'assistant') {
        const headings = extractAllHeadings(nextAssistant.content, nextAssistant.id)
        items.push(...headings)
      }
    }
  }
  
  return items
})
```

### 标题提取

```typescript
function extractAllHeadings(text: string, messageId: string): OutlineItem[] {
  const items: OutlineItem[] = []
  const regex = /^(#{1,3})\s+(.+)$/gm
  let match
  
  while ((match = regex.exec(text)) !== null) {
    items.push({
      id: `heading-${messageId}-${match.index}`,
      type: 'outline',
      content: match[2],
      messageId,
      level: match[1].length,
      anchorId: `heading-${messageId}-${match.index}`,
    })
  }
  
  return items
}
```

### 交互

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击用户问题 | `scrollToTarget(item)` | 无（滚动到消息） |
| 点击标题 | `scrollToTarget(item)` | 无（滚动到标题） |

```typescript
function scrollToTarget(item: OutlineItem) {
  emit('navigate', {
    messageId: item.messageId,
    anchorId: item.anchorId,
  })
}
```

### 后端接口

无。

---

## 9. FilesPanel.vue

**文件:** `apps/client/src/components/yi/chat/FilesPanel.vue` (215 行)

### 状态

```typescript
const filesStore = useFilesStore()
const contextMenuRef = ref<InstanceType<typeof FileContextMenu> | null>(null)
const showUpload = ref(false)
const showRenameModal = ref(false)
const renameMode = ref<'newFile' | 'newFolder' | 'rename'>('newFile')
const renameEntry = ref<FileEntry | null>(null)
const renameTargetPath = ref<string | null>(null)
const showSidebar = ref(false)
```

### 组件结构

```html
<div class="files-panel-drawer">
  <div class="files-tree-panel">
    <FileTree @select="handleFileSelect" />
  </div>
  <div class="files-main-panel">
    <div class="main-toolbar">
      <NButton @click="showSidebar = !showSidebar" /> <!-- 移动端侧边栏 -->
      <FileToolbar
        @show-new-file="handleShowNewFile"
        @show-new-folder="handleShowNewFolder"
        @show-upload="showUpload = true"
      />
    </div>
    <FileBreadcrumb />
    <div class="files-content">
      <FileEditor v-if="filesStore.editingFile" />
      <FilePreview v-else-if="filesStore.previewFile" />
      <FileList v-else @contextmenu-entry="handleContextMenu" />
    </div>
  </div>
  <FileContextMenu ref="contextMenuRef" @rename="handleRename" @new-folder="handleContextNewFolder" />
  <FileUploadModal v-model:show="showUpload" />
  <FileRenameModal v-model:show="showRenameModal" :mode="renameMode" :entry="renameEntry" :target-path="renameTargetPath" />
</div>
```

### 初始化

```typescript
onMounted(() => {
  filesStore.fetchEntries('')
})
```

### 交互

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 浏览目录 | `handleFileSelect()` | `GET /files/list?path=...` |
| 读取文件 | `handleFileSelect()` | `GET /files/read?path=...` |
| 新建文件 | `handleShowNewFile()` | `PUT /files/write` |
| 新建文件夹 | `handleShowNewFolder()` | `POST /files/mkdir` |
| 上传文件 | `showUpload = true` | `POST /files/upload` |
| 重命名 | `handleRename()` | `POST /files/rename` |
| 删除 | `handleDelete()` | `DELETE /files/delete` |
| 下载 | `handleDownload()` | `GET /download?path=...` |

### 右键菜单

```typescript
function handleContextMenu(e: MouseEvent, entry: FileEntry) {
  contextMenuRef.value?.show(e, entry)
}
```

### 新建文件/文件夹

```typescript
function handleShowNewFile() {
  renameMode.value = 'newFile'
  renameEntry.value = null
  renameTargetPath.value = filesStore.currentPath
  showRenameModal.value = true
}

function handleShowNewFolder() {
  renameMode.value = 'newFolder'
  renameEntry.value = null
  renameTargetPath.value = filesStore.currentPath
  showRenameModal.value = true
}

function handleContextNewFolder(entry: FileEntry) {
  renameMode.value = 'newFolder'
  renameEntry.value = null
  renameTargetPath.value = entry.path
  showRenameModal.value = true
}
```

### 后端接口

| 方法 | 路径 | 用途 |
|------|------|------|
| `GET` | `/files/list` | 浏览目录 |
| `GET` | `/files/read` | 读取文件 |
| `PUT` | `/files/write` | 写入文件 |
| `POST` | `/files/mkdir` | 创建目录 |
| `POST` | `/files/rename` | 重命名 |
| `DELETE` | `/files/delete` | 删除文件/目录 |
| `POST` | `/files/upload` | 上传文件 |
| `GET` | `/download` | 下载文件 |

---

## 10. TerminalPanel.vue

**文件:** `apps/client/src/components/yi/chat/TerminalPanel.vue` (942 行)

### Props

```typescript
const props = defineProps<{ visible?: boolean; initialCommand?: string }>()
```

### 终端主题

```typescript
const TERMINAL_THEMES: Record<string, { label: string; theme: ITheme }> = {
  'default': { label: '默认', theme: { background: '#1e1e1e', foreground: '#d4d4d4' } },
  'solarized-dark': { label: 'Solarized Dark', theme: { ... } },
  'tokyo-night': { label: 'Tokyo Night', theme: { ... } },
  'github-dark': { label: 'GitHub Dark', theme: { ... } },
}

const selectedTheme = ref(localStorage.getItem(STORAGE_KEY_THEME) || 'default')
```

### WebSocket 通信

```typescript
function buildWsUrl(): string {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${location.host}/api/yi/terminal`
}

function connect() {
  ws = new WebSocket(buildWsUrl())
  
  ws.onopen = () => {
    reconnectAttempts = 0
    // 如果有初始命令，创建新终端
  }
  
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    handleControl(msg)
  }
  
  ws.onclose = () => {
    // 自动重连
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      setTimeout(connect, 1000 * reconnectAttempts)
    }
  }
}
```

### WebSocket 消息

**客户端发送:**
```typescript
// 创建新终端
send({ type: 'create' })

// 切换终端
send({ type: 'switch', sessionId })

// 关闭终端
send({ type: 'close', sessionId })

// 发送输入
send({ type: 'input', data })

// 调整尺寸
send({ type: 'resize', cols, rows })
```

**服务端发送:**
```typescript
// 终端已创建
{ type: 'created', id: string, shell: string, pid: number }

// 输出数据
{ type: 'output', id: string, data: string }

// 终端已退出
{ type: 'exited', id: string, exitCode: number }

// 错误
{ type: 'error', message: string }
```

### 会话管理

```typescript
interface SessionInfo {
  id: string
  shell: string
  pid: number
  title: string
  createdAt: number
  exited: boolean
}

const sessions = ref<SessionInfo[]>([])
const activeSessionId = ref<string | null>(null)

function createSession() {
  send({ type: 'create' })
}

function switchSession(id: string) {
  send({ type: 'switch', sessionId: id })
  activeSessionId.value = id
  mountActiveTerminal()
}

function closeSession(id: string) {
  send({ type: 'close', sessionId: id })
  sessions.value = sessions.value.filter(s => s.id !== id)
  // 清理终端实例
}
```

### 初始命令

```typescript
const initialCommandSent = ref(false)

function runInitialCommand() {
  if (!props.initialCommand || initialCommandSent.value) return
  initialCommandSent.value = true
  scheduleInitialCommandChunk(props.initialCommand, 0, 0)
}

function scheduleInitialCommandChunk(command: string, offset: number, delay: number) {
  // 分块发送初始命令（模拟键盘输入）
}
```

### 交互

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 创建新终端 | `createSession()` | WebSocket `create` |
| 切换终端 | `switchSession(id)` | WebSocket `switch` |
| 关闭终端 | `closeSession(id)` | WebSocket `close` |
| 键盘输入 | xterm.js onKey | WebSocket `input` |
| 窗口调整 | xterm.js onResize | WebSocket `resize` |
| 切换主题 | `applyTheme()` | 无（本地） |
| 重试连接 | `connect()` | WebSocket 重新连接 |
| 触摸滚动 | `handleTerminalTouchStart/Move/End()` | 无 |

### 后端接口

| 接口 | 用途 |
|------|------|
| WebSocket `/api/yi/terminal` | 终端实时通信 |

---

## 后端接口需求汇总

### HTTP API

| 方法 | 路径 | 用途 | 触发组件 |
|------|------|------|----------|
| `GET` | `/sessions` | 加载会话列表 | ChatView, ChatPanel |
| `GET` | `/sessions/:id` | 获取会话详情 | SessionSearchModal |
| `GET` | `/sessions/:id/messages` | 加载消息 (分页) | MessageList |
| `DELETE` | `/sessions/:id` | 删除会话 | ChatPanel |
| `POST` | `/sessions/batch-delete` | 批量删除 | ChatPanel |
| `PUT` | `/sessions/:id/rename` | 重命名会话 | ChatPanel |
| `PUT` | `/sessions/:id/workspace` | 设置工作区 | ChatPanel |
| `PUT` | `/sessions/:id/model` | 切换模型 | ChatPanel |
| `GET` | `/sessions/:id/export` | 导出会话 | ChatPanel |
| `POST` | `/upload` | 文件上传 | ChatInput, ChatPanel |
| `GET` | `/download` | 文件下载 | MessageItem, MarkdownRenderer, FilesPanel |
| `GET` | `/models` | 加载模型列表 | ChatView |
| `GET` | `/config` | 加载设置 | ChatView |
| `GET` | `/skills` | 加载 Skills | ChatInput |
| `GET` | `/files/list` | 浏览目录 | FilesPanel |
| `GET` | `/files/read` | 读取文件 | FilesPanel, MarkdownRenderer |
| `PUT` | `/files/write` | 写入文件 | FilesPanel |
| `POST` | `/files/mkdir` | 创建目录 | FilesPanel |
| `POST` | `/files/rename` | 重命名 | FilesPanel |
| `DELETE` | `/files/delete` | 删除文件 | FilesPanel |
| `POST` | `/files/upload` | 上传文件 | FilesPanel |
| `GET` | `/stt` | 语音转文字 | ChatInput |
| `GET` | `/model-context` | 获取上下文长度 | ChatInput |
| `PUT` | `/model-context` | 设置上下文限制 | ChatInput |

### Socket.IO 事件

| 事件 | 方向 | 用途 | 触发组件 |
|------|------|------|----------|
| `chat-run` | Client → Server | 发送消息启动运行 | ChatInput |
| `abort` | Client → Server | 中止运行 | ChatInput |
| `cancel_queued_run` | Client → Server | 取消排队消息 | MessageList |
| `approval.respond` | Client → Server | 工具审批响应 | MessageList |
| `clarify.respond` | Client → Server | 澄清响应 | MessageList |
| `resume` | Client → Server | 恢复会话 | ChatPanel |
| `run.started` | Server → Client | 运行开始 | (监听) |
| `message.delta` | Server → Client | 消息流式更新 | (监听) |
| `reasoning.delta` | Server → Client | 推理文本更新 | (监听) |
| `tool.started` | Server → Client | 工具调用开始 | (监听) |
| `tool.completed` | Server → Client | 工具调用完成 | (监听) |
| `run.completed` | Server → Client | 运行完成 | (监听) |
| `run.failed` | Server → Client | 运行失败 | (监听) |
| `session.title.updated` | Server → Client | 标题更新 | (监听) |
| `usage.updated` | Server → Client | 使用量更新 | (监听) |
| `approval.requested` | Server → Client | 工具审批请求 | (监听) |
| `clarify.requested` | Server → Client | 澄清请求 | (监听) |
| `compression.started` | Server → Client | 压缩开始 | (监听) |
| `compression.completed` | Server → Client | 压缩完成 | (监听) |
| `abort.started` | Server → Client | 中止开始 | (监听) |
| `abort.completed` | Server → Client | 中止完成 | (监听) |
| `run.queued` | Server → Client | 排队更新 | (监听) |
| `session.command` | Server → Client | 会话命令 | (监听) |

### WebSocket

| 路径 | 用途 | 触发组件 |
|------|------|----------|
| `/api/yi/terminal` | Web 终端 | TerminalPanel |
