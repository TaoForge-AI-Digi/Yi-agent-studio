# ChatInput.vue 组件详细规范

> 输入框组件的完整功能、交互和后端接口需求。

---

## 组件结构

```
ChatInput.vue
├── [顶部工具栏]
│   ├── CharacterSelector (角色选择器)
│   ├── 附件按钮
│   ├── YiModelSelector (模型选择器)
│   ├── 推理强度选择 (NPopselect)
│   ├── 自动播放语音开关 (NSwitch)
│   ├── 工具追踪开关
│   └── 上下文信息 + 编辑按钮
│
├── [附件预览区]
│   ├── 图片缩略图
│   └── 文件卡片 + 删除按钮
│
├── [输入区域]
│   ├── 拖拽调整手柄 (resize handle)
│   ├── textarea 输入框
│   ├── Slash 命令下拉菜单
│   └── 文件拖拽区域
│
├── [输入操作区]
│   ├── VoiceDialogueControls (语音输入)
│   ├── 停止按钮 (流式时显示)
│   └── 发送按钮
│
└── [弹窗]
    ├── Skill Picker Modal (技能选择)
    └── Context Edit Modal (上下文限制编辑)
```

---

## 1. 顶部工具栏

### 1.1 CharacterSelector - 角色选择器

**位置:** 工具栏最左侧
**条件渲染:** `v-if="!isCodingAgentSession"` (非 Coding Agent 会话时显示)

**功能:** 选择当前聊天使用的 Agent 角色

**交互:**
| 操作 | 说明 |
|------|------|
| 点击下拉 | 显示可用角色列表 |
| 选择角色 | 切换当前会话使用的 Agent |

**后端接口:** 无（角色列表来自本地或 config）

---

### 1.2 附件按钮

**位置:** 角色选择器右侧
**图标:** 📎 (回形针)

**交互:**
```vue
<NTooltip trigger="hover">
  <template #trigger>
    <NButton quaternary size="tiny" @click="handleAttachClick" circle>
      <template #icon>📎</template>
    </NButton>
  </template>
  {{ t('chat.attachFiles') }}
</NTooltip>
```

| 操作 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击按钮 | `handleAttachClick()` | 无（打开文件选择器） |
| 选择文件 | `handleFileChange()` | `POST /upload` |

**实现逻辑:**
```typescript
function handleAttachClick() {
  fileInputRef.value?.click() // 触发隐藏的 file input
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  addFiles(Array.from(input.files))
  input.value = ''
}
```

---

### 1.3 YiModelSelector - 模型选择器

**位置:** 附件按钮右侧
**条件渲染:** `v-if="!isCodingAgentSession"`

**功能:** 选择当前聊天使用的 LLM 模型

**交互:**
| 操作 | 说明 |
|------|------|
| 点击下拉 | 显示可用模型列表（按 Provider 分组） |
| 选择模型 | 切换当前模型 |

**后端接口:** 无（模型列表来自 appStore）

---

### 1.4 推理强度选择 (Reasoning Effort)

**位置:** 模型选择器右侧
**条件渲染:** `v-if="!isCodingAgentSession"`

**组件:** `NPopselect`

```vue
<NPopselect
  :value="currentReasoningEffort"
  :options="reasoningEffortOptions"
  trigger="click"
  @update:value="onReasoningEffortChange"
>
  <NTooltip trigger="hover">
    <template #trigger>
      <NButton quaternary size="tiny" circle class="reasoning-effort-button" :class="{ active: !!currentReasoningEffort }">
        <template #icon>🧠</template>
      </NButton>
    </template>
    {{ t('chat.reasoningEffort.tooltip') }}: {{ reasoningEffortLabel }}
  </NTooltip>
</NPopselect>
```

**选项:**
| 值 | 标签 |
|----|------|
| `''` | 默认 |
| `'none'` | 无 |
| `'minimal'` | 最小 |
| `'low'` | 低 |
| `'medium'` | 中 |
| `'high'` | 高 |
| `'xhigh'` | 极高 |

**交互:**
| 操作 | 处理函数 | 后端接口 |
|------|----------|----------|
| 选择强度 | `onReasoningEffortChange(value)` | 无（本地状态，发送时附带） |

**实现逻辑:**
```typescript
function onReasoningEffortChange(value: string | null | undefined) {
  const sid = chatStore.activeSessionId
  if (!sid) return
  chatStore.setSessionReasoningEffort(sid, value || '')
}
```

---

### 1.5 自动播放语音开关

**位置:** 推理强度右侧

```vue
<div class="auto-play-speech-switch">
  <NTooltip trigger="hover">
    <template #trigger>
      <div class="switch-label">▶</div>
    </template>
    {{ t('chat.autoPlaySpeech') }}
  </NTooltip>
  <NSwitch size="small" v-model:value="autoPlaySpeech" :round="false" />
</div>
```

**交互:**
| 操作 | 说明 | 后端接口 |
|------|------|----------|
| 切换开关 | 开启/关闭自动播放助手回复的语音 | 无（本地 localStorage + chatStore） |

**实现逻辑:**
```typescript
// 从 localStorage 读取
onMounted(() => {
  const saved = localStorage.getItem('autoPlaySpeech')
  if (saved !== null) {
    autoPlaySpeech.value = saved === 'true'
    chatStore.setAutoPlaySpeech(autoPlaySpeech.value)
  }
})

// 监听变化并保存
watch(autoPlaySpeech, (value) => {
  localStorage.setItem('autoPlaySpeech', String(value))
  chatStore.setAutoPlaySpeech(value)
})
```

---

### 1.6 工具追踪开关 (Tool Trace Toggle)

**位置:** 自动播放语音开关右侧

```vue
<NTooltip trigger="hover">
  <template #trigger>
    <NButton
      quaternary
      size="tiny"
      class="tool-trace-toggle"
      :class="{ active: toolTraceVisible }"
      @click="toggleToolTraceVisible"
    >
      <svg class="tool-trace-icon">🔧</svg>
    </NButton>
  </template>
  {{ toolTraceVisible ? t('chat.hideToolCalls') : t('chat.showToolCalls') }}
</NTooltip>
```

**交互:**
| 操作 | 说明 | 后端接口 |
|------|------|----------|
| 点击按钮 | 显示/隐藏工具调用详情 | 无（本地状态） |

---

### 1.7 上下文信息 + 编辑按钮

**位置:** 工具栏右侧

```vue
<span v-if="showContextUsage" class="context-info" :class="{ 'context-warning': usagePercent > 80 }">
  {{ formatTokens(totalTokens) }} /
  <NTooltip trigger="hover">
    <template #trigger>
      <span class="context-limit-editable" @click="handleEditContextLimit">
        {{ formatTokens(contextLength) }}
      </span>
    </template>
    <span>{{ t('chat.contextClickToEdit') }}</span>
  </NTooltip>
  · {{ t('chat.contextRemaining') }} {{ formatTokens(remainingTokens) }}
</span>
<div v-if="showContextUsage" class="context-bar">
  <div class="context-bar-fill" :style="{ width: `${usagePercent}%` }" />
</div>
```

**显示内容:**
```
12.5k / 256k · 剩余 243.5k  [████████░░] 80%
```

**交互:**
| 操作 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击上下文限制数字 | `handleEditContextLimit()` | 无（打开编辑弹窗） |

**相关数据:**
```typescript
const totalTokens = computed(() => {
  const context = chatStore.activeSession?.contextTokens
  if (typeof context === 'number' && context > 0) return context
  const input = chatStore.activeSession?.inputTokens ?? 0
  const output = chatStore.activeSession?.outputTokens ?? 0
  return input + output
})

const contextLength = ref(256000) // 从后端加载
const remainingTokens = computed(() => Math.max(0, contextLength.value - totalTokens.value))
const usagePercent = computed(() => Math.min((totalTokens.value / contextLength.value) * 100, 100))
```

---

## 2. 附件预览区

**条件渲染:** `v-if="attachments.length > 0"`

```vue
<div v-if="attachments.length > 0" class="attachment-previews">
  <div v-for="att in attachments" :key="att.id" class="attachment-preview" :class="{ image: isImage(att.type) }">
    <!-- 图片类型 -->
    <template v-if="isImage(att.type)">
      <img :src="att.url" :alt="att.name" class="attachment-thumb" />
    </template>
    <!-- 文件类型 -->
    <template v-else>
      <div class="attachment-file">
        <svg>📄</svg>
        <span class="file-name">{{ att.name }}</span>
        <span class="file-size">{{ formatSize(att.size) }}</span>
      </div>
    </template>
    <!-- 删除按钮 -->
    <button class="attachment-remove" @click="removeAttachment(att.id)">✕</button>
  </div>
</div>
```

**交互:**
| 操作 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击删除按钮 | `removeAttachment(id)` | 无（本地移除） |

**数据结构:**
```typescript
interface Attachment {
  id: string
  name: string
  type: string  // MIME type
  size: number
  url: string   // Blob URL
  file: File
}
```

---

## 3. 输入区域

### 3.1 拖拽调整手柄

**位置:** textarea 上方

```vue
<div class="resize-handle" @mousedown="startResize"></div>
```

**交互:**
| 操作 | 处理函数 | 说明 |
|------|----------|------|
| 拖拽 | `startResize(e)` | 调整输入框高度（20px - 400px） |

**实现逻辑:**
```typescript
function startResize(e: MouseEvent) {
  e.preventDefault()
  const el = textareaRef.value
  if (!el) return
  const startHeight = el.clientHeight
  const startY = e.clientY

  function onMouseMove(e: MouseEvent) {
    const deltaY = e.clientY - startY
    const newHeight = startHeight - deltaY
    textareaHeight.value = Math.max(20, Math.min(400, Math.round(newHeight)))
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
```

---

### 3.2 textarea 输入框

```vue
<textarea
  ref="textareaRef"
  v-model="inputText"
  class="input-textarea"
  :style="textareaHeight ? { height: textareaHeight + 'px' } : {}"
  :placeholder="t('chat.inputPlaceholder')"
  rows="1"
  @keydown="handleKeydown"
  @compositionstart="handleCompositionStart"
  @compositionend="handleCompositionEnd"
  @input="handleInput"
  @paste="handlePaste"
/>
```

**事件处理:**

| 事件 | 处理函数 | 说明 |
|------|----------|------|
| `keydown` | `handleKeydown()` | 发送消息、Slash 命令导航 |
| `compositionstart` | `handleCompositionStart()` | 中文输入开始 |
| `compositionend` | `handleCompositionEnd()` | 中文输入结束 |
| `input` | `handleInput()` | 自动高度、Slash 状态更新 |
| `paste` | `handlePaste()` | 粘贴图片 |

**键盘快捷键:**
| 按键 | 行为 |
|------|------|
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |
| `↑` / `↓` | Slash 命令菜单导航 |
| `Enter` / `Tab` | 选择 Slash 命令 |
| `Escape` | 关闭 Slash 命令菜单 |

**粘贴图片处理:**
```typescript
function handlePaste(e: ClipboardEvent) {
  const items = Array.from(e.clipboardData?.items || [])
  const imageItems = items.filter(i => i.type.startsWith('image/'))
  if (!imageItems.length) return
  e.preventDefault()
  for (const item of imageItems) {
    const blob = item.getAsFile()
    if (!blob) continue
    const ext = item.type.split('/')[1] || 'png'
    const file = new File([blob], `pasted-${Date.now()}.${ext}`, { type: item.type })
    addFiles([file])
  }
}
```

**后端接口:** `POST /upload` (上传粘贴的图片)

---

### 3.3 Slash 命令下拉菜单

**触发条件:** 输入以 `/` 开头

```vue
<div v-if="slashActive && filteredBridgeCommands.length > 0" ref="commandDropdownRef" class="slash-command-dropdown">
  <div
    v-for="(command, i) in filteredBridgeCommands"
    :key="command.key"
    class="slash-command-item"
    :class="{ active: i === slashActiveIndex }"
    @mousedown.prevent="selectBridgeCommand(command)"
    @mouseenter="handleCommandHover(i)"
  >
    <span class="slash-command-name">/{{ command.name }}</span>
    <span v-if="command.args" class="slash-command-args">{{ command.args }}</span>
    <span class="slash-command-desc">{{ command.description }}</span>
  </div>
</div>
```

**可用的 Slash 命令:**

| 命令 | 参数 | 说明 |
|------|------|------|
| `/usage` | 无 | 显示使用量统计 |
| `/status` | 无 | 显示当前状态 |
| `/abort` | 无 | 中止当前运行 |
| `/queue` | `<message>` | 将消息加入队列 |
| `/skill` | 无 | 打开技能选择器 |
| `/plan` | `<text>` | 切换到计划模式 |
| `/goal` | `<text>` | 设置目标 |
| `/goal status` | 无 | 查看目标状态 |
| `/goal pause` | 无 | 暂停目标 |
| `/goal resume` | 无 | 恢复目标 |
| `/goal done` | 无 | 标记目标完成 |
| `/goal clear` | 无 | 清除目标 |
| `/subgoal` | `<text>` | 设置子目标 |
| `/clear` | 无 | 清空消息 |
| `/clear --history` | 无 | 清空历史 |
| `/title` | `<title>` | 设置会话标题 |
| `/compress` | 无 | 压缩上下文 |
| `/fork` | `<title>` | Fork 当前对话 |
| `/steer` | `<text>` | 引导对话方向 |
| `/destroy` | 无 | 销毁会话 |
| `/reload-mcp` | 无 | 重载 MCP 服务器 |
| `/reload-skills` | 无 | 重载技能 |

**交互:**
| 操作 | 处理函数 | 后端接口 |
|------|----------|----------|
| 输入 `/` | `updateSlashState()` | 无 |
| 选择命令 | `selectBridgeCommand(command)` | Socket.IO `chat-run` (发送命令) |
| 打开技能选择器 | `openSkillPicker()` | `GET /skills` |

---

### 3.4 文件拖拽区域

```vue
<div
  class="input-wrapper"
  :class="{ 'drag-over': isDragging }"
  @dragover="handleDragOver"
  @dragenter="handleDragEnter"
  @dragleave="handleDragLeave"
  @drop="handleDrop"
>
```

**交互:**
| 操作 | 处理函数 | 后端接口 |
|------|----------|----------|
| 拖拽文件进入 | `handleDragEnter()` | 无 |
| 拖拽文件离开 | `handleDragLeave()` | 无 |
| 放下文件 | `handleDrop()` | `POST /upload` |

**实现逻辑:**
```typescript
function handleDrop(e: DragEvent) {
  e.preventDefault()
  dragCounter.value = 0
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  if (!files.length) return
  addFiles(files)
}
```

---

## 4. 输入操作区

### 4.1 VoiceDialogueControls - 语音输入

```vue
<VoiceDialogueControls
  :status="voiceDialogue.status.value"
  :transcript="voiceDialogueTranscript"
  :error="voiceDialogueError"
  :events="voiceDialogue.events.value"
  :on-start="startVoiceCapture"
  :on-stop="stopVoiceCapture"
  :on-cancel="cancelVoiceCapture"
/>
```

**状态:**
| 状态 | 说明 |
|------|------|
| `idle` | 空闲 |
| `requesting` | 请求麦克风权限 |
| `capturing` | 正在录音 |
| `transcribing` | 正在转录 |
| `sending` | 正在发送 |
| `error` | 错误 |

**交互:**
| 操作 | 处理函数 | 后端接口 |
|------|----------|----------|
| 开始录音 | `startVoiceCapture()` | 无（浏览器 API） |
| 停止录音 | `stopVoiceCapture()` | `POST /stt` (语音转文字) |
| 取消录音 | `cancelVoiceCapture()` | 无 |

**语音转文字流程:**
```typescript
async function stopVoiceCapture() {
  // 1. 停止录音
  const audio = await micRecorder.stop()
  
  // 2. 调用 STT API 转录
  const transcript = await transcribeSpeech({ audio, provider, language, prompt })
  
  // 3. 插入到输入框
  insertVoiceTranscriptIntoInput(transcript)
}
```

**后端接口:** `POST /stt`

---

### 4.2 停止按钮

**条件渲染:** `v-if="chatStore.isStreaming"`

```vue
<NButton
  v-if="chatStore.isStreaming"
  size="small"
  type="error"
  :disabled="chatStore.isAborting"
  @click="chatStore.stopStreaming()"
>
  {{ t('chat.stop') }}
</NButton>
```

**交互:**
| 操作 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击停止 | `chatStore.stopStreaming()` | Socket.IO `abort` |

---

### 4.3 发送按钮

```vue
<NButton
  size="small"
  type="primary"
  :disabled="!canSend"
  @click="handleSend"
>
  <template #icon>📤</template>
  {{ t('chat.send') }}
</NButton>
```

**交互:**
| 操作 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击发送 | `handleSend()` | Socket.IO `chat-run` |

**实现逻辑:**
```typescript
function handleSend() {
  const text = inputText.value.trim()
  if (!text && attachments.value.length === 0) return
  
  // 如果是 /skill 命令且没有附件，打开技能选择器
  if (isBridgeSession.value && text === '/skill' && attachments.value.length === 0) {
    void openSkillPicker()
    return
  }

  // 发送消息
  chatStore.sendMessage(text, attachments.value.length > 0 ? attachments.value : undefined)
  
  // 清空输入
  inputText.value = ''
  saveDraftForActiveSession('')
  attachments.value = []
  slashActive.value = false
  
  // 重置 textarea 高度
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}
```

---

## 5. 弹窗

### 5.1 Skill Picker Modal - 技能选择

```vue
<NModal v-model:show="showSkillPicker" :title="t('skills.title')" preset="card">
  <div class="skill-picker-modal">
    <input v-model="skillSearch" class="skill-picker-search" :placeholder="t('skills.searchPlaceholder')" type="search" />
    <div class="skill-picker-list">
      <div v-if="skillPickerLoading" class="skill-picker-empty">{{ t('common.loading') }}</div>
      <template v-else>
        <div
          v-for="skill in filteredSkillPickerItems"
          :key="skill.key"
          class="skill-picker-item"
          @click="selectSkill(skill)"
        >
          <div class="skill-picker-command">/skill {{ skill.commandName }}</div>
          <div class="skill-picker-name">{{ skill.name }}</div>
          <div class="skill-picker-desc">{{ skill.description }}</div>
        </div>
      </template>
    </div>
  </div>
</NModal>
```

**交互:**
| 操作 | 处理函数 | 后端接口 |
|------|----------|----------|
| 打开弹窗 | `openSkillPicker()` | `GET /skills` |
| 搜索技能 | `skillSearch` v-model | 无（本地过滤） |
| 选择技能 | `selectSkill(skill)` | 无（插入到输入框） |

**技能列表加载:**
```typescript
async function loadSkills() {
  if (!isBridgeSession.value) return
  const key = currentSkillsKey()
  if (skillsLoadedKey === key || skillsLoadRequest) return skillsLoadRequest
  
  skillsLoadRequest = (async () => {
    try {
      const data = await fetchSkills(key)
      skillCategories.value = data.categories || []
      skillsLoadedKey = key
    } catch {
      skillCategories.value = []
      skillsLoadedKey = key
    }
  })()
  
  return skillsLoadRequest
}
```

**后端接口:** `GET /skills`

---

### 5.2 Context Edit Modal - 上下文限制编辑

```vue
<NModal v-model:show="showContextEditModal" :title="t('chat.contextEditTitle')" preset="card">
  <div class="context-edit-content">
    <p>{{ t('chat.contextEditDesc') }}</p>
    <NInputNumber
      v-model:value="editingContextLimit"
      :min="1000"
      :max="10000000"
      :step="1000"
      :show-button="false"
    >
      <template #suffix>tokens</template>
    </NInputNumber>
    <div>{{ t('chat.contextEditHint') }}</div>
  </div>
  <template #footer>
    <NButton @click="showContextEditModal = false">取消</NButton>
    <NButton type="primary" @click="saveContextLimit" :loading="isSavingContextLimit">保存</NButton>
  </template>
</NModal>
```

**交互:**
| 操作 | 处理函数 | 后端接口 |
|------|----------|----------|
| 打开弹窗 | `handleEditContextLimit()` | `GET /model-context` |
| 保存设置 | `saveContextLimit()` | `PUT /model-context` |

**实现逻辑:**
```typescript
async function saveContextLimit() {
  if (!editingContextLimit.value || editingContextLimit.value <= 0) {
    message.error(t('chat.contextEditInvalid'))
    return
  }

  isSavingContextLimit.value = true
  try {
    const provider = chatStore.activeSession?.provider || appStore.selectedProvider || ''
    const model = chatStore.activeSession?.model || appStore.selectedModel || ''

    await setModelContext(provider, model, editingContextLimit.value)
    contextLength.value = editingContextLimit.value
    showContextEditModal.value = false
    message.success(t('chat.contextEditSuccess'))
  } catch (err: any) {
    message.error(`${t('chat.contextEditFailed')}: ${err.message || ''}`)
  } finally {
    isSavingContextLimit.value = false
  }
}
```

**后端接口:**
| 方法 | 路径 | 用途 |
|------|------|------|
| `GET` | `/model-context` | 获取当前上下文长度 |
| `PUT` | `/model-context` | 设置上下文长度限制 |

---

## 草稿保存

**功能:** 自动保存每个会话的输入草稿

```typescript
const DRAFT_STORAGE_KEY = 'yi_chat_input_drafts_v1'

function readDraftMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveDraftForActiveSession(value: string) {
  const sessionId = getActiveDraftSessionId()
  if (!sessionId) return
  const drafts = readDraftMap()
  if (value) {
    drafts[sessionId] = value
  } else {
    delete drafts[sessionId]
  }
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts))
}

function loadDraftForActiveSession() {
  const sessionId = getActiveDraftSessionId()
  inputText.value = sessionId ? readDraftMap()[sessionId] || '' : ''
}
```

**监听:**
```typescript
watch(inputText, (value) => {
  saveDraftForActiveSession(value)
})

watch(() => chatStore.activeSession?.id, () => {
  loadDraftForActiveSession()
})
```

**后端接口:** 无（本地 localStorage）

---

## 后端接口汇总

| 方法 | 路径 | 用途 | 触发位置 |
|------|------|------|----------|
| `POST` | `/upload` | 上传附件 | 附件按钮、粘贴、拖拽 |
| `POST` | `/stt` | 语音转文字 | 语音输入停止 |
| `GET` | `/skills` | 获取技能列表 | Skill Picker 打开 |
| `GET` | `/model-context` | 获取上下文长度 | Context Edit Modal 打开 |
| `PUT` | `/model-context` | 设置上下文长度 | Context Edit Modal 保存 |

## Socket.IO 事件

| 事件 | 方向 | 用途 | 触发位置 |
|------|------|------|----------|
| `chat-run` | Client → Server | 发送消息 | 发送按钮、Enter |
| `abort` | Client → Server | 中止运行 | 停止按钮 |
