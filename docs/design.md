# Yi Agent Studio — 轻量 Agent 后端设计方案

## 背景

基于 Hermes 前端（`apps/client`）进行改造，目标是**替换后端**为轻量实现，
去掉不需要的 Coding Agent (Claude Code/Codex) 功能，保留前端协议不变。

## 架构

```
┌─────────────────────────────────────────────────────┐
│  前端 (已有, 需同步 API 路径)                          │
│  ModelSelector · AgentSelector · ChatInput ·         │
│  MessageList · SkillsView · McpManagerView ·         │
│  PluginsView                                         │
└──────────────┬──────────────────────────────────────┘
               │ Socket.IO (namespace: /chat-run)
               │ REST: /api/yi/*
┌──────────────▼──────────────────────────────────────┐
│  新后端 (Node.js / Bun)                               │
│                                                       │
│  ┌─────────────┐   ┌──────────────┐                  │
│  │  HTTP 层     │   │  Socket.IO 层 │                  │
│  │  (Hono)      │   │  chat-run    │                  │
│  │             │   │  namespace   │                  │
│  └──────┬───────┘   └──────┬───────┘                  │
│         │                  │                           │
│  ┌──────▼──────────────────▼───────┐                  │
│  │         Agent 核心               │                  │
│  │  ┌────────────────────────────┐ │                  │
│  │  │ AgentLoop                  │ │                  │
│  │  │  input + soul + tools      │ │                  │
│  │  │  → LLM API (fetch + SSE)   │ │                  │
│  │  │  → tool call → LLM         │ │                  │
│  │  │  → stream deltas back      │ │                  │
│  │  └────────────────────────────┘ │                  │
│  │  ┌────────────────────────────┐ │                  │
│  │  │ ToolRegistry               │ │                  │
│  │  │  read_file · write_file ·  │ │                  │
│  │  │  grep · glob · bash ·      │ │                  │
│  │  │  webfetch · + MCP tools    │ │                  │
│  │  └────────────────────────────┘ │                  │
│  └─────────────────────────────────┘                  │
│         │                  │                           │
│  ┌──────▼───────┐   ┌──────▼───────┐                  │
│  │  SessionStore │   │  SkillStore  │                  │
│  │  (SQLite)     │   │  (FS dir)   │                  │
│  └──────────────┘   └──────────────┘                  │
│         │                                              │
│  ┌──────▼────────┐                                    │
│  │  CharacterStore│  ← 每个角色独立目录                  │
│  │  (FS dir)      │    {agentId}/soul.md               │
│  │               │    {agentId}/memory.md              │
│  │               │    {agentId}/user.md                │
│  └───────────────┘                                    │
└──────────────────────────────────────────────────────┘
```

## AgentLoop 详细设计

### 模块划分

```
src/agent/
  loop.ts        # 主循环：run 事件 → 上下文组装 → LLM 循环 → 事件发送
  context.ts     # 上下文组装：soul.md + memory.md + user.md + skills
  llm.ts         # LLM Client：OpenAI/Anthropic 兼容 + SSE 流式解析
  types.ts       # 类型定义
```

### 完整流程

```
接收 run 事件
  │
  ├─ 1. 确定角色
  │     session.agentId 或默认 'general'
  │
  ├─ 2. 组装 system prompt (context.ts)
  │     ┌─────────────────────────────────────────┐
  │     │ You are a helpful assistant.            │  ← soul.md (角色人格, 必选)
  │     │                                         │
  │     │ ## Memory                               │  ← memory.md (长期记忆, 可选)
  │     │ User previously worked on...            │
  │     │                                         │
  │     │ ## User Profile                         │  ← user.md (用户偏好, 可选)
  │     │ - Name: Alice                           │
  │     │ - OS: Windows                           │
  │     │                                         │
  │     │ ## Skills                               │  ← 启用的 skills (可选)
  │     │ ### skill-name                          │
  │     │ ...SKILL.md content...                  │
  │     └─────────────────────────────────────────┘
  │
  ├─ 3. 加载历史消息 (SQLite)
  │     messages = history + [{ role: 'user', content: input }]
  │
  ├─ 4. LLM 循环 (loop.ts, 最多 maxSteps 轮)
  │     ┌─→ 调 LLM API (llm.ts, fetch + SSE)
  │     │   │
  │     │   ├─ text_delta
  │     │   │   → socket.emit('message.delta', { delta, session_id })
  │     │   │   → 累加到 assistant 消息
  │     │   │
  │     │   └─ tool_use (完整 block)
  │     │       → 校验权限
  │     │       → socket.emit('tool.started', { name, args, tool_call_id, session_id })
  │     │       → toolRegistry.run(name, args, ctx)
  │     │       → socket.emit('tool.completed', { output, duration, tool_call_id, session_id })
  │     │       → messages.push(tool_result)
  │     │       → continue 下一轮 ──┘
  │     │
  │     └─ finish_reason=stop
  │         → socket.emit('run.completed', { session_id, usage, ... })
  │         → 保存消息到 SQLite
  │         → 如果启用了 memory，触发写 memory.md
  │
  └─ 5. 异常处理
        abort 事件 → 中止 fetch → socket.emit('abort.completed')
        LLM 错误 → socket.emit('run.failed', { error })
```

### System Prompt 组装规则

```typescript
// context.ts
function buildSystemPrompt(characterId: string): string {
  const parts: string[] = []

  // 1. 角色灵魂 (必选)
  const soul = readFile(`data/characters/${characterId}/soul.md`)
  parts.push(soul)

  // 2. 角色记忆 (可选, 可能为空)
  const memory = readFile(`data/characters/${characterId}/memory.md`)
  if (memory.trim()) {
    parts.push(`\n## Memory\n${memory}`)
  }

  // 3. 用户信息 (可选)
  const user = readFile(`data/characters/${characterId}/user.md`)
  if (user.trim()) {
    parts.push(`\n## User Profile\n${user}`)
  }

  // 4. 启用的 Skills
  const skills = getEnabledSkillsContent()
  if (skills.length > 0) {
    parts.push('\n## Skills\n' + skills.map(s =>
      `### ${s.name}\n${s.content}`
    ).join('\n\n'))
  }

  return parts.join('\n')
}
```

### LLM Client 抽象

```typescript
// llm.ts

interface LlmStreamEvent {
  type: 'text_delta'
  text: string
} | {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
} | {
  type: 'done'
  finishReason: string
  usage?: { inputTokens: number; outputTokens: number }
}

// 统一接口，内部根据 provider 选择 OpenAI/Anthropic 格式
function llmChat(params: {
  messages: Message[]
  tools: ToolDef[]
  model: string
  provider: string
  baseUrl: string
  apiKey: string
}): AsyncIterable<LlmStreamEvent>
```

内部实现：
- **OpenAI 兼容**：`POST {baseUrl}/chat/completions` + SSE 解析
  - `choices[0].delta.content` → text_delta
  - `choices[0].delta.tool_calls` → 累积解析 → tool_use
- **Anthropic 兼容**：`POST {baseUrl}/messages` + SSE 解析
  - `content_block_delta` (text_delta) → text_delta
  - `content_block_start` (tool_use) → tool_use (一次性完整)

### Messages 格式

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | ContentBlock[]
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[]
  tool_call_id?: string  // tool role only
  name?: string          // tool role only
}
```

## 技术选型

| 层 | 选择 | 原因 |
|---|---|---|
| 运行时 | Node.js (Bun 备选) | 和前端同语言，Socket.IO 原生支持 |
| HTTP 框架 | Hono | 轻量，Edge-ready |
| 数据库 | SQLite (`better-sqlite3`) | 零配置，单文件 |
| LLM 调用 | 原生 `fetch` + SSE 解析 | 不引入 SDK |
| MCP 客户端 | `@modelcontextprotocol/sdk` | 标准 MCP 协议 |

## 与原 Hermes 的差异

| 功能 | 原 Hermes | 新方案 |
|---|---|---|
| Coding Agent (Claude/Codex) | 完整实现 | 去掉 |
| Subagent | 完整实现 | 暂不实现 |
| Context Compression | 完整实现 | 暂不实现 |
| Approval/Clarify | 交互式弹窗 | `ask`: 暂停确认; `allow`: 直接执行 |
| agent_bridge (IPC) | 独立进程 | 不需要 |
| Memory 存储 | 单份 `memory.md`/`user.md`/`soul.md` | 每个角色独立目录 |

## 数据模型

### Session
```
sessions:
  id          TEXT PRIMARY KEY
  title       TEXT
  model       TEXT
  provider    TEXT
  profile     TEXT DEFAULT 'default'
  source      TEXT DEFAULT 'cli'
  workspace   TEXT
  created_at  INTEGER
  updated_at  INTEGER
```

### Message
```
messages:
  id           INTEGER PRIMARY KEY AUTOINCREMENT
  session_id   TEXT REFERENCES sessions(id)
  role         TEXT  -- 'user' | 'assistant' | 'system' | 'tool'
  content      TEXT
  tool_name    TEXT
  tool_call_id TEXT
  reasoning    TEXT
  timestamp    INTEGER
  token_count  INTEGER
```

### Character

每个角色对应 `data/characters/{agentId}/` 目录：

```
data/characters/
  general/
    soul.md      # 角色灵魂 (system prompt)
    memory.md    # 角色记忆
    user.md      # 用户信息
  coder/
    soul.md
    memory.md
    user.md
  reviewer/
    soul.md
    memory.md
    user.md
  ...
```

## API 清单

### Socket.IO (namespace: /chat-run)

客户端 → 服务端:
- `run` — 开始对话
- `resume` — 恢复会话
- `abort` — 中断
- `approval.respond` — 审批响应
- `clarify.respond` — 澄清响应
- `cancel_queued_run` — 取消排队

服务端 → 客户端:
- `run.started` / `run.queued` / `run.completed` / `run.failed`
- `message.delta` / `reasoning.delta` / `reasoning.available`
- `tool.started` / `tool.completed`
- `subagent.start` / `subagent.tool` / `subagent.progress` / `subagent.complete`
- `approval.requested` / `approval.resolved`
- `clarify.requested` / `clarify.resolved`
- `compression.started` / `compression.completed`
- `abort.started` / `abort.timeout` / `abort.completed`
- `session.command` / `session.title.updated`
- `agent.event` / `run.reattach_failed`
- `usage.updated` / `resumed` / `run.peer_user_message`

### REST (前缀: /api/yi)

**核心**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 + 版本 |

**模型**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/available-models` | 可用模型列表 |
| GET | `/config/models` | 配置层模型 |
| POST | `/provider-models` | 从 URL 拉取模型 |
| PUT | `/config/model` | 设置默认模型 |

**会话**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/sessions` | 列表 (query: source, limit, profile) |
| GET | `/sessions/:id` | 详情 |
| DELETE | `/sessions/:id` | 删除 |
| POST | `/sessions/:id/rename` | 重命名 |
| POST | `/sessions/:id/workspace` | 设置工作区 |
| POST | `/sessions/:id/model` | 设置模型 |
| GET | `/sessions/:id/export` | 导出 |
| GET | `/sessions/:id/context` | 上下文 |
| GET | `/sessions/conversations/:id/messages/paginated` | 分页消息 |
| GET | `/sessions/context-length` | 上下文长度 |

**文件**
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/upload` | 上传 |
| GET | `/download` | 下载 |

**Skills**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/skills` | 列表 |
| GET | `/skills/:path` | 内容 |
| GET | `/skills/:cat/:name/files` | 文件列表 |
| PUT | `/skills/toggle` | 启用/禁用 |
| PUT | `/skills/pin` | 置顶 |
| GET | `/skills/external-dirs` | 外部目录 |
| PUT | `/skills/external-dirs` | 保存外部目录 |
| POST | `/skills/import` | 导入 |
| DELETE | `/skills/:cat/:name` | 删除 |
| GET | `/skills/usage/stats` | 使用统计 |

**MCP**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/mcp/servers` | 服务器列表 |
| POST | `/mcp/servers` | 添加 |
| PATCH | `/mcp/servers/:name` | 更新 |
| DELETE | `/mcp/servers/:name` | 删除 |
| POST | `/mcp/servers/:name/test` | 测试连接 |
| GET | `/mcp/tools` | 工具列表 |
| POST | `/mcp/reload` | 重载 |

**Plugins**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/plugins` | 插件列表 |

**Character**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/characters/:agentId` | 读取该角色的 memory/user/soul |
| POST | `/characters/:agentId` | 写入 section: memory/user/soul |

**Usage**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/usage/stats` | 统计 |
| GET | `/sessions/usage` | 批量会话用量 |
| GET | `/sessions/:id/usage` | 单会话用量 |

## ContentBlock 格式

```typescript
type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; name: string; path: string; media_type: string }
  | { type: 'file'; name: string; path: string; media_type?: string }
```

## Agent 配置

```typescript
interface Agent {
  id: string
  name: string
  description?: string
  avatar?: string
  color?: string
  soul?: string          // system prompt (fallback 到 data/characters/{id}/soul.md)
  userProfile?: string
  memory?: { enabled: boolean; maxEntries?: number }
  memoryContent?: string
  model?: string
  provider?: string
  tools?: Record<string, boolean>   // { read: true, bash: false, ... }
  permissions?: {
    edit?: 'ask' | 'allow' | 'deny'
    bash?: 'ask' | 'allow' | 'deny'
    webfetch?: 'ask' | 'allow' | 'deny'
  }
  maxSteps?: number
  mode?: 'primary' | 'subagent' | 'all'
}
```
