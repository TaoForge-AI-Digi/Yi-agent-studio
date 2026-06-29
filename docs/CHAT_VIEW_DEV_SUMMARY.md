# ChatView 开发实现总结

> 基于 [CHAT_VIEW_FULL_SPEC.md](./CHAT_VIEW_FULL_SPEC.md) 实现。
> 覆盖后端 HTTP API、Socket.IO 实时通信、前端 API 层存根替换。

---

## 项目结构

```
apps/
├── server/                          # Hono + SQLite 后端
│   └── src/
│       ├── index.ts                 # 主入口：挂载路由 + Socket.IO
│       ├── store/
│       │   ├── schema.ts            # SQLite 数据库初始化（sessions + messages 表）
│       │   ├── sessions.ts          # Session 存储层（CRUD、分页、批量删除）
│       │   ├── config.ts            # JSON 配置存储
│       │   ├── models.ts            # Provider/Model 存储（已有）
│       │   └── characters.ts        # 角色存储（已有）
│       ├── routes/
│       │   ├── sessions.ts          # 会话 REST API
│       │   ├── config.ts            # 配置 API
│       │   ├── files.ts             # 文件浏览/编辑 API
│       │   ├── download.ts          # 文件下载 API
│       │   ├── upload.ts            # 运行时文件上传
│       │   ├── profiles.ts          # Profile 列表 API
│       │   ├── available-models.ts  # 可用模型列表 API
│       │   ├── models.ts            # Provider CRUD（已有）
│       │   └── characters.ts        # 角色 CRUD（已有）
│       └── ws/
│           └── chat-socket.ts       # Socket.IO 事件处理
├── client/                          # Vue 3 + Naive UI 前端
│   └── src/
│       ├── api/yi/
│       │   ├── sessions.ts          # [已实现] 会话相关 HTTP 调用
│       │   ├── chat.ts              # [已实现] Socket.IO 客户端
│       │   ├── config.ts            # [已有] 配置 API
│       │   ├── files.ts             # [已有] 文件 API
│       │   ├── models.ts            # [已有] Provider API
│       │   ├── profiles.ts          # [已有] Profile API
│       │   └── ...
│       ├── stores/yi/
│       │   └── chat.ts              # [已有] 聊天状态管理
│       └── components/yi/chat/      # [已有] 20 个 UI 组件
```

---

## 后端 API 接口

### HTTP API

| 方法 | 路径 | 用途 | 状态 |
|------|------|------|------|
| `GET` | `/health` | 健康检查 | ✅ |
| `GET` | `/yi/sessions` | 会话列表（支持 source/limit/profile 过滤） | ✅ |
| `GET` | `/yi/sessions/:id` | 会话详情 | ✅ |
| `GET` | `/yi/sessions/:id/messages` | 分页消息（offset/limit） | ✅ |
| `POST` | `/yi/sessions` | 创建会话 | ✅ |
| `PUT` | `/yi/sessions/:id/rename` | 重命名 | ✅ |
| `PUT` | `/yi/sessions/:id/workspace` | 设置工作区 | ✅ |
| `PUT` | `/yi/sessions/:id/model` | 切换模型 | ✅ |
| `DELETE` | `/yi/sessions/:id` | 删除会话 | ✅ |
| `POST` | `/yi/sessions/batch-delete` | 批量删除 | ✅ |
| `GET` | `/yi/sessions/:id/export` | 导出会话（JSON） | ✅ |
| `GET` | `/yi/config` | 读取配置（支持 sections 过滤） | ✅ |
| `PUT` | `/yi/config` | 更新配置段 | ✅ |
| `GET` | `/yi/profiles` | Profile 列表 | ✅ |
| `GET` | `/yi/available-models` | 可用模型列表 | ✅ |
| `GET` | `/yi/files/list` | 浏览目录 | ✅ |
| `GET` | `/yi/files/read` | 读取文件 | ✅ |
| `PUT` | `/yi/files/write` | 写入文件 | ✅ |
| `GET` | `/yi/download` | 文件下载 | ✅ |
| `POST` | `/upload` | 运行时文件上传 | ✅ |

### Socket.IO 事件

| 事件 | 方向 | 用途 | 状态 |
|------|------|------|------|
| `chat-run` | C→S | 发送消息启动运行 | ✅ |
| `run.started` | S→C | 运行开始通知 | ✅ |
| `message.delta` | S→C | 流式消息增量 | ✅ |
| `run.completed` | S→C | 运行完成 | ✅ |
| `run.failed` | S→C | 运行失败 | ✅ |
| `resume` | C→S | 恢复会话（加载消息和状态） | ✅ |
| `abort` | C→S | 中止运行 | ✅ |
| `abort.completed` | S→C | 中止完成 | ✅ |
| `cancel_queued_run` | C→S | 取消排队消息 | ✅ |
| `approval.respond` | C→S | 工具审批响应 | ✅ |
| `approval.resolved` | S→C | 审批已处理 | ✅ |
| `clarify.respond` | C→S | 澄清响应 | ✅ |
| `clarify.resolved` | S→C | 澄清已处理 | ✅ |

---

## 数据库结构

### sessions 表

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | TEXT PK | 会话 ID |
| `profile` | TEXT | Profile 名称 |
| `source` | TEXT | 来源（cli/api_server/global_agent） |
| `title` | TEXT | 会话标题 |
| `model` | TEXT | 使用的模型 |
| `provider` | TEXT | 使用的 Provider |
| `workspace` | TEXT | 工作区路径 |
| `created_at` | INTEGER | 创建时间戳（ms） |
| `updated_at` | INTEGER | 更新时间戳（ms） |
| `message_count` | INTEGER | 消息总数 |

### messages 表

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | INTEGER PK AUTO | 消息 ID |
| `session_id` | TEXT FK | 所属会话 |
| `role` | TEXT | user/assistant/tool/system |
| `content` | TEXT | 消息内容 |
| `reasoning` | TEXT | 推理文本 |
| `tool_name` | TEXT | 工具名称 |
| `tool_call_id` | TEXT | 工具调用 ID |
| `tool_args` | TEXT | 工具参数（JSON） |
| `tool_result` | TEXT | 工具结果（JSON） |
| `finish_reason` | TEXT | 完成原因 |
| `created_at` | INTEGER | 创建时间戳（ms） |

---

## 核心数据流

```
ChatView.vue
  │ onMounted
  ├── REST GET /yi/sessions          → 会话列表
  ├── REST GET /yi/available-models  → 模型列表
  ├── REST GET /yi/config            → 设置
  └── REST GET /yi/profiles          → Profile 列表

ChatPanel.vue
  │ 切换会话
  ├── Socket.IO resume               → 加载消息 + 运行状态
  │ 发送消息
  ├── Socket.IO chat-run             → 启动运行 + 接收流式回复
  │ 滚动加载历史
  └── REST GET /sessions/:id/messages?offset=N

右键菜单
  ├── PUT /sessions/:id/rename
  ├── PUT /sessions/:id/workspace
  ├── PUT /sessions/:id/model
  └── DELETE /sessions/:id
```

---

## 启动方式

```bash
# 后端（默认端口 3001）
cd apps/server
npm run dev

# 前端（默认端口 5173）
cd apps/client
npm run dev
```

前端通过 `VITE_YI_PREVIEW=1` 或 localStorage `yi_server_url` 配置后端地址，默认空字符串表示同域代理。

---

## 已修改文件清单

```
apps/server/src/index.ts                # 重新编写 - 挂载所有路由 + Socket.IO
apps/server/src/store/schema.ts         # 新建 - 数据库初始化
apps/server/src/store/sessions.ts       # 新建 - Session 存储层
apps/server/src/store/config.ts         # 新建 - 配置存储
apps/server/src/routes/sessions.ts      # 新建 - 会话 REST API
apps/server/src/routes/config.ts        # 新建 - 配置 API
apps/server/src/routes/files.ts         # 新建 - 文件操作 API
apps/server/src/routes/download.ts      # 新建 - 文件下载 API
apps/server/src/routes/upload.ts        # 新建 - 运行时上传
apps/server/src/routes/profiles.ts      # 新建 - Profile 列表
apps/server/src/routes/available-models.ts  # 新建 - 模型列表
apps/server/src/ws/chat-socket.ts       # 新建 - Socket.IO 处理器
apps/client/src/api/yi/sessions.ts      # 重写 - 存根替换为真实 HTTP 调用
apps/client/src/api/yi/chat.ts          # 重写 - 存根替换为真实 Socket.IO 客户端
```

---

## 未实现（后续阶段）

- **WebSocket 终端**（`/api/yi/terminal`）：TerminalPanel.vue 需要的 xterm.js 后端
- **AI 推理集成**：`chat-run` 当前为占位回复，需接入真实 LLM
- **搜索**：`searchSessions` 当前为前端本地过滤，后端可用 SQLite FTS 优化
- **语音**：`POST /yi/stt/transcribe`、TTS 端点
- **模型上下文**：`GET /yi/model-context`、`PUT /yi/model-context`
- **技能**：`GET /yi/skills` 端点
