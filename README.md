# 弈 (Yi)

> 开源的桌面智能体——你说意图,它落子执行;你沉淀知识,它越用越聪明;你分享智慧,它帮你变现。

弈(读作 *yì*,古称围棋)是一个面向知识工作者的开源桌面 Agent。它把"用户布势、Agent 落子"的围棋范式搬进 GUI:你按 `Cmd/Ctrl+Shift+Y` 说出意图,弈自己规划、分步执行、沉淀棋谱,所有执行记录可复用、可分享、可在弈林市场流通。

英文名 **Yi**。项目子目录 `yi-agent-studio/`,`apps/client` 是当前主战场(Vue 3 SPA,前端先行 + mock 状态)。

---

## 为什么是弈

| 已有玩家 | 占据什么 | 弈的差位 |
|---|---|---|
| OpenCode / Goose / Hermes / OpenClaw | 开源编码 Agent,开发者向,CLI/TUI | **通用桌面** + 面向知识工作者 + GUI 优先 |
| Raycast / Alfred / AutoHotkey | 桌面快捷指令,无 AI 规划、无记忆 | 弈有规划、有棋谱、有棋经 |
| AutoGPT / Devin / Cursor | 强 Agent,但云端或绑死编码场景 | **本地优先** + 通用桌面 + 开源 |
| Obsidian / Notion / Logseq | 本地知识库,知识是"死"的 | 弈的棋经是 **Agent 的外挂大脑**,可调用可变现 |

四道壁垒(由浅入深):**围棋隐喻的统一气质** → **非开发者的桌面 Agent** → **棋谱 `.yi.json` 作为开放标准** → **弈林生态飞轮**。

---

## 三个用户故事

- **执棋者**(知识工作者 / 效率党)— "把这三份研报摘要成投资备忘录,格式参考我上周那份"。弈从本地棋经取上周备忘录做模板,调用社区"研报摘要"手筋,3 分钟生成。
- **布道者**(行业专家 / 资深开发者)— 把上述流程封装成专家包,一键发布到弈林,标价 $1.99。新手买下,站在他肩膀上完成同样的事。
- **弈匠**(开源开发者 / AI 工程师)— 为这个手筋贡献更好的 PDF 解析能力棋子,获得社区声望 + 分账。

---

## 三类资产 + 一套市场

弈的资产协议是它的根。六类资产:

| 弈中称 | 业界对应 | 角色 |
|---|---|---|
| **手筋**(Tesuji) | Skill | 能力单元的 prompt 模板 + 工具声明 |
| **器**(Tool) | Plugin | 工具实现(fs/shell/browser/mcp...) |
| **驿**(Relay) | MCP server | 外部能力通道(标准 MCP 协议) |
| **棋魂**(Soul) | Character | 人格/语气/价值观/思维风格(soul.md 拼进 system prompt) |
| **棋经**(Qijing) | 弈独有 | **本地知识库**:典籍 + digest 简编 + `[[source:...]]` 引用回链,Agent 的外挂大脑 |
| **专家包**(Expert Pack) | 组合体 | 手筋+器+驿+棋魂+棋经按 `composition.yaml` 组合,引用而非复制,可分账 |

**双开关互斥**(`autoUpdate` / `editable`):不同时 on。本地改上游会覆盖,语义冲突。资产加载器加载时校验,违反报错。

---

## 路线图

| 阶段 | 状态 | 内容 |
|---|---|---|
| **Phase 1: 前端先行**(当前) | ✅ 在跑 | Vue 3 + Vite + Pinia + Naive UI SPA;9 语言 i18n;深色木质主题;侧栏 27 项;对话/技能/插件/MCP/记忆/角色/典藏/市场/任务/看板/频道/工作流/模型/日志/用量/性能监控/技能用量/设置/历史/群聊/全局 Agent/终端/文件/单聊 |
| **MVP** | ⏳ Phase 2 | Electron 壳 + Vue 3 + TS,三层进程(renderer / main / utility),对话树,4 工具(fs/shell/browser/mcp),OpenAI 兼容 LLM(自定义 baseURL),棋经 md + 全文检索,资产目录制 + manifest,4 级权限(PLAN / ASK / TRUSTED / BYPASS) |
| **Phase 2: 种子期** | ⏳ | Koa 后端;向量检索;资产沙箱强隔离;资产自动更新检查 |
| **Phase 3: 商业化** | ⏳ | 弈林市场协议(上传/拉取/分账);引用依赖解析与冻结;云端棋经同步 |
| **Phase 4: 生态期** | ⏳ | 官方专家包矩阵 infra;创作者 dashboard;团队协作 |

> Phase 1 = 跑通"看见产品",MVP = 跑通"真能力"。当前 dev server `http://localhost:5173/` 已能浏览全部前端,后端走 mock。

---

## 快速开始

**前置:** Node 20+ (推荐 23+);`apps/client/.gitignore` 已含 `node_modules` / `dist` / `.codegraph/` 等。

```bash
git clone https://github.com/TaoForge-AI-Digi/Yi-agent-studio
cd Yi/apps/client
npm install
npm run dev          # http://localhost:5173/
```

构建生产包:`npm run build` → `apps/client/dist/`。其他脚本:`npm run typecheck` / `npm run preview`。

---

## 项目结构

```
Yi/
├── apps/
│   └── client/                Vue 3 SPA (Phase 1 主战场)
│       ├── public/            静态资源 (logo / favicon)
│       ├── src/
│       │   ├── App.vue
│       │   ├── main.ts
│       │   ├── router/        vue-router 4 (hash 模式, #/yi/...)
│       │   ├── stores/        Pinia 3 (chat / profiles / app / settings / ...)
│       │   ├── components/    业务组件 (chat / skills / settings / layout / ...)
│       │   ├── views/         路由 view
│       │   ├── api/           REST + WebSocket 客户端封装
│       │   ├── composables/   useTheme / useKeyboard / ...
│       │   ├── i18n/          vue-i18n 11 (9 语言)
│       │   └── styles/        variables.scss (深色木质配色)
│       ├── vite.config.ts     Vite 8 构建配置
│       └── package.json
└── docs/
    └── superpowers/
        ├── specs/             设计与架构
        │   ├── 2026-06-25-yi-product-design.md
        │   └── 2026-06-25-yi-tech-architecture.md
        └── plans/             实施计划
            ├── 2026-06-25-yi-mvp-walking-skeleton.md
            └── 2026-06-25-yi-mvp-frontend-first.md
```

**演进路径:** Phase 2 起拆 monorepo(`apps/desktop` + `packages/shared` + `packages/assets` + `packages/storage`)。当前单包结构为节省迁移成本。

---

## 技术栈(已落地)

| 层 | 技术 |
|---|---|
| UI | Vue 3.5 + `<script setup>` + TypeScript 5.8 |
| 构建 | Vite 8 (manualChunks 拆 monaco / mermaid / xterm) |
| 状态 | Pinia 3 |
| 组件 | Naive UI 2 (CSS 变量驱动主题切换) |
| 路由 | vue-router 4 (hash) |
| i18n | vue-i18n 11(9 语言) |
| 编辑器/终端 | monaco-editor + xterm.js + addons |
| 流程图 | @vue-flow/core + background/controls/minimap |
| Markdown | markdown-it + katex + highlight.js + mermaid |
| 网络 | axios + socket.io(-client) + eventsource + ws |
| 测试 | Vitest 3 + @vue/test-utils + Playwright |

Phase 2 预留:Koa + @koa/router/cors/bodyparser(依赖已装,代码未起)→ 启动后端运行时。

完整 ADR / Phase 拆分见 [`docs/superpowers/specs/2026-06-25-yi-tech-architecture.md`](docs/superpowers/specs/2026-06-25-yi-tech-architecture.md)。

---

## 参与

- 提 Issue / 提 PR 都欢迎。Commit 风格建议 Conventional Commits(`feat:` / `fix:` / `chore:` / `docs:` / `refactor:`)。
- 改前端:`apps/client/`。新建组件/页面/路由请参考现有 `views/yiviews/yicomponents/yiapi/yi...` 目录的命名和风格。
- 跑测试:`cd apps/client && npx vitest`(单元)+ `npx playwright test`(E2E,待补)。
- 提 PR 前:`npm run typecheck` 必须过。

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 安全

弈 LLM 集成走 OpenAI 兼容 client + 自定义 `baseURL`,用户自填云端或本地 ollama url。**baseURL/key 是用户责任,弈不做服务端代理。**

如果你在弈里跑别人上架的资产(手筋/器/驿),请确认来源可信。Phase 2 起会引入 V8 isolate / worker_threads 沙箱强隔离。

发现安全漏洞请发邮件到 `<security@example.com>`(待补充),**不要** 公开 Issue。

---

## 致谢 / 上游

Phase 1 前端壳源自 [hermes-studio](https://github.com/EKKOLearnAI/hermes-studio) 的 Vue 3 + Naive UI 客户端(287 个文件),内填奕品牌 + 9 语言 i18n + 深色木质配色。后续阶段(Phase 2 起)将逐步替换为自研实现。

---

## 协议

[Apache License 2.0](LICENSE)。

```
弈 — Copyright 2026 The Yi Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```
