# ChatView 页面详细规范

> 基于前端组件分析，定义 `/yi/chat` 页面每个组件的功能、交互和后端接口需求。

---

## 目录

1. [组件层级总览](#组件层级总览)
2. [ChatView.vue - 视图入口](#1-chatviewvue---视图入口)
3. [ChatPanel.vue - 主面板](#2-chatpanelvue---主面板)
4. [SessionListItem.vue - 会话列表项](#3-sessionlistitemvue---会话列表项)
5. [MessageList.vue - 消息列表容器](#4-messagelistvue---消息列表容器)
6. [VirtualMessageList.vue - 虚拟滚动列表](#5-virtualmessagelistvue---虚拟滚动列表)
7. [MessageItem.vue - 单条消息](#6-messageitemvue---单条消息)
8. [ChatInput.vue - 输入框](#7-chatinputvue---输入框)
9. [MarkdownRenderer.vue - Markdown 渲染](#8-markdownrenderervue---markdown-渲染)
10. [OutlinePanel.vue - 大纲面板](#9-outlinepanelvue---大纲面板)
11. [FilesPanel.vue - 文件面板](#10-filespanelvue---文件面板)
12. [TerminalPanel.vue - 终端面板](#11-terminalpanelvue---终端面板)
13. [DrawerPanel.vue - 抽屉面板](#12-drawerpanelvue---抽屉面板)
14. [SessionSearchModal.vue - 搜索弹窗](#13-sessionsearchmodalvue---搜索弹窗)
15. [VoiceDialogueControls.vue - 语音控制](#14-voicedialoguecontrolsvue---语音控制)
16. [VoiceTranscriptOverlay.vue - 语音转录覆盖层](#15-voicetranscriptoverlayvue---语音转录覆盖层)
17. [后端接口需求汇总](#后端接口需求汇总)

---

## 组件层级总览

```
ChatView.vue (视图入口)
└── ChatPanel.vue (主面板)
    │
    ├── [侧边栏]
    │   ├── PageSidebarNav (导航)
    │   ├── NInput (搜索框)
    │   ├── NSelect (分组过滤)
    │   ├── SessionListItem[] (会话列表)
    │   └── NDropdown (右键菜单)
    │
    ├── [弹窗]
    │   ├── NModal (重命名)
    │   ├── NModal (工作区设置)
    │   ├── NModal (模型选择)
    │   ├── NModal (API 模式)
    │   └── NDrawer (新建对话)
    │
    ├── [聊天区域]
    │   ├── MessageList.vue (消息列表容器)
    │   │   ├── VirtualMessageList.vue (虚拟滚动)
    │   │   ├── MessageItem.vue (单条消息)
    │   │   ├── 审批/澄清浮动面板
    │   │   └── 队列消息面板
    │   │
    │   └── ChatInput.vue (输入框)
    │       ├── CharacterSelector (角色选择)
    │       ├── YiModelSelector (模型选择)
    │       ├── VoiceDialogueControls.vue (语音控制)
    │       └── VoiceTranscriptOverlay.vue (语音转录)
    │
    └── [右侧面板]
        ├── OutlinePanel.vue (大纲)
        ├── FilesPanel.vue (文件)
        └── TerminalPanel.vue (终端)
```

---

## 1. ChatView.vue - 视图入口

**文件路径:** `apps/client/src/views/yi/ChatView.vue`

**职责:** 页面入口，初始化加载，路由参数处理

### 初始化流程

```
onMounted:
  1. chatStore.setRuntimeMode('default')
  2. appStore.loadModels()
  3. profilesStore.fetchProfiles()
  4. settingsStore.fetchSettings()
  5. chatStore.loadSessions()
  6. loadRouteSession() — 根据 URL 中的 sessionId 切换会话
```

### 路由参数处理

| 参数 | 处理 |
|------|------|
| `route.params.sessionId` | 存在则调用 `chatStore.switchSession(sessionId)` |
| `route.params.profile` | 作为 profile filter |

### 监听的路由变化

```typescript
watch([routeSessionId, routeProfile], () => {
  loadRouteSession()
})
```

### 依赖的 Store 方法

| Store | 方法 | 用途 |
|-------|------|------|
| `useAppStore` | `loadModels()` | 加载模型列表 |
| `useChatStore` | `setRuntimeMode()` | 设置运行模式 |
| `useChatStore` | `loadSessions()` | 加载会话列表 |
| `useChatStore` | `switchSession()` | 切换会话 |
| `useProfilesStore` | `fetchProfiles()` | 加载 profiles |
| `useSettingsStore` | `fetchSettings()` | 加载设置 |

### 后端接口需求

| 接口 | 说明 |
|------|------|
| `GET /models` | 通过 `appStore.loadModels()` 加载 |
| `GET /sessions` | 通过 `chatStore.loadSessions()` 加载 |
| `GET /config` | 通过 `settingsStore.fetchSettings()` 加载 |

---

## 2. ChatPanel.vue - 主面板

**文件路径:** `apps/client/src/components/yi/chat/ChatPanel.vue`

**职责:** 聊天页面的核心组件，包含侧边栏、聊天区域、右侧面板

### 组件结构

```vue
<template>
  <!-- 侧边栏 -->
  <aside v-show="showSessions">
    <PageSidebarNav @primary="quickNewChat" />
    <NInput v-model="sidebarSearch" placeholder="搜索对话" />
    <NSelect v-model="sidebarFilter" />
    <SessionListItem v-for="session in filteredSessions" />
    <NDropdown :options="contextMenuOptions" />
  </aside>

  <!-- 聊天区域 -->
  <main>
    <!-- 顶栏 -->
    <header>
      <NButton @click="showSessions = !showSessions" />
      <NButton @click="openActiveSessionWorkspace" />
      <NButton @click="showToolPanel = !showToolPanel" />
      <NButton @click="showOutline = !showOutline" />
    </header>

    <!-- 消息列表 -->
    <MessageList ref="messageListRef" />

    <!-- 输入框 -->
    <ChatInput ref="chatInputRef" />
  </main>

  <!-- 右侧面板 -->
  <aside v-show="showOutline || showToolPanel">
    <OutlinePanel v-if="showOutline" />
    <DrawerPanel v-if="showToolPanel" />
  </aside>
</template>
```

### 用户交互与后端接口

#### 侧边栏操作

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 新建对话按钮 | `quickNewChat()` | 本地创建，首次发消息时持久化 |
| 搜索框输入 | `sidebarSearch` v-model | 本地过滤，无需后端 |
| 分组过滤下拉 | `sidebarFilter` v-model | 本地过滤，无需后端 |
| 点击会话项 | `handleSessionClick()` | `GET /sessions/:id/messages` |
| 右键会话项 | `handleContextMenu()` | 显示右键菜单 |
| 删除会话 | `handleDeleteSession()` | `DELETE /sessions/:id` |

#### 右键菜单操作

| 菜单项 | 处理函数 | 后端接口 |
|--------|----------|----------|
| 置顶/取消置顶 | `handlePinSession()` | 本地 localStorage，无需后端 |
| 重命名 | `showRenameModal()` | `PUT /sessions/:id/rename` |
| 设置工作区 | `showWorkspaceModal()` | `PUT /sessions/:id/workspace` |
| 设置模型 | `showModelModal()` | `PUT /sessions/:id/model` |
| 导出 | `handleExport()` | `GET /sessions/:id/export` |
| 复制链接 | `handleCopyLink()` | 本地 URL 拼接，无需后端 |

#### 重命名弹窗

```vue
<NModal v-model:show="showRenameModalVisible">
  <NInput v-model="renameValue" />
  <NButton @click="handleRenameConfirm()">确认</NButton>
</NModal>
```

| 交互 | 后端接口 |
|------|----------|
| 确认重命名 | `PUT /sessions/:id` Body: `{ title: renameValue }` |

#### 工作区设置弹窗

```vue
<NModal v-model:show="showWorkspaceModalVisible">
  <FolderPicker v-model="workspaceValue" />
  <NButton @click="handleWorkspaceConfirm()">确认</NButton>
</NModal>
```

| 交互 | 后端接口 |
|------|----------|
| 确认设置工作区 | `PUT /sessions/:id/workspace` Body: `{ workspace: workspaceValue }` |

#### 模型选择弹窗

```vue
<NModal v-model:show="showModelModalVisible">
  <YiModelSelector v-model="selectedSessionModel" />
  <NPopselect v-model="codingAgentApiMode" />
  <NButton @click="selectSessionModel()">确认</NButton>
</NModal>
```

| 交互 | 后端接口 |
|------|----------|
| 选择模型确认 | `PUT /sessions/:id/model` Body: `{ model, provider, apiMode }` |

#### 新建对话抽屉

```vue
<NDrawer v-model:show="showNewChatDrawer">
  <NDrawerContent>
    <NSelect v-model="newChatAgent" />
    <FolderPicker v-model="newChatWorkspace" />
    <NButton @click="confirmNewChat()">创建</NButton>
  </NDrawerContent>
</NDrawer>
```

| 交互 | 后端接口 |
|------|----------|
| 确认创建 | 本地创建 session 对象，首次发消息时持久化 |

#### 批量删除

| 交互 | 后端接口 |
|------|----------|
| 批量删除按钮 | `POST /sessions/batch-delete` Body: `{ targets: [...] }` |

#### 文件拖拽上传

| 交互 | 后端接口 |
|------|----------|
| 拖拽文件到聊天区域 | `POST /upload` FormData |

### 依赖的 API 模块

| API 模块 | 用途 |
|----------|------|
| `@/api/yi/sessions` | `renameSession()`, `setSessionWorkspace()`, `batchDeleteSessions()`, `exportSession()` |
| `@/api/coding-agents` | `fetchCodingAgentsStatus()` |
| `@/api/yi/files` | 文件上传 |

---

## 3. SessionListItem.vue - 会话列表项

**文件路径:** `apps/client/src/components/yi/chat/SessionListItem.vue`

**职责:** 显示单个会话的摘要信息

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `session` | `Session` | 会话对象 |
| `active` | `boolean` | 是否为当前选中 |
| `pinned` | `boolean` | 是否置顶 |
| `canDelete` | `boolean` | 是否可删除 |
| `streaming` | `boolean` | 是否正在流式输出 |
| `completedUnread` | `boolean` | 是否有未读完成消息 |
| `selectable` | `boolean` | 是否可批量选择 |
| `selected` | `boolean` | 批量选中状态 |
| `showProfile` | `boolean` | 是否显示 profile 名称 |

### Emits

| Event | 参数 | 说明 |
|-------|------|------|
| `select` | 无 | 点击选择会话 |
| `contextmenu` | `event: MouseEvent` | 右键菜单 |
| `delete` | 无 | 删除会话 |
| `toggle-select` | 无 | 切换批量选中 |

### 显示内容

```
┌─────────────────────────────────┐
│ 📌 [置顶图标]                    │
│ 会话标题                         │
│ 模型名称 | 时间 | 消息数         │
│ [流式动画] [未读标记]            │
└─────────────────────────────────┘
```

### 交互

| 交互 | 处理 |
|------|------|
| 点击 | `emit('select')` |
| 右键 | `emit('contextmenu')` |
| 长按 (移动端 500ms) | `emit('contextmenu')` |
| 批量模式点击 checkbox | `emit('toggle-select')` |
| 删除按钮 | `emit('delete')` |

### 后端接口需求

无直接 API 调用，数据来自父组件传入的 `session` prop。

---

## 4. MessageList.vue - 消息列表容器

**文件路径:** `apps/client/src/components/yi/chat/MessageList.vue`

**职责:** 管理消息列表的滚动、加载更多、审批/澄清交互

### 数据流

```
useChatStore.messages → VirtualMessageList → MessageItem[]
useChatStore.activePendingApproval → 审批面板
useChatStore.activePendingClarify → 澄清面板
useChatStore.queuedUserMessages → 队列消息面板
```

### 用户交互与后端接口

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 滚动到顶部 | `handleTopReach()` | `GET /sessions/:id/messages?offset=N` |
| 滚动到底部按钮 | `handleScrollBottomClick()` | 无（本地滚动） |
| 审批按钮 (once) | `handleApproval('once')` | Socket.IO `approval.respond` |
| 审批按钮 (session) | `handleApproval('session')` | Socket.IO `approval.respond` |
| 审批按钮 (always) | `handleApproval('always')` | Socket.IO `approval.respond` |
| 审批按钮 (deny) | `handleApproval('deny')` | Socket.IO `approval.respond` |
| 澄清输入框提交 | `handleClarify()` | Socket.IO `clarify.respond` |
| 澄清选项按钮 | `handleClarify(choice)` | Socket.IO `clarify.respond` |
| 队列消息移除 | `removeQueuedMessage()` | Socket.IO `cancel_queued_run` |
| Fork 分隔符链接 | `openForkParent()` | `GET /sessions/:parentId` |

### 加载更多消息

```typescript
async function loadOlderMessages() {
  const offset = target.loadedMessageCount || 0
  const page = await fetchSessionMessagesPage(sessionId, offset, 150)
  // 合并到现有消息列表
}
```

### 暴露的方法

| 方法 | 说明 |
|------|------|
| `scrollToBottom()` | 滚动到底部 |
| `scrollToMessage(messageId)` | 滚动到指定消息 |
| `scrollToAnchor(anchorId)` | 滚动到锚点 |

---

## 5. VirtualMessageList.vue - 虚拟滚动列表

**文件路径:** `apps/client/src/components/yi/chat/VirtualMessageList.vue`

**职责:** 高性能虚拟滚动，仅渲染可见区域的消息

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `messages` | `VirtualItem[]` | required | 消息列表 |
| `virtualized` | `boolean` | `true` | 是否启用虚拟滚动 |
| `estimatedItemHeight` | `number` | `180` | 预估每项高度 |
| `overscan` | `number` | `8` | 预渲染数量 |
| `rowGap` | `number` | `16` | 行间距 |
| `padding` | `string` | `"20px"` | 内边距 |
| `topThreshold` | `number` | `120` | 触发加载更多的阈值 |

### Emits

| Event | 说明 |
|-------|------|
| `scroll` | 滚动事件 |
| `topReach` | 触达顶部（触发加载更多） |

### 暴露的方法

| 方法 | 说明 |
|------|------|
| `isNearBottom()` | 是否接近底部 |
| `shouldAutoFollowBottom()` | 是否应自动跟随到底部 |
| `scrollToBottom()` | 滚动到底部 |
| `scrollToMessage(id)` | 滚动到消息 |
| `scrollToAnchor(id)` | 滚动到锚点 |

### 后端接口需求

无直接 API 调用。

---

## 6. MessageItem.vue - 单条消息

**文件路径:** `apps/client/src/components/yi/chat/MessageItem.vue`

**职责:** 渲染单条消息（用户/助手/系统/工具）

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `message` | `Message` | 消息对象 |
| `highlight` | `boolean` | 是否高亮 |
| `headingIdPrefix` | `string` | 标题 ID 前缀 |
| `showForkAction` | `boolean` | 是否显示 Fork 按钮 |

### 消息类型与显示

| role | 显示样式 |
|------|----------|
| `user` | 用户头像 + 气泡 + 附件 |
| `assistant` | 助手头像 + Markdown 渲染 + 思考过程 |
| `system` | 系统消息样式 |
| `tool` | 工具调用详情（可展开/折叠） |
| `command` | 命令消息样式 |

### 用户交互与后端接口

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 展开/折叠工具详情 | `toolExpanded = !toolExpanded` | 无 |
| 复制工具参数/结果 | `handleToolDetailClick()` | 无 |
| 预览附件图片 | `previewUrl = att.url` | 无 |
| 下载附件文件 | `handleAttachmentDownload()` | `GET /download?path=...` |
| 展开/折叠思考过程 | `toggleThinking()` | 无 |
| 预览 ContentBlock 图片 | `previewUrl = getContentFileUrl()` | 无 |
| 下载 ContentBlock 文件 | `downloadFile()` | `GET /download?path=...` |
| 语音播放按钮 | `handleSpeechToggle()` | TTS API |
| 复制消息内容 | `copyBubbleContent()` | 无 |
| Fork 对话 | `forkFromCurrentTail()` | Socket.IO `chat-run` (fork 命令) |
| 关闭图片预览 | `previewUrl = null` | 无 |

### 工具消息显示

```
┌─────────────────────────────────┐
│ 🔧 tool_name          [▶ 展开] │
├─────────────────────────────────┤
│ 参数:                           │
│ { "path": "/file.txt" }        │
│                                 │
│ 结果:                           │
│ File content...                 │
└─────────────────────────────────┘
```

### 思考过程显示

```
┌─────────────────────────────────┐
│ 💭 思考过程 [展开/折叠]         │
├─────────────────────────────────┤
│ 让我分析这个问题...             │
│ 首先需要理解...                 │
└─────────────────────────────────┘
```

### 依赖的 API

| API | 用途 |
|-----|------|
| `getDownloadUrl()` | 获取文件下载 URL |
| `downloadFile()` | 下载文件 |

---

## 7. ChatInput.vue - 输入框

**文件路径:** `apps/client/src/components/yi/chat/ChatInput.vue`

**职责:** 消息输入、文件上传、语音输入、模型/角色选择

### 组件结构

```vue
<template>
  <!-- 角色选择器 -->
  <CharacterSelector />

  <!-- 工具栏 -->
  <div class="toolbar">
    <NButton @click="handleAttachClick" /> <!-- 附件 -->
    <YiModelSelector /> <!-- 模型选择 -->
    <NPopselect @update:value="onReasoningEffortChange" /> <!-- 推理强度 -->
    <NSwitch v-model="autoPlaySpeech" /> <!-- 自动语音 -->
    <NButton @click="toggleToolTraceVisible" /> <!-- 工具追踪 -->
  </div>

  <!-- 附件预览 -->
  <div v-for="att in attachments">
    <img :src="att.url" />
    <NButton @click="removeAttachment(att.id)" />
  </div>

  <!-- 输入区域 -->
  <div class="input-area">
    <textarea
      @keydown="handleKeydown"
      @input="handleInput"
      @paste="handlePaste"
    />
    <VoiceDialogueControls />
    <NButton @click="handleSend" /> <!-- 发送 -->
    <NButton @click="chatStore.stopStreaming" /> <!-- 停止 -->
  </div>

  <!-- Skill Picker -->
  <NModal v-model:show="showSkillPicker">
    <NInput v-model="skillSearch" />
    <div v-for="skill in filteredSkills" @click="selectSkill" />
  </NModal>
</template>
```

### 用户交互与后端接口

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 发送消息 (Enter) | `handleSend()` | Socket.IO `chat-run` |
| 发送消息 (按钮) | `handleSend()` | Socket.IO `chat-run` |
| 停止生成 | `chatStore.stopStreaming()` | Socket.IO `abort` |
| 点击附件按钮 | `handleAttachClick()` | 无（打开文件选择器） |
| 选择文件 | 文件 change 事件 | `POST /upload` |
| 粘贴图片 | `handlePaste()` | `POST /upload` |
| 拖拽文件 | `handleDragDrop()` | `POST /upload` |
| 搜索 Skills | `skillSearch` v-model | `GET /skills` |
| 选择 Skill | `selectSkill()` | 无（插入到输入框） |
| 语音录制 | `startVoiceCapture()` | 无（浏览器 API） |
| 语音转文字 | 语音录制完成 | `POST /stt` (Speech-to-Text) |
| 编辑上下文限制 | `handleEditContextLimit()` | `GET /model-context` |
| 保存上下文限制 | `saveContextLimit()` | `PUT /model-context` |

### Slash 命令

输入 `/` 时显示命令列表：

| 命令 | 说明 |
|------|------|
| `/compress` | 压缩上下文 |
| `/clear` | 清空消息 |
| `/plan` | 切换到计划模式 |
| `/fork` | Fork 当前对话 |
| `/skill` | 选择 Skill |

### 发送消息的数据结构

```typescript
const runPayload: StartRunRequest = {
  input: content, // string | ContentBlock[]
  session_id: sessionId,
  profile: profileName,
  model: selectedModel,
  provider: selectedProvider,
  model_groups: [...],
  source: 'cli',
  queue_id: userMsg.id,
  workspace: session.workspace,
}
```

### 暴露的方法

| 方法 | 说明 |
|------|------|
| `addFiles(files)` | 添加文件附件 |

### 依赖的 API

| API | 用途 |
|-----|------|
| `fetchContextLength()` | 获取上下文长度 |
| `setModelContext()` | 设置上下文限制 |
| `fetchSkills()` | 获取 Skills 列表 |
| `transcribeSpeech()` | 语音转文字 |

---

## 8. MarkdownRenderer.vue - Markdown 渲染

**文件路径:** `apps/client/src/components/yi/chat/MarkdownRenderer.vue`

**职责:** 渲染 Markdown 内容，支持代码高亮、LaTeX、Mermaid

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `content` | `string` | Markdown 内容 |
| `mentionNames` | `string[]` | @提及的名称列表 |
| `headingIdPrefix` | `string` | 标题 ID 前缀 |

### 渲染特性

| 特性 | 实现 |
|------|------|
| 代码高亮 | highlight.js |
| LaTeX 公式 | KaTeX |
| Mermaid 图表 | mermaid.js |
| 表格 | markdown-it |
| 链接 | 新窗口打开 |
| 图片 | 点击预览 |

### 用户交互与后端接口

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击代码块 | 复制到剪贴板 | 无 |
| 点击图片 | 预览大图 | 无 |
| 点击文件链接 | 下载文件 | `GET /download?path=...` |
| 点击链接 | 新窗口打开 | 无 |
| 点击文件预览 | 打开文件预览 | `GET /files/read?path=...` |

### 后端接口需求

| 接口 | 用途 |
|------|------|
| `GET /download` | 下载本地文件 |
| `GET /files/read` | 获取文件内容用于预览 |

---

## 9. OutlinePanel.vue - 大纲面板

**文件路径:** `apps/client/src/components/yi/chat/OutlinePanel.vue`

**职责:** 显示消息大纲，支持快速导航

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `messages` | `Message[]` | 消息列表 |

### Emits

| Event | 参数 | 说明 |
|-------|------|------|
| `navigate` | `{ messageId, anchorId }` | 导航到指定位置 |

### 大纲内容

从消息列表中提取：
1. **用户问题** — 所有 `role === 'user'` 的消息
2. **标题** — 助手回复中的 `##` 级标题

### 用户交互

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击用户问题 | `scrollToTarget(item)` | 无（滚动到消息） |
| 点击标题 | `scrollToTarget(item)` | 无（滚动到标题） |

### 后端接口需求

无。

---

## 10. FilesPanel.vue - 文件面板

**文件路径:** `apps/client/src/components/yi/chat/FilesPanel.vue`

**职责:** 在聊天侧边栏显示文件系统

### 组件结构

```vue
<template>
  <FileTree @select="handleFileSelect" />
  <FileToolbar
    @show-new-file="handleShowNewFile"
    @show-new-folder="handleShowNewFolder"
    @show-upload="showUpload = true"
  />
  <FileBreadcrumb />
  <FileEditor v-if="editingFile" />
  <FilePreview v-else-if="previewFile" />
  <FileList v-else @contextmenu-entry="handleContextMenu" />
  <FileContextMenu @rename="handleRename" @new-folder="handleContextNewFolder" />
  <FileUploadModal v-model:show="showUpload" />
  <FileRenameModal v-model:show="showRenameModal" />
</template>
```

### 用户交互与后端接口

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击目录 | `handleFileSelect()` | `GET /files/list?path=...` |
| 点击文件 | `handleFileSelect()` | `GET /files/read?path=...` |
| 新建文件 | `handleShowNewFile()` | `PUT /files/write` |
| 新建文件夹 | `handleShowNewFolder()` | `POST /files/mkdir` |
| 上传文件 | `showUpload = true` | `POST /files/upload` |
| 重命名 | `handleRename()` | `POST /files/rename` |
| 删除 | `handleDelete()` | `DELETE /files/delete` |
| 下载 | `handleDownload()` | `GET /download?path=...` |

### 后端接口汇总

| 接口 | 用途 |
|------|------|
| `GET /files/list` | 浏览目录 |
| `GET /files/read` | 读取文件 |
| `PUT /files/write` | 写入文件 |
| `POST /files/mkdir` | 创建目录 |
| `POST /files/rename` | 重命名 |
| `DELETE /files/delete` | 删除文件/目录 |
| `POST /files/upload` | 上传文件 |
| `GET /download` | 下载文件 |

---

## 11. TerminalPanel.vue - 终端面板

**文件路径:** `apps/client/src/components/yi/chat/TerminalPanel.vue`

**职责:** 在聊天侧边栏提供 Web 终端

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `visible` | `boolean` | 是否可见 |
| `initialCommand` | `string` | 初始命令 |

### WebSocket 通信

```
连接: ws://localhost:3001/api/yi/terminal?token=xxx

客户端发送:
  { type: "create" }
  { type: "switch", sessionId }
  { type: "close", sessionId }
  { type: "input", data }
  { type: "resize", cols, rows }

服务端发送:
  { type: "created", id, shell, pid }
  { type: "output", id, data }
  { type: "exited", id, exitCode }
  { type: "error", message }
```

### 用户交互与后端接口

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 创建新终端 | `createSession()` | WebSocket `create` |
| 切换终端 | `switchSession(id)` | WebSocket `switch` |
| 关闭终端 | `closeSession(id)` | WebSocket `close` |
| 键盘输入 | xterm.js onKey | WebSocket `input` |
| 窗口调整 | xterm.js onResize | WebSocket `resize` |
| 切换主题 | `applyTheme()` | 无（本地） |
| 重试连接 | `connect()` | WebSocket 重新连接 |

### 后端接口汇总

| 接口 | 用途 |
|------|------|
| WebSocket `/api/yi/terminal` | 终端实时通信 |

---

## 12. DrawerPanel.vue - 抽屉面板

**文件路径:** `apps/client/src/components/yi/chat/DrawerPanel.vue`

**职责:** 容器组件，切换显示文件面板或终端面板

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `show` | `boolean` | 是否显示 |
| `activeTab` | `'terminal' \| 'files'` | 当前激活的 tab |

### Emits

| Event | 参数 | 说明 |
|-------|------|------|
| `update:show` | `boolean` | 关闭面板 |

### Tab 切换

| Tab | 显示组件 |
|-----|----------|
| Files | `FilesPanel` |
| Terminal | `TerminalPanel` |

### 后端接口需求

无（由子组件处理）。

---

## 13. SessionSearchModal.vue - 搜索弹窗

**文件路径:** `apps/client/src/components/yi/chat/SessionSearchModal.vue`

**职责:** 全局搜索会话

### 用户交互与后端接口

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 打开搜索 | 快捷键 Ctrl+K | 无 |
| 输入搜索词 | `runSearch()` | `GET /sessions?search=...` |
| 点击结果 | `openItem(item)` | `GET /sessions/:id/messages` |
| 键盘导航 | ArrowUp/Down | 无 |
| 选择结果 | Enter | 无 |
| 关闭 | Escape | 无 |

### 后端接口汇总

| 接口 | 用途 |
|------|------|
| `GET /sessions` | 搜索会话 |
| `GET /sessions/:id` | 获取会话详情 |

---

## 14. VoiceDialogueControls.vue - 语音控制

**文件路径:** `apps/client/src/components/yi/chat/VoiceDialogueControls.vue`

**职责:** 语音输入的 UI 控制

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `status` | `VoiceDialogueStatus` | 当前状态 |
| `transcript` | `string` | 转录文本 |
| `error` | `string` | 错误信息 |
| `onStart` | `Function` | 开始录音回调 |
| `onStop` | `Function` | 停止录音回调 |
| `onCancel` | `Function` | 取消录音回调 |

### 用户交互

| 交互 | 处理函数 | 后端接口 |
|------|----------|----------|
| 点击麦克风 | `toggle()` | 无（调用 onStart/onStop） |
| 点击取消 | `cancel()` | 无（调用 onCancel） |

### 后端接口需求

无（由父组件处理语音逻辑）。

---

## 15. VoiceTranscriptOverlay.vue - 语音转录覆盖层

**文件路径:** `apps/client/src/components/yi/chat/VoiceTranscriptOverlay.vue`

**职责:** 显示语音转录状态的纯展示组件

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `status` | `VoiceDialogueStatus` | 当前状态 |
| `transcript` | `string` | 转录文本 |
| `error` | `string` | 错误信息 |
| `events` | `Event[]` | 事件列表 |
| `debug` | `boolean` | 是否显示调试信息 |

### 显示内容

```
┌─────────────────────────────────┐
│ 状态: 正在录音...                │
│ 转录: 你好，我想问一下...        │
│ [调试事件列表]                   │
└─────────────────────────────────┘
```

### 后端接口需求

无。

---

## 后端接口需求汇总

### HTTP API

| 方法 | 路径 | 用途 | 触发组件 |
|------|------|------|----------|
| `GET` | `/sessions` | 加载会话列表 | ChatView, ChatPanel, SessionSearchModal |
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
| `POST` | `/model-context` | 获取上下文长度 | ChatInput |
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
