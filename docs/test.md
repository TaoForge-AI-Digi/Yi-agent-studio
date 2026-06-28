# 手动测试清单

测试方式：前端 `http://localhost:5173`，后端 `http://localhost:3001`

---

## 阶段 0+1 — 已完成验证

### 启动服务

| # | 操作 | 预期 |
|---|------|------|
| 1 | `cd apps/server && npx tsx src/index.ts` | 输出 `Yi Server on http://localhost:3001` |
| 2 | `cd apps/client && npx vite` | 输出 `Local: http://localhost:5173` |
| 3 | 浏览器打开 `http://localhost:5173/#/yi/chat` | 看到聊天界面 |

### 聊天功能

| # | 操作 | 预期 |
|---|------|------|
| 4 | 在输入框输入「你好」按回车 | 消息出现在聊天区域 |
| 5 | 服务器日志 | 显示 `[WS] run sid=... model=...` |
| 6 | 聊天区域 | 显示错误：`No LLM endpoint configured`（正常，因为还没配模型） |

### 角色选择

| # | 操作 | 预期 |
|---|------|------|
| 7 | 点击输入栏左侧角色按钮 | 弹出角色列表（General、Coder、Reviewer、Explorer） |
| 8 | 搜索框输入「Coder」 | 列表过滤到 Coder |
| 9 | 点击 Coder | 角色切换为 Coder |

### 模型选择

| # | 操作 | 预期 |
|---|------|------|
| 10 | 点击输入栏模型选择器 | 弹出模型列表（来自 /yi/models 配置） |
| 11 | 选择一个模型 | 模型名显示在触发器上 |

### Character 端点

| # | 操作 | 预期 |
|---|------|------|
| 12 | `curl http://localhost:3001/api/yi/characters/general` | 返回 soul/memory/user 字段 |
| 13 | 编辑 `apps/server/data/characters/general/soul.md` | 文件保存成功 |
| 14 | 再次 curl characters/general | soul 内容更新 |

---

## 阶段 2 — 文件系统（待实现）

| # | 操作 | 预期 |
|---|------|------|
| 15 | 上传文件 | 返回 `{files: [{name, path}]}` |
| 16 | 下载文件 | 返回文件内容 |

---

## 阶段 3 — Tools（待实现）

| # | 操作 | 预期 |
|---|------|------|
| 17 | 聊天中说「读一下 package.json」 | Agent 调用 read_file 工具 |
| 18 | 服务器日志 | 显示 `tool.started` → `tool.completed` |

---

## 阶段 4 — Skills（待实现）

| # | 操作 | 预期 |
|---|------|------|
| 19 | `curl http://localhost:3001/api/yi/skills` | 返回技能列表 |
| 20 | 在 `data/skills/` 下新建 skill | 列表中出现新 skill |

---

## 阶段 5 — MCP（待实现）

| # | 操作 | 预期 |
|---|------|------|
| 21 | `curl http://localhost:3001/api/yi/mcp/servers` | 返回服务器列表 |
| 22 | 添加 MCP 服务器 | 列表中出现新服务器 |

---

## 阶段 6 — Plugins + Character（待实现）

| # | 操作 | 预期 |
|---|------|------|
| 23 | `curl http://localhost:3001/api/yi/plugins` | 返回插件列表 |
| 24 | 聊天中切换不同角色 | system prompt 对应角色的 soul.md |
