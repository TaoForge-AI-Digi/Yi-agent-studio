# 开发计划

## 阶段 0：项目初始化 + 前端路径统一

**目标**：搭建 Node.js 后端项目骨架，统一前端 API 路径前缀

- [x] **0.1 前端命名统一 (hermes → yi)** ✅ 已完成

   已完成的替换：

   **A. API 路径** ✅ 33 个文件 `/api/hermes/` → `/api/yi/`
   - 涉及所有 `api/yi/*.ts`、`api/client.ts`、`stores/yi/*.ts`、`views/yi/*.vue`、`components/yi/*.vue`

   **B. HTTP Header** ✅ 6 个文件 `X-Hermes-Profile` → `X-Yi-Profile`

   **C. localStorage Key** ✅ 14 个文件，15 个 key 统一前缀 `yi_`
   - `hermes_api_key`, `hermes_server_url`, `hermes_active_profile_name`
   - `hermes_sidebar_collapsed`, `hermes-stt-settings-v1`, `hermes-tts-settings-v2`
   - `hermes_session_pins_v1_`, `hermes_human_only_v1_`, `hermes:reasoning_effort:`
   - `hermes_chat_input_drafts_v1`, `hermes_locale`, `hermes_brightness`, `hermes_style`
   - `hermes_terminal_theme`, `hermes_show_tool_calls`, `hermes_default_credentials_*`

   **D. DOM Event 名** ✅ 10 个文件
   - `hermes-auth-notice` → `yi-auth-notice`
   - `hermes-auth-cleared` → `yi-auth-cleared`
   - `hermes:open-page-sidebar` → `yi:open-page-sidebar`
   - CSS `.hermes-desktop-shell` → `.yi-desktop-shell`

   **E. 杂项** ✅
   - Agent 类型值 `'hermes'` → `'yi'`（chat.ts, ChatPanel.vue, WorkflowView.vue）
   - SkillTarget `'hermes'` → `'yi'`（skills.ts, SkillsView.vue, SkillDetail.vue）
   - Notification tag `hermes-complete-` → `yi-complete-`
   - 产品标题 `'Hermes Studio'` → `'Yi Studio'`

   遗留项（待后续）：
   - `✅` 类型名重命名：`HermesMessage` → `YiMessage`, `HermesProfile` → `YiProfile`, `fetchHermesSessions` → `fetchYiSessions` 等
   - `✅` i18n 翻译文件中的 "Hermes" 文本（9 个 locale 文件，~400 处）
   - `✅` `views/hermes/`, `components/hermes/` 等旧目录已清理
   - `✅` VITE_HERMES_* 环境变量名 → VITE_YI_*
   - `✅` `/coding-agents/hermes.png` → `yi.png`（新 logo 替换）

- [x] **0.2 新建 `apps/server/`** ✅
  - 初始化 `package.json`（yi-server, v0.1.0）
  - TypeScript 配置（ES2022, bundler mode）
  - 依赖安装：`hono`, `socket.io`, `better-sqlite3`, `@modelcontextprotocol/sdk`, `js-yaml`

- [x] **0.3 目录结构** ✅ 已创建全部目录（src/8 个子目录 + data/3 个子目录 + uploads/）
  ```
  src/
    index.ts          # 入口
    agent/
      loop.ts         # AgentLoop 核心
      llm.ts          # LLM 调用 (fetch + SSE)
    ws/
      chat.ts         # Socket.IO /chat-run 命名空间
    routes/
      health.ts       # /health
      sessions.ts     # 会话 CRUD
      models.ts       # 模型接口
      skills.ts       # Skills 接口
      mcp.ts          # MCP 接口
      plugins.ts      # Plugins 接口
      character.ts    # Character 接口 (每角色 memory/user/soul)
      upload.ts       # 文件上传
      download.ts     # 文件下载
      usage.ts        # Usage 统计
    store/
      sessions.ts     # SQLite 会话+消息
      config.ts       # 配置读写 (mcp.json 等)
    tools/
      registry.ts     # ToolRegistry
      builtin/        # 内置工具
        read-file.ts
        write-file.ts
        edit-file.ts
        grep.ts
        glob.ts
        bash.ts
        webfetch.ts
    skills/
      scanner.ts      # Skills 目录扫描
    mcp/
      config.ts       # MCP 配置管理
      transport.ts    # 子进程/HTTP 连接管理
      discovery.ts    # 工具发现
    character/
      store.ts        # Character 存储 (读/写角色目录)
  data/
    skills/           # Skills 目录
    characters/       # 角色目录
      {agentId}/
        soul.md       # 角色灵魂 (system prompt)
        memory.md     # 角色记忆
        user.md       # 用户信息
    mcp.json          # MCP 服务器配置
    session.db        # SQLite 数据库
  uploads/            # 上传文件目录
  ```

---

## 阶段 1：最小对话可用

**目标**：前端能发消息、看到流式回复、恢复历史会话

- [ ] **1.1 AgentLoop 核心**
  - `src/agent/loop.ts` — 主循环：上下文组装 → LLM 循环 → 事件发送

- [ ] **1.2 LLM Client**
  - `src/agent/llm.ts` — OpenAI/Anthropic 兼容，SSE 流式解析

- [ ] **1.3 Socket.IO 层**
  - `src/ws/chat.ts` — `/chat-run` 命名空间，run/resume/abort 事件路由

- [ ] **1.4 SessionStore**
  - `src/store/sessions.ts` — JSON 文件存储 sessions + messages

- [ ] **1.5 HTTP REST (核心)**
  - `src/routes/index.ts` — /health, sessions CRUD, models, character, skills/mcp/plugins 占位

- [ ] **1.6 入口**
  - `src/index.ts` — Hono + Socket.IO 启动

---

## 阶段 2：文件系统

**目标**：支持文件上传和下载，ContentBlock 处理

- [ ] **2.1 文件上传**
  - POST `/api/yi/upload`
  - FormData 解析
  - 存 `uploads/` 目录
  - 返回 `{ files: [{ name, path }] }`

- [ ] **2.2 文件下载**
  - GET `/api/yi/download?path=&token=&name=&profile=`
  - token 校验
  - 返回文件流

- [ ] **2.3 ContentBlock 适配**
  - AgentLoop 支持 image/file 类型 ContentBlock
  - 将 base64 或文件路径转为 LLM 格式

---

## 阶段 3：Tools

**目标**：默认工具 + AgentLoop 集成

- [ ] **3.1 ToolRegistry**
  - `src/tools/registry.ts`
  - `register(name, schema, handler)`
  - `run(name, args, ctx)` → Promise\<string\>

- [ ] **3.2 内置工具**
  - `read-file` — 读文件内容
  - `write-file` — 写文件
  - `edit-file` — 编辑文件 (search & replace)
  - `grep` — 搜索文件内容
  - `glob` — 文件匹配
  - `bash` — 执行命令 (沙箱)
  - `webfetch` — HTTP 请求

- [ ] **3.3 权限控制**
  - 根据 Agent.permissions 控制工具执行
  - `ask` 模式 → 发 approval.requested，暂停等待

---

## 阶段 4：Skills

**目标**：Skills 配置和管理界面可用

- [ ] **4.1 目录扫描**
  - `src/skills/scanner.ts`
  - 扫描 `data/skills/` 目录
  - 解析 SKILL.md + 文件列表
  - 返回 Category[]

- [ ] **4.2 REST**
  - GET `/api/yi/skills` — 列表
  - GET `/api/yi/skills/:path` — 技能内容
  - GET `/api/yi/skills/:cat/:name/files` — 文件列表
  - PUT `/api/yi/skills/toggle` — 启用/禁用
  - PUT `/api/yi/skills/pin` — 置顶
  - GET/PUT `/api/yi/skills/external-dirs` — 外部目录
  - POST `/api/yi/skills/import` — 导入 (FormData/zip)
  - DELETE `/api/yi/skills/:cat/:name` — 删除

- [ ] **4.3 AgentLoop 集成**
  - run 启动时扫描启用的 skills
  - 将 skill 内容注入 system prompt

---

## 阶段 5：MCP

**目标**：MCP 服务器连接和工具发现

- [ ] **5.1 配置管理**
  - `src/mcp/config.ts`
  - 读写 `data/mcp.json`
  - 支持 stdio / http / sse 三种 transport

- [ ] **5.2 传输层**
  - `src/mcp/transport.ts`
  - stdio: `child_process.spawn`
  - http: `fetch` + JSON-RPC
  - sse: EventSource
  - 连接状态管理 + 自动重连

- [ ] **5.3 工具发现**
  - `src/mcp/discovery.ts`
  - 连接后 `tools/list`
  - 返回 `{ name, description, input_schema }`

- [ ] **5.4 REST**
  - GET `/api/yi/mcp/servers` — 列表
  - POST `/api/yi/mcp/servers` — 添加
  - PATCH `/api/yi/mcp/servers/:name` — 更新
  - DELETE `/api/yi/mcp/servers/:name` — 删除
  - POST `/api/yi/mcp/servers/:name/test` — 测试连接
  - GET `/api/yi/mcp/tools` — 工具列表
  - POST `/api/yi/mcp/reload` — 重载

- [ ] **5.5 AgentLoop 集成**
  - 运行时 MCP 工具注入 ToolRegistry

---

## 阶段 6：Plugins + Character

**目标**：Plugins 列表和 Character (角色记忆) 读写

- [ ] **6.1 Plugins**
  - GET `/api/yi/plugins`
  - 扫描目录返回元数据 (只读)
  - 返回 `{ plugins, warnings, metadata }`

- [ ] **6.2 Character**
  - `src/character/store.ts`
  - 目录结构：`data/characters/{agentId}/soul.md`, `memory.md`, `user.md`
  - GET `/api/yi/characters/:agentId` — 读取角色的全部三个文件
  - POST `/api/yi/characters/:agentId` — 写入 section ({ section, content })
  - 返回 `{ memory, user, soul, *_mtime }`

- [ ] **6.3 Soul 集成**
  - AgentLoop 优先读 agent.soul 字段
  - agent.soul 为空时读 `data/characters/{agentId}/soul.md`

---

## 阶段 7：扩展功能

**按需实现**

- [ ] **7.1 Approval 弹窗**
  - `ask` 模式暂停，等客户端 `approval.respond`
  - `allow` 模式直接执行

- [ ] **7.2 上下文压缩**
  - `compression.started` / `compression.completed` 事件
  - 超长上下文自动截断

- [ ] **7.3 Usage 统计**
  - GET `/api/yi/usage/stats`
  - GET `/api/yi/sessions/usage`
  - GET `/api/yi/sessions/:id/usage`

- [ ] **7.4 Reasoning Effort**
  - 支持 `none` / `minimal` / `low` / `medium` / `high` / `xhigh`
  - 透传给 LLM API

- [ ] **7.5 知识库**
  - 存储侧：知识库数据存储和管理接口
  - 检索侧：在 AgentLoop 启动时检索并注入上下文
  - 具体技术路径（向量数据库 / 全文索引 / 图谱等）待定

---

## 当前进度

| 阶段 | 状态 |
|------|------|
| 0. 项目初始化 + 前端路径统一 | ✅ 已完成 | [测试清单](test.md#阶段-0--项目初始化--前端命名统一) |
| 1. 最小对话可用 | ⬜ 待开始 | [测试清单](test.md#阶段-1--最小对话可用) |
| 2. 文件系统 | ⬜ 待开始 | [测试清单](test.md#阶段-2--文件系统) |
| 3. Tools | ⬜ 待开始 | [测试清单](test.md#阶段-3--tools) |
| 4. Skills | ⬜ 待开始 | [测试清单](test.md#阶段-4--skills) |
| 5. MCP | ⬜ 待开始 | [测试清单](test.md#阶段-5--mcp) |
| 6. Plugins + Character | ⬜ 待开始 | [测试清单](test.md#阶段-6--plugins--character) |
| 7. 扩展功能 | ⬜ 待开始 | [测试清单](test.md#阶段-7--扩展功能) |
