# Yi Agent Studio - 后端 API 规范

> 基于前端界面和组件交互分析，定义后端需要实现的所有接口。

---

## 目录

1. [路由总览](#路由总览)
2. [页面详细分析](#页面详细分析)
   - [ChatView - 聊天](#1-chatview---聊天)
   - [ModelsView - 模型管理](#2-modelsview---模型管理)
   - [CharactersView - Agent 管理](#3-charactersview---agent-管理)
   - [SettingsView - 设置](#4-settingsview---设置)
   - [SkillsView - 技能管理](#5-skillsview---技能管理)
   - [FilesView - 文件管理](#6-filesview---文件管理)
   - [McpManagerView - MCP 管理](#7-mcpmanagerview---mcp-管理)
   - [WorkflowView - 工作流](#8-workflowview---工作流)
   - [GroupChatView - 群聊](#9-groupchatview---群聊)
   - [JobsView - 定时任务](#10-jobsview---定时任务)
   - [KanbanView - 看板](#11-kanbanview---看板)
   - [LogsView - 日志](#12-logsview---日志)
   - [UsageView - 用量统计](#13-usageview---用量统计)
   - [TerminalView - 终端](#14-terminalview---终端)
3. [Socket.IO 事件规范](#socketio-事件规范)
4. [数据模型](#数据模型)

---

## 路由总览

| 路由 | 视图 | 说明 |
|------|------|------|
| `/yi/chat` | ChatView | 聊天页面 |
| `/yi/session/:sessionId` | ChatView | 会话详情 |
| `/yi/models` | ModelsView | 模型管理 |
| `/yi/characters` | CharactersView | Agent 管理 |
| `/yi/settings` | SettingsView | 设置 |
| `/yi/skills` | SkillsView | 技能管理 |
| `/yi/files` | FilesView | 文件管理 |
| `/yi/mcp` | McpManagerView | MCP 管理 |
| `/yi/workflow` | WorkflowView | 工作流 |
| `/yi/group-chat` | GroupChatView | 群聊 |
| `/yi/jobs` | JobsView | 定时任务 |
| `/yi/kanban` | KanbanView | 看板 |
| `/yi/logs` | LogsView | 日志 |
| `/yi/usage` | UsageView | 用量统计 |
| `/yi/terminal` | TerminalView | 终端 |
| `/yi/history` | HistoryView | 历史记录 |

---

## 页面详细分析

---

### 1. ChatView - 聊天

**路由**: `/yi/chat`, `/yi/session/:sessionId`

**使用的 Store**: `useAppStore`, `useChatStore`, `useProfilesStore`, `useSettingsStore`

#### 组件树

```
ChatView.vue
└── ChatPanel.vue
    ├── SessionListItem.vue (会话列表项)
    ├── MessageList.vue / VirtualMessageList.vue (消息列表)
    ├── ChatInput.vue (输入框)
    ├── OutlinePanel.vue (大纲面板)
    ├── FilesPanel.vue (文件面板)
    ├── TerminalPanel.vue (终端面板)
    └── DrawerPanel.vue (抽屉面板)
```

#### 用户交互与后端接口

| 组件 | 交互 | 触发方式 | 后端接口 |
|------|------|----------|----------|
| ChatPanel | 加载会话列表 | onMounted | `GET /sessions` |
| ChatPanel | 新建对话 | 点击按钮 | 本地创建，首次发消息时持久化 |
| ChatPanel | 删除会话 | 右键菜单 | `DELETE /sessions/:id` |
| ChatPanel | 批量删除 | 批量模式 | `POST /sessions/batch-delete` |
| ChatPanel | 重命名会话 | 右键菜单 | `PUT /sessions/:id/rename` |
| ChatPanel | 设置工作目录 | 右键菜单 | `PUT /sessions/:id/workspace` |
| ChatPanel | 切换模型 | 右键菜单 | `PUT /sessions/:id/model` |
| ChatPanel | 导出对话 | 右键菜单 | `GET /sessions/:id/export` |
| ChatPanel | 加载更多消息 | 滚动顶部 | `GET /sessions/:id/messages?offset=N` |
| ChatInput | 发送消息 | Enter/按钮 | Socket.IO `chat-run` |
| ChatInput | 上传附件 | 拖拽/按钮 | `POST /upload` |
| ChatInput | 中断生成 | 停止按钮 | Socket.IO `abort` |
| ChatInput | 工具审批 | 审批弹窗 | Socket.IO `approval.respond` |
| ChatInput | 澄清回复 | 澄清弹窗 | Socket.IO `clarify.respond` |

#### 接口详细定义

**会话管理**

```
GET /sessions
Query: profile?: string
Response: SessionSummary[]

GET /sessions/:id
Query: profile?: string
Response: SessionDetail

GET /sessions/:id/messages
Query: offset?: number, limit?: number, profile?: string
Response: { session, messages: YiMessage[], total, offset, limit, hasMore }

DELETE /sessions/:id
Query: profile?: string
Response: { ok: boolean }

POST /sessions/batch-delete
Body: { targets: { id: string, profile?: string }[] }
Response: { deleted: number, failed: number, errors: any[] }

PUT /sessions/:id/rename
Body: { title: string }
Response: { ok: boolean }

PUT /sessions/:id/workspace
Body: { workspace: string }
Response: { ok: boolean }

PUT /sessions/:id/model
Body: { model: string, provider: string, apiMode?: string }
Response: { ok: boolean }

GET /sessions/:id/export
Query: format?: 'json' | 'txt', mode?: 'full' | 'compressed'
Response: 文件下载
```

**文件上传**

```
POST /upload
Body: FormData (files)
Headers: X-Yi-Profile?: string
Response: { files: { name: string, path: string }[] }
```

---

### 2. ModelsView - 模型管理

**路由**: `/yi/models`

**使用的 Store**: `useModelsStore`

#### 组件树

```
ModelsView.vue
└── ProvidersPanel.vue
    ├── ProviderCard.vue (Provider 卡片)
    ├── ProviderFormModal.vue (编辑表单)
    ├── AddProviderModal.vue (添加表单)
    └── AuxiliaryModelsPanel.vue (辅助模型配置)
```

#### 用户交互与后端接口

| 组件 | 交互 | 触发方式 | 后端接口 |
|------|------|----------|----------|
| ProvidersPanel | 加载 Provider 列表 | onMounted | `GET /models` |
| AddProviderModal | 添加 Provider | 保存按钮 | `POST /models` |
| ProviderFormModal | 编辑 Provider | 保存按钮 | `PUT /models/:id` |
| ProviderCard | 删除 Provider | 删除按钮 | `DELETE /models/:id` |
| ProviderCard | 拉取模型列表 | 拉取按钮 | `GET /proxy?url=.../v1/models` |
| ProviderCard | 切换模型可见性 | Switch | `PUT /models/:id` |

#### 接口详细定义

```
GET /models
Response: Provider[]

POST /models
Body: { name, baseUrl, apiKey, models, ... }
Response: Provider

PUT /models/:id
Body: Partial<Provider>
Response: Provider

DELETE /models/:id
Response: { ok: boolean }

GET /proxy
Query: url: string
Headers: Authorization?: string
Response: 代理请求的响应
```

---

### 3. CharactersView - Agent 管理

**路由**: `/yi/characters`

**使用的 Store**: `useCharactersStore`

#### 组件树

```
CharactersView.vue
├── CharacterList.vue (角色列表)
├── CharacterForm.vue (角色表单)
└── CharacterSelector.vue (角色选择器)
```

#### 用户交互与后端接口

| 组件 | 交互 | 触发方式 | 后端接口 |
|------|------|----------|----------|
| CharacterList | 加载角色列表 | onMounted | `GET /characters` |
| CharacterList | 创建角色 | 新建按钮 | `POST /characters` |
| CharacterForm | 编辑角色 | 保存按钮 | `PUT /characters/:id` |
| CharacterForm | 删除角色 | 删除按钮 | `DELETE /characters/:id` |
| CharacterForm | 加载角色内容 | 打开表单 | `GET /characters/:id/content` |
| CharacterForm | 保存角色内容 | 保存按钮 | `POST /characters/:id/content` |

#### 接口详细定义

```
GET /characters
Response: CharacterMeta[]

POST /characters
Body: { name, description, avatar, color, model, provider, tools, permissions, ... }
Response: CharacterMeta

PUT /characters/:id
Body: Partial<CharacterMeta>
Response: CharacterMeta

DELETE /characters/:id
Response: { ok: boolean }

GET /characters/:id/content
Response: { soul: string, memory: string, user: string }

POST /characters/:id/content
Body: { section: 'soul' | 'memory' | 'user', content: string }
Response: { soul: string, memory: string, user: string }
```

---

### 4. SettingsView - 设置

**路由**: `/yi/settings`

**使用的 Store**: `useSettingsStore`, `useProfilesStore`

#### 组件树

```
SettingsView.vue
├── AccountSettings.vue (账户设置)
├── UserManagementSettings.vue (用户管理)
├── DisplaySettings.vue (显示设置)
├── AgentSettings.vue (Agent 设置)
├── GatewayAutoStartSettings.vue (网关设置)
├── MemorySettings.vue (记忆设置)
├── CompressionSettings.vue (压缩设置)
├── SessionSettings.vue (会话设置)
├── PrivacySettings.vue (隐私设置)
├── ModelSettings.vue (模型设置)
└── VoiceSettings.vue (语音设置)
```

#### 用户交互与后端接口

| 组件 | 交互 | 触发方式 | 后端接口 |
|------|------|----------|----------|
| 所有 Tab | 加载配置 | onMounted | `GET /config` |
| DisplaySettings | 保存显示配置 | 保存按钮 | `PUT /config` section=display |
| AgentSettings | 保存 Agent 配置 | 保存按钮 | `PUT /config` section=agent |
| MemorySettings | 保存记忆配置 | 保存按钮 | `PUT /config` section=memory |
| CompressionSettings | 保存压缩配置 | 保存按钮 | `PUT /config` section=compression |
| SessionSettings | 保存会话配置 | 保存按钮 | `PUT /config` section=session_reset |
| PrivacySettings | 保存隐私配置 | 保存按钮 | `PUT /config` section=privacy |
| ModelSettings | 保存辅助模型 | 保存按钮 | `PUT /config/auxiliary-models` |
| VoiceSettings | 保存语音配置 | 保存按钮 | `PUT /config` section=voice |

#### 接口详细定义

```
GET /config
Query?: profile?: string
Response: AppConfig

PUT /config
Body: { section: string, ...values }
Response: { ok: boolean }

PUT /config/auxiliary-models
Body: AuxiliaryModelsConfig
Response: { ok: boolean }

PUT /config/credentials
Body: { platform: string, values: any }
Response: { ok: boolean }
```

---

### 5. SkillsView - 技能管理

**路由**: `/yi/skills`

**使用的 Store**: `useProfilesStore`

#### 组件树

```
SkillsView.vue
├── SkillList.vue (技能列表)
├── SkillDetail.vue (技能详情)
├── SkillImportModal.vue (导入弹窗)
├── SkillExternalDirsModal.vue (外部目录管理)
└── PendingWriteApprovals.vue (写入审批)
```

#### 用户交互与后端接口

| 组件 | 交互 | 触发方式 | 后端接口 |
|------|------|----------|----------|
| SkillList | 加载技能列表 | onMounted | `GET /skills` |
| SkillDetail | 加载技能内容 | 选中技能 | `GET /skills/:category/:name` |
| SkillDetail | 启用/禁用 | Toggle | `PUT /skills/toggle` |
| SkillDetail | 置顶/取消 | Pin 按钮 | `PUT /skills/pin` |
| SkillImportModal | 导入技能 | 上传文件 | `POST /skills/import` |
| SkillList | 删除技能 | 删除按钮 | `DELETE /skills/:category/:name` |
| SkillExternalDirsModal | 管理外部目录 | 保存按钮 | `GET/PUT /skills/external-dirs` |
| PendingWriteApprovals | 审批写入 | 审批按钮 | `POST /write-gate/pending/:subsystem/:id/approve` |

#### 接口详细定义

```
GET /skills
Query: target?: 'yi' | 'claude' | 'codex', profile?: string
Response: Skill[]

GET /skills/:category/:name
Query: target?: string
Response: SkillContent

PUT /skills/toggle
Body: { name: string, enabled: boolean }
Response: { ok: boolean }

PUT /skills/pin
Body: { name: string, pinned: boolean }
Response: { ok: boolean }

POST /skills/import
Body: FormData (files)
Response: { ok: boolean, imported: number }

DELETE /skills/:category/:name
Response: { ok: boolean }

GET /skills/external-dirs
Response: string[]

PUT /skills/external-dirs
Body: { dirs: string[] }
Response: { ok: boolean }

GET /write-gate/pending
Response: PendingWrite[]

POST /write-gate/pending/:subsystem/:id/approve
Response: { ok: boolean }

POST /write-gate/pending/:subsystem/:id/reject
Response: { ok: boolean }
```

---

### 6. FilesView - 文件管理

**路由**: `/yi/files`

**使用的 Store**: `useFilesStore`, `useProfilesStore`

#### 组件树

```
FilesView.vue
├── FileTree.vue (目录树)
├── FileBreadcrumb.vue (面包屑)
├── FileToolbar.vue (工具栏)
├── FileList.vue (文件列表)
├── FileContextMenu.vue (右键菜单)
├── FileEditor.vue (文件编辑器)
├── FilePreview.vue (文件预览)
├── FileUploadModal.vue (上传弹窗)
└── FileRenameModal.vue (重命名弹窗)
```

#### 用户交互与后端接口

| 组件 | 交互 | 触发方式 | 后端接口 |
|------|------|----------|----------|
| FileTree | 浏览目录 | 点击展开 | `GET /files/list?path=...` |
| FileList | 浏览文件 | onMounted | `GET /files/list?path=...` |
| FileEditor | 读取文件 | 打开文件 | `GET /files/read?path=...` |
| FileEditor | 保存文件 | 保存按钮 | `PUT /files/write` |
| FileToolbar | 创建文件夹 | 新建按钮 | `POST /files/mkdir` |
| FileContextMenu | 重命名 | 右键菜单 | `POST /files/rename` |
| FileContextMenu | 删除 | 右键菜单 | `DELETE /files/delete` |
| FileUploadModal | 上传文件 | 拖拽/按钮 | `POST /files/upload` |
| FileList | 下载文件 | 下载操作 | `GET /download?path=...` |

#### 接口详细定义

```
GET /files/list
Query: path: string
Response: FileEntry[]

GET /files/read
Query: path: string
Response: { content: string, encoding?: string }

PUT /files/write
Body: { path: string, content: string }
Response: { ok: boolean }

POST /files/mkdir
Body: { path: string }
Response: { ok: boolean }

POST /files/rename
Body: { oldPath: string, newPath: string }
Response: { ok: boolean }

DELETE /files/delete
Body: { path: string, recursive?: boolean }
Response: { ok: boolean }

POST /files/upload
Body: FormData (files + targetDir)
Response: { files: { name: string, path: string }[] }

GET /download
Query: path: string, name?: string
Response: 文件下载

GET /files/stat
Query: path: string
Response: { size, created, modified, isDirectory }
```

---

### 7. McpManagerView - MCP 管理

**路由**: `/yi/mcp`

**使用的 Store**: 无（直接 API）

#### 组件树

```
McpManagerView.vue
└── McpServerCard.vue (服务器卡片)
```

#### 用户交互与后端接口

| 组件 | 交互 | 触发方式 | 后端接口 |
|------|------|----------|----------|
| McpManagerView | 加载服务器列表 | onMounted | `GET /mcp/servers` |
| McpManagerView | 添加服务器 | 添加按钮 | `POST /mcp/servers` |
| McpServerCard | 编辑服务器 | 保存按钮 | `PATCH /mcp/servers/:name` |
| McpServerCard | 删除服务器 | 删除按钮 | `DELETE /mcp/servers/:name` |
| McpServerCard | 测试连接 | 测试按钮 | `POST /mcp/servers/:name/test` |
| McpServerCard | 启用/禁用 | Toggle | `PATCH /mcp/servers/:name` |
| McpManagerView | 重载服务器 | 重载按钮 | `POST /mcp/reload` |
| McpServerCard | 管理工具可见性 | 管理按钮 | `GET /mcp/tools?server=X` |

#### 接口详细定义

```
GET /mcp/servers
Response: McpServer[]

POST /mcp/servers
Body: { name: string, config: McpServerConfig }
Response: { ok: boolean }

PATCH /mcp/servers/:name
Body: Partial<McpServerConfig>
Response: { ok: boolean }

DELETE /mcp/servers/:name
Response: { ok: boolean }

POST /mcp/servers/:name/test
Response: { ok: boolean, latency?: number, error?: string }

POST /mcp/reload
Query: server?: string
Response: { ok: boolean }

GET /mcp/tools
Query: server?: string, raw?: boolean
Response: McpTool[]
```

---

### 8. WorkflowView - 工作流

**路由**: `/yi/workflow`

**使用的 Store**: `useAppStore`, `useChatStore`, `useProfilesStore`

#### 组件树

```
WorkflowView.vue
├── WorkflowAgentNode.vue (节点编辑)
├── FolderPicker.vue (目录选择)
├── ChatInput.vue (聊天输入)
└── MessageList.vue (消息列表)
```

#### 用户交互与后端接口

| 组件 | 交互 | 触发方式 | 后端接口 |
|------|------|----------|----------|
| WorkflowView | 加载工作流列表 | onMounted | `GET /workflows` |
| WorkflowView | 创建工作流 | 新建按钮 | `POST /workflows` |
| WorkflowView | 保存工作流 | 保存按钮 | `PATCH /workflows/:id` |
| WorkflowView | 删除工作流 | 删除按钮 | `DELETE /workflows/:id` |
| WorkflowView | 批量删除 | 批量模式 | `POST /workflows/batch-delete` |
| WorkflowView | 运行工作流 | 运行按钮 | `POST /workflows/:id/run` |
| WorkflowView | 停止运行 | 停止按钮 | `POST /workflows/:id/runs/:runId/stop` |
| WorkflowView | 查看运行历史 | 侧边栏 | `GET /workflows/:id/runs` |
| WorkflowView | 从节点重跑 | 右键菜单 | `POST /workflows/:id/runs/:runId/rerun-from-node` |
| WorkflowView | 删除运行记录 | 右键菜单 | `DELETE /workflows/:id/runs/:runId` |

#### 接口详细定义

```
GET /workflows
Response: Workflow[]

POST /workflows
Body: { name: string, profile?: string, workspace?: string }
Response: Workflow

PATCH /workflows/:id
Body: { name?, nodes?, edges?, viewport? }
Response: Workflow

DELETE /workflows/:id
Response: { ok: boolean }

POST /workflows/batch-delete
Body: { ids: string[] }
Response: { deleted: number }

POST /workflows/:id/run
Response: { runId: string }

POST /workflows/:id/runs/:runId/stop
Response: { ok: boolean }

GET /workflows/:id/runs
Query: limit?: number
Response: WorkflowRun[]

DELETE /workflows/:id/runs/:runId
Response: { ok: boolean }

POST /workflows/:id/runs/:runId/rerun-from-node
Body: { nodeId: string, preserveStartNode?: boolean }
Response: { runId: string }
```

---

### 9. GroupChatView - 群聊

**路由**: `/yi/group-chat`, `/yi/group-chat/room/:roomId`

**使用的 Store**: `useGroupChatStore`, `useProfilesStore`

#### 组件树

```
GroupChatView.vue
├── GroupChatPanel.vue (主面板)
│   ├── RoomList (房间列表)
│   ├── CreateRoomForm.vue (创建房间)
│   └── RoomSettings (房间设置)
├── GroupChatInput.vue (输入框)
├── GroupMessageList.vue (消息列表)
└── GroupMessageItem.vue (消息项)
```

#### 用户交互与后端接口

| 组件 | 交互 | 触发方式 | 后端接口 |
|------|------|----------|----------|
| GroupChatPanel | 加载房间列表 | onMounted | Socket.IO `group-chat.rooms` |
| GroupChatPanel | 加入房间 | 点击房间 | Socket.IO `group-chat.join` |
| CreateRoomForm | 创建房间 | 保存按钮 | Socket.IO `group-chat.create-room` |
| GroupChatInput | 发送消息 | Enter/按钮 | Socket.IO `group-chat.message` |
| GroupChatPanel | 更新房间配置 | 保存按钮 | Socket.IO `group-chat.update-config` |

---

### 10. JobsView - 定时任务

**路由**: `/yi/jobs`

**使用的 Store**: `useJobsStore`, `useProfilesStore`

#### 组件树

```
JobsView.vue
├── JobsPanel.vue (任务面板)
├── JobCard.vue (任务卡片)
├── JobFormModal.vue (任务表单)
└── JobRunHistory.vue (运行历史)
```

#### 用户交互与后端接口

| 组件 | 交互 | 触发方式 | 后端接口 |
|------|------|----------|----------|
| JobsPanel | 加载任务列表 | onMounted | `GET /jobs` |
| JobFormModal | 创建任务 | 保存按钮 | `POST /jobs` |
| JobFormModal | 编辑任务 | 保存按钮 | `PUT /jobs/:id` |
| JobCard | 删除任务 | 删除按钮 | `DELETE /jobs/:id` |
| JobRunHistory | 查看运行历史 | 点击任务 | `GET /jobs/:id/runs` |

#### 接口详细定义

```
GET /jobs
Response: Job[]

POST /jobs
Body: { name, schedule, prompt, ... }
Response: Job

PUT /jobs/:id
Body: Partial<Job>
Response: Job

DELETE /jobs/:id
Response: { ok: boolean }

GET /jobs/:id/runs
Response: JobRun[]
```

---

### 11. KanbanView - 看板

**路由**: `/yi/kanban`

**使用的 Store**: `useKanbanStore`, `useProfilesStore`

#### 组件树

```
KanbanView.vue
├── KanbanColumn.vue (列)
├── KanbanTaskCard.vue (任务卡片)
├── KanbanTaskDrawer.vue (任务详情)
└── KanbanCreateForm.vue (创建表单)
```

#### 用户交互与后端接口

| 组件 | 交互 | 触发方式 | 后端接口 |
|------|------|----------|----------|
| KanbanView | 加载看板 | onMounted | `GET /kanban/boards` |
| KanbanView | 加载任务 | 选择看板 | `GET /kanban/tasks?board=X` |
| KanbanCreateForm | 创建任务 | 保存按钮 | `POST /kanban/tasks` |
| KanbanTaskDrawer | 更新任务状态 | 状态变更 | `PATCH /kanban/tasks/:id` |
| KanbanTaskDrawer | 分配任务 | 选择人员 | `PATCH /kanban/tasks/:id` |
| KanbanView | 派发任务 | 派发按钮 | `POST /kanban/dispatch` |

#### 接口详细定义

```
GET /kanban/boards
Response: KanbanBoard[]

GET /kanban/tasks
Query: board: string, status?: string
Response: KanbanTask[]

POST /kanban/tasks
Body: { title, body?, assignee?, priority?, boardId, ... }
Response: KanbanTask

PATCH /kanban/tasks/:id
Body: Partial<KanbanTask>
Response: KanbanTask

POST /kanban/dispatch
Body: { taskId: string }
Response: { ok: boolean }
```

---

### 12. LogsView - 日志

**路由**: `/yi/logs`

**使用的 Store**: 无（直接 API）

#### 用户交互与后端接口

| 交互 | 触发方式 | 后端接口 |
|------|----------|----------|
| 加载日志文件列表 | onMounted | `GET /logs/files` |
| 加载日志内容 | 选择文件/筛选 | `GET /logs` |
| 刷新 | 刷新按钮 | `GET /logs` |

#### 接口详细定义

```
GET /logs/files
Response: string[]

GET /logs
Query: file?: string, lines?: number, level?: string
Response: LogEntry[]
```

---

### 13. UsageView - 用量统计

**路由**: `/yi/usage`

**使用的 Store**: `useUsageStore`, `useProfilesStore`

#### 用户交互与后端接口

| 交互 | 触发方式 | 后端接口 |
|------|----------|----------|
| 加载统计数据 | onMounted/周期切换 | `GET /usage/stats` |

#### 接口详细定义

```
GET /usage/stats
Query: days?: number, profile?: string
Response: {
  total_input_tokens: number,
  total_output_tokens: number,
  sessions: SessionUsage[],
  ...
}
```

---

### 14. TerminalView - 终端

**路由**: `/yi/terminal`

**使用的 Store**: 无（WebSocket）

#### 用户交互与后端接口

| 交互 | 触发方式 | 后端接口 |
|------|----------|----------|
| 创建终端 | 点击按钮 | WebSocket `terminal.create` |
| 输入/输出 | 键盘输入 | WebSocket `terminal.data` |
| 调整大小 | 窗口调整 | WebSocket `terminal.resize` |
| 关闭终端 | 关闭按钮 | WebSocket `terminal.close` |

---

## Socket.IO 事件规范

### chat-run (聊天运行)

**客户端 → 服务端**

```typescript
// 发送消息启动运行
'chat-run': {
  input: string | ContentBlock[],
  session_id: string,
  profile?: string,
  model?: string,
  provider?: string,
  model_groups?: Array<{ provider: string; models: string[] }>,
  source?: 'cli' | 'coding_agent' | 'global_agent' | 'workflow',
  queue_id?: string,
  workspace?: string,
  coding_agent_id?: string,
  mode?: 'global' | 'scoped',
  baseUrl?: string,
  apiKey?: string,
  reasoning_effort?: string
}

// 中止运行
'abort': { session_id: string }

// 取消排队
'cancel_queued_run': { session_id: string, queue_id: string }

// 工具审批响应
'approval.respond': { approval_id: string, choice: 'once' | 'session' | 'always' | 'deny' }

// 澄清响应
'clarify.respond': { clarify_id: string, response: string }

// 恢复会话
'resume': { session_id: string }
```

**服务端 → 客户端**

```typescript
// 运行开始
'run.started': { session_id: string, run_id: string }

// 消息流式更新
'message.delta': { delta: string, session_id: string }

// 推理文本流式更新
'reasoning.delta': { text: string, session_id: string }

// 工具调用开始
'tool.started': { tool: string, tool_call_id: string, arguments?: any, session_id: string }

// 工具调用完成
'tool.completed': { tool_call_id: string, output?: any, duration?: number, error?: boolean, session_id: string }

// 运行完成
'run.completed': {
  session_id: string,
  inputTokens?: number,
  outputTokens?: number,
  contextTokens?: number,
  output?: string,
  queue_remaining?: number
}

// 运行失败
'run.failed': { session_id: string, error: string }

// 会话标题更新
'session.title.updated': { session_id: string, title: string }

// 使用量更新
'usage.updated': { session_id: string, inputTokens: number, outputTokens: number }

// 工具审批请求
'approval.requested': {
  session_id: string,
  approval_id: string,
  command: string,
  description: string,
  choices: string[],
  allow_permanent: boolean
}

// 澄清请求
'clarify.requested': {
  session_id: string,
  clarify_id: string,
  question: string,
  choices?: string[],
  timeout_ms: number
}

// 压缩开始
'compression.started': { session_id: string, message_count: number, token_count: number }

// 压缩完成
'compression.completed': { session_id: string, contextTokens: number, compressed: boolean }

// 中止开始
'abort.started': { session_id: string }

// 中止完成
'abort.completed': { session_id: string, synced: boolean }

// 排队更新
'run.queued': { session_id: string, queue_length: number, queued_messages?: any[] }

// 会话命令
'session.command': { session_id: string, action: string, command: string, message?: string, ... }
```

### workflow (工作流)

**客户端 → 服务端**

```typescript
'workflow.list': {}
'workflow.subscribe': { workflowId: string }
'workflow.unsubscribe': { workflowId: string }
```

**服务端 → 客户端**

```typescript
'workflow.list': { workflows: Workflow[] }
'workflow.status.updated': { workflowId: string, runId: string, status: string, ... }
```

### group-chat (群聊)

**客户端 → 服务端**

```typescript
'group-chat.rooms': {}
'group-chat.join': { roomId: string }
'group-chat.leave': { roomId: string }
'group-chat.message': { roomId: string, content: string }
'group-chat.create-room': { name: string, ... }
```

**服务端 → 客户端**

```typescript
'group-chat.rooms': { rooms: Room[] }
'group-chat.message': { roomId: string, message: Message }
'group-chat.joined': { roomId: string, userId: string }
```

---

## 数据模型

### SessionSummary

```typescript
interface SessionSummary {
  id: string
  profile?: string | null
  source: string
  agent?: string
  model: string
  provider?: string
  title: string | null
  started_at: number
  ended_at: number | null
  last_active?: number
  message_count: number
  tool_call_count: number
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  reasoning_tokens: number
  estimated_cost_usd: number
}
```

### YiMessage

```typescript
interface YiMessage {
  id: number
  session_id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: number
  token_count: number | null
  finish_reason: string | null
  reasoning: string | null
  tool_name: string | null
  tool_call_id: string | null
  tool_calls?: ToolCall[]
}

interface ToolCall {
  id: string
  function: {
    name: string
    arguments: any
  }
}
```

### Provider

```typescript
interface Provider {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  models: Model[]
  enabled: boolean
}

interface Model {
  id: string
  name: string
  enabled: boolean
  context_length?: number
}
```

### CharacterMeta

```typescript
interface CharacterMeta {
  id: string
  name: string
  description: string
  avatar: string
  color: string
  model: string
  provider: string
  tools: Record<string, boolean>
  permissions: Record<string, boolean>
  maxSteps: number
  mode: 'primary' | 'subagent' | 'all'
  enabled: boolean
  builtIn: boolean
}
```

### AppConfig

```typescript
interface AppConfig {
  display: {
    compact: boolean
    streaming: boolean
    show_reasoning: boolean
    show_cost: boolean
    skin: string
    bell_on_complete: boolean
    notify_on_complete: boolean
  }
  agent: {
    max_turns: number
    gateway_timeout: number
    service_tier: string
  }
  memory: {
    memory_enabled: boolean
    user_profile_enabled: boolean
    write_approval: boolean
    char_limit: number
  }
  compression: {
    enabled: boolean
    threshold: number
    target_ratio: number
    protect_last_n: number
    protect_first_n: number
  }
  session_reset: {
    mode: 'idle' | 'time-based'
    idle_minutes: number
    at_hour: number
  }
  privacy: {
    redact_pii: boolean
  }
}
```
