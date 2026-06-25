# 弈 (Yi) — 技术架构设计

> Vue 3 + TypeScript SPA,对话树为任务流核心(概念模型),资产目录制 + manifest,云端 LLM(自定义 URL)。当前实现 = 前端先行 + mock 状态;后端/Electron/三层进程是原设计稿,留待 Phase 2。

- **状态**:设计稿(Draft,待审)
- **日期**:2026-06-25
- **性质**:技术架构文档(配套产品设计文档 `2026-06-25-yi-product-design.md`)
- **受众**:创始人 + 未来开源协作者

---

## 文档结构

- **一、核心架构** —— 技术栈、进程拓扑、Agent 循环、项目结构
- **二、数据与资产层** —— 对话树、资产格式、IPC 协议
- **三、工具链与本地能力** —— 工具清单、权限模型、安全边界、路线图

---

# 一、核心架构

## 1.1 技术栈总览

> **当前实现(已落地):** 前端 SPA + 抄自 hermes-studio 的完整客户端壳。Agent core / 工具进程 / 棋谱记录未启动,后端走 mock 状态。`docs/superpowers/plans/2026-06-25-yi-mvp-frontend-first.md` 是当前阶段实施计划。

| 层 | 技术 | 角色 |
|---|---|---|
| Shell | (Phase 2: Electron) | 当前跑在浏览器 + Vite dev server;`apps/client/index.html` 入口 |
| UI 框架 | Vue 3.5 + `<script setup>` + TypeScript | 棋枰/侧栏/对话/输入/模式切换/资产开关 |
| 构建 | Vite 8 | dev server(HMR) + 生产构建(esbuild 压缩,es2020 target) |
| 状态管理 | Pinia 3 | session/chat/profiles/app/settings 等模块化 store |
| 路由 | vue-router 4(hash 模式) | 全部 URL 形如 `#/yi/...` |
| 组件库 | Naive UI 2 | NButton/NModal/NDropdown/NIcon 等 + theme overrides(深色木质) |
| i18n | vue-i18n 11 | 9 语言(中/英/日/韩/法/德/俄/西/葡) |
| 编辑器/终端 | monaco-editor + xterm.js + xterm-addon-fit/web-links | 代码编辑 + Web 终端模拟 |
| 流程图 | @vue-flow/core + background/controls/minimap | 棋枰 / 任务流图可视化 |
| Markdown | markdown-it + katex + highlight.js + mermaid | 消息渲染 + 公式 + 代码高亮 + 流程图 |
| 网络 | axios + socket.io(-client) + eventsource + ws | REST + 实时流 + Server-Sent Events |
| LLM | js-tiktoken(分词)+ node-pty(伪终端)+ node-edge-tts(TTS) | 客户端侧模型工具链 |
| 工具 | adm-zip + js-yaml + qrcode | 资产打包 / YAML 解析 / 二维码 |
| 后端原型 | koa + @koa/router + @koa/cors + @koa/bodyparser + koa-static + koa-send + pino + pino-pretty | 依赖已装,代码未起;为 Phase 2 预留 |
| 搜索 | minisearch / ripgrep(规划中) | 棋经 digest 全文检索(MVP) |
| 元数据/棋谱 | 文件(yaml/json) | 全文件化,可 git、可打包、可上架 |
| 测试 | Vitest 3 + @vue/test-utils + jsdom | 单元;Playwright 用于 E2E + 截屏 |
| 包管理 | npm | 单包(`apps/client`);非 monorepo |

**为什么 Vue 3 + Naive UI + Vite 单语言栈:** 一种语言贯穿 UI/状态/路由,Vue SFC 让组件可独立迭代,Naive UI 主题化天然支持深色 + 木质配色,生态最契合"轻巧 + 可视化强"的 MVP 目标。Pinia 比 Vuex 简洁,vue-i18n 多语言无 boilerplate。

**为什么全文件、不上 SQLite:** 棋谱/棋经/资产清单都要能 git 版本化、能打包上架交易。SQLite 是二进制,git 不友好、打包不透明。文件优先,数据库留到真有检索瓶颈再上。

## 1.2 进程拓扑(单 SPA + 规划中的三层)

```
┌─────────────────────────────────────────┐
│ Renderer Process (Vue 3 UI, 当前)        │
│  棋枰视图 / 布势输入条 / 推演窗 / 总结卡   │
│  状态订阅: 通过 IPC stream 订阅 main 状态  │
└──────────────┬──────────────────────────┘
               │ IPC (类型安全 channel)
┌──────────────┴──────────────────────────┐
│ Main Process (Agent Core)               │
│  ┌─────────────────────────────────┐    │
│  │ Agent Loop (对话树 + 节点状态机)  │    │
│  │  PONDER → SPLIT → EXECUTE → DONE│    │
│  │  + 随时 STOP / FORK              │    │
│  └─────────────────────────────────┘    │
│  LLM Client / Planner / 棋谱 Recorder   │
│  权限网关 (PLAN/ASK/TRUSTED/BYPASS)      │
└──────────────┬──────────────────────────┘
                │ IPC (utilityProcess.fork)
┌──────────────┴──────────────────────────┐
│ Utility Process(es) (Tool Sandbox)      │
│  fs 工具 / shell 工具 / browser 工具      │
│  MCP 驿 / Plugin 器                      │
│  每个 task 一个 ephemeral utility        │
└─────────────────────────────────────────┘
```

> **当前(已落地):** 单 SPA,浏览器进程内 Vue 3 直接跑。Pinia store 充当"main 状态"的代理(用 mock 数据)。Renderer/Mian/Utility 仍是一个 JS 线程内的不同 store + composable,等 Phase 2 上 Electron + Koa 时再拆。

**职责切分(规划):**
- **Renderer** 只画状态,不持有业务逻辑。状态从 main 推下来(stream)。
- **Main** 是 Agent 的大脑:对话树、节点状态机、规划、LLM 调用、棋谱记录、权限判定。不直接碰危险操作。
- **Utility** 是 Agent 的手:每个 task fork 一个临时 utility,执行完销毁。崩了不垮 main。安全边界在这里。

## 1.3 Agent 循环(对话树 + 节点状态机)

整个任务执行是**对话树**,不是线性日志。每个节点是树中的一个 step,节点内部是个小状态机。

```
        ┌──────────┐
        │  IDLE    │ ← 布势产物到达
        └────┬─────┘
             ↓
        ┌──────────┐  用户否决/修正 → FORK
        │  PONDER  │──────────────┐
        │ (长考推演)│              │
        └────┬─────┘              ↓
        用户确认 │           ┌──────────┐
             ↓           │ STOPPED   │←─ 用户 STOP
        ┌──────────┐     │ (停在此处) │ 任意 running 节点
        │  SPLIT   │     └────┬─────┘
        │ (分投拆解)│          │ 用户 FORK 此处
        └────┬─────┘          │ → 新分支长出
             ↓           (回到 PONDER 或 SPLIT)
        ┌──────────┐
        │ EXECUTE  │←── 每个子任务一个 utility
        │ (逐枚落子)│    每步前过权限网关
        └────┬─────┘
             ↓
        ┌──────────┐
        │  DONE    │→ 生成棋谱(.yi.json)→ 收官总结卡
        │ (收官)    │
        └──────────┘
        用户可在任意历史节点 FORK(改指令,长新分支,原分支保留)
```

**关键设计:**
- 对话树是单一真相源,Renderer 订阅它的快照。棋枰上棋子点亮 = 树进入 EXECUTE 某子任务。
- PONDER 的推理链以 stream 推给 Renderer 的"小目"窗。
- 权限网关在 EXECUTE 每步前拦截,按 4 级模式判定(见 3.2)。
- STOP = 中断当前 running 节点,递归停子 utility,节点置 stopped,不删。
- FORK = 在任意历史节点下创建新 intent 节点,原分支保留。
- **MVP 边界:** fork 只重置对话与计划,**不自动回滚已执行的文件改动**。已改文件由棋谱记录,用户手动逆向。文件级快照是 Phase 2。

## 1.4 项目结构(单 client app)

> **当前(已落地):** 单一 Vue 3 SPA,无 monorepo。`apps/client/` 跑全部前端 + 集成第三方能力(monaco / xterm / vue-flow)。后端 / Electron / utility 进程未启动。

```
yi-agent-studio/
├── apps/
│   └── client/                     Vue 3 SPA (Phase 1 主战场)
│       ├── public/                 静态资源 (logo.png / favicon.ico)
│       ├── src/
│       │   ├── App.vue             根组件 + 路由出口
│       │   ├── main.ts             入口:createApp + Pinia + router + i18n
│       │   ├── router/             vue-router 4 (hash 模式, 全部 #/yi/...)
│       │   ├── stores/             Pinia: chat/profiles/app/settings/...
│       │   ├── components/         业务组件 (chat / skills / settings / layout)
│       │   │   ├── layout/         AppSidebar / PageSidebar / ThemeSwitch / ...
│       │   │   ├── chat/           ChatPanel / ChatInput / MessageList / ModelSelector
│       │   │   └── ...
│       │   ├── views/              路由 view: ChatView / SkillsView / ProfilesView / ...
│       │   ├── api/                REST + WebSocket 客户端封装
│       │   ├── composables/        useTheme / useKeyboard / ...
│       │   ├── i18n/               vue-i18n 多语言 (9 语言)
│       │   │   └── locales/        zh / en / ja / ko / fr / de / ru / es / pt + zh-TW
│       │   └── styles/             variables.scss (深色木质配色) + 全局样式
│       ├── index.html              SPA 入口
│       ├── vite.config.ts          Vite 构建配置 (manualChunks: monaco/mermaid/xterm 分包)
│       ├── tsconfig.json           TypeScript 5.8 配置
│       └── package.json            见 1.1 表
└── docs/
    └── superpowers/
        ├── specs/                  设计与架构文档
        │   ├── 2026-06-25-yi-product-design.md
        │   └── 2026-06-25-yi-tech-architecture.md  (本文档)
        └── plans/                  实施计划
            ├── 2026-06-25-yi-mvp-walking-skeleton.md
            └── 2026-06-25-yi-mvp-frontend-first.md
```

**演进路径:** Phase 2 起 Koa 后端 + Electron 壳 + utilityProcess 时,会拆 monorepo(`apps/desktop` + `packages/shared` + `packages/assets` + `packages/storage`)。当前为节省迁移成本,所有代码集中在 `apps/client/`。

---

# 二、数据与资产层

## 2.1 对话树(任务流的核心数据结构)

整个任务执行是对话树。承接 fork 模型的关键。

### 2.1.1 节点结构

每个节点是树中的一个 step,统一用 `YiNode` 表示:

```typescript
// packages/shared/types/node.ts
export type NodeType =
  | 'intent'      // 布势:用户输入的意图
  | 'ponder'      // 长考:Agent 推理链
  | 'plan'        // 分投:拆解出的子任务列表
  | 'action'      // 落子:单步工具执行
  | 'result'      // 收官:总结卡
  | 'checkpoint'; // 用户主动打的检查点(便于 fork 定位)

export interface YiNode {
  id: string;              // ULID
  parentId: string | null; // null = 根
  type: NodeType;
  status: 'running' | 'done' | 'stopped' | 'error';
  createdAt: string;       // ISO
  payload: IntentPayload | PonderPayload | PlanPayload
         | ActionPayload | ResultPayload | CheckpointPayload;
  childrenIds: string[];   // fork 产生的子分支
}

export interface IntentPayload {
  input: string;           // 文本/语音转写
  attachments: string[];   // 圈选/拖入的文件路径
  mountedAssets: {
    type: 'expert-pack' | 'tesuji' | 'qijing';
    ref: string;
  }[];
  mode: 'plan' | 'ask' | 'trusted' | 'bypass';  // 本轮执行模式
}

export interface PonderPayload {
  reasoning: string;       // 推理链文本(stream 进来)
  modelUsed: string;
  tokensIn: number;
  tokensOut: number;
}

export interface PlanPayload {
  steps: {
    id: string;
    description: string;
    tool: string;
    argsPreview: string;
  }[];
}

export interface ActionPayload {
  stepId: string;
  tool: string;
  args: unknown;
  result: unknown;
  error?: string;
  durationMs: number;
}

export interface ResultPayload {
  summary: string;
  changes: { path: string; op: 'create' | 'modify' | 'delete' }[];
  durationMs: number;
  tokensTotal: number;
}

export interface CheckpointPayload {
  label: string;
}
```

### 2.1.2 树操作

- **Stop:** 把当前 running 节点置 `stopped`,递归停掉子 utility 进程。不删节点。
- **Fork(parentId, newInput):** 在 `parentId` 下创建新 `intent` 节点,`newInput` 作为新分支起点。原分支的 childrenIds 追加新节点 id。
- **Resume(nodeId):** 跳到任意历史节点继续(只读视图,不改原分支)。
- **Edit & Retell:** = Fork 的一种,在 intent 节点改 input,重新长出分支。

### 2.1.3 持久化

整棵树存一个 `.yi/tree.json`(单任务一棵树)。简单、可 git、可打包上架交易。

**棋谱(.yi.json)= 这棵树的导出快照 + 元数据:**

```yaml
id: <ulid>
title: <自动生成的任务标题>
createdAt: <iso>
mode: ask
model: gpt-4o
tree: <YiNode 树, 嵌入或引用 tree.json>
assets_used:
  - type: tesuji
    ref: <id>
    version: <semver>
tags: [周报, 研报]
```

## 2.2 资产格式

所有资产统一原则:**目录制 + manifest.yaml + 内容文件**。可 git、可打包、可上架。每种资产一个目录,顶层 `manifest.yaml` 声明元数据和依赖。

### 2.2.1 通用 manifest 字段

```yaml
id: <ulid>
type: tesuji | tool | relay | soul | qijing | expert-pack
name: <显示名>
version: 0.1.0                # semver
author: <handle>
license: MIT | 商业 | 自定义
price: 0                      # 0 = 分享;>0 = 交易(单位:美元分)
description: <一句话>
dependencies:                 # 引用其他资产(用于引用组包分账)
  - ref: <asset id>
    version: ^0.1.0
    share: 30                 # 分账百分比,0-100 之和 ≤ 100
```

### 2.2.2 手筋(Tesuji)= Skill

```
tesuji-research-summary/
├── manifest.yaml
├── prompt.md              # 能力单元的 prompt 模板,带 {{变量}}
├── tools.yaml             # 声明此手筋需要的工具/驿
└── tests/
    └── example.json
```

`tools.yaml` 例:
```yaml
requires:
  - tool: fs.read
  - tool: browser.fetch
  - relay: sec-api
```

### 2.2.3 器(Tool)= Plugin

```
tool-pdf-parser/
├── manifest.yaml
├── index.ts               # 实现 Tool 接口
└── tests/
```

Tool 接口(`packages/shared/types/tool.ts`):
```typescript
export interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  run(args: unknown, ctx: ToolContext): Promise<unknown>;
}
export interface ToolContext {
  workdir: string;
  logger: Logger;
  permission: 'plan' | 'ask' | 'trusted' | 'bypass';
}
```

### 2.2.4 驿(Relay)= MCP

```
relay-sec-api/
├── manifest.yaml
├── config.yaml            # MCP server 启动参数/env
└── README.md
```
`config.yaml` 例:
```yaml
mcp:
  transport: stdio | http
  command: node
  args: [./server.js]
  env:
    SEC_API_KEY: ${SEC_API_KEY}
```
弈运行时拉起 MCP server,通过标准 MCP 协议通信。不重新发明。

### 2.2.5 棋魂(Soul)= Character

```
soul-calm-analyst/
├── manifest.yaml
└── soul.md                # 仿 soul.md: 人格/语气/价值观/思维风格
```
`soul.md` 是纯 prompt 片段,拼到 system prompt。

### 2.2.6 棋经(Qijing)= 弈独有,MVP 形态

```
qijing-investment-memo/
├── manifest.yaml
├── index.md               # 棋经入口:目录/导读/引用说明
├── sources/               # 典籍层:原文
│   ├── report-q1.pdf
│   ├── report-q2.pdf
│   └── notes.md
└── digest/                # 简编层:MVP = 结构化 md
    ├── company-a.md
    ├── company-b.md
    └── index.md           # 简编目录 + 引用回 sources 的映射
```

**MVP 检索:** 全文检索(ripgrep 调用,或 minisearch 纯 TS)。digest 文件用 `[[source:report-q1.pdf#page=3]]` 语法回链典籍。Agent 引用时把 digest 塞进 prompt,需要原文再按回链取。

**Phase 2 升级路径:** digest 目录加 `vectors/` 子目录存 embedding,换向量检索,文件结构不变。

### 2.2.7 专家包(Expert Pack)= 组合体

```
expert-value-investor/
├── manifest.yaml          # type: expert-pack
├── composition.yaml       # 组合声明
└── README.md
```

`composition.yaml`:
```yaml
soul:
  ref: <soul-calm-analyst id>
  version: ^0.1.0
tesujis:
  - ref: <tesuji-research-summary id>
    version: ^0.1.0
  - ref: <tesuji-financial-read id>
    version: ^0.1.0
qijing:
  ref: <qijing-investment-memo id>   # 可引用他人棋经
  version: ^0.1.0
  share: 30                          # 分给棋经原作者 30%
tools:
  - ref: <tool-pdf-parser id>
relays:
  - ref: <relay-sec-api id>
```

**引用组包的关键:** 这里 `ref` 指向别人已上架的资产,不复制内容。买家拿到专家包,运行时按 ref + version 拉取(若已购/免费则直取;若未购则提示购买)。分账按 `share` 字段总和 ≤ 100 校验。

## 2.3 资产锁定机制(双开关,互斥)

用户对自己资产库里的每个资产有**两个独立开关**,分别控制"是否跟随上游"和"是否允许本地改"。**两个开关互斥:不能同时为 on**——本地改动会被上游更新覆盖,语义冲突。

| 开关 | 作用 | on | off |
|---|---|---|---|
| **autoUpdate** | 是否从上游拉新版 | 自动跟随满足 manifest `version` 约束的新版 | 钉当前版本,不拉上游 |
| **editable** | 是否允许本地改动资产内容 | 可本地改(自己进化) | 内容锁定,防本地改动 |

**互斥约束:** `autoUpdate && editable` 是非法状态(本地改动会被上游更新覆盖,语义冲突)。`!autoUpdate && !editable`(双 off)是合法的(完全冻结)。即:至多一个 on,可以都 off。UI 里开一个、另一个自动关;两个都关则保持都关。资产加载器加载时校验,违反则报错。

三种有效组合(第四种 both on 禁止):

| autoUpdate | editable | 场景 |
|---|---|---|
| on | off | 下载别人的、信任上游(订阅模式) |
| off | off | 下载别人的、不信任上游(完全冻结) |
| off | on | fork 别人的自己改,或自有资产(钉/无上游 + 本地改) |

> 注:自有资产无上游,autoUpdate 实质为 off,editable 为 on,落在这三组合里。

用户级 `installed-assets.yaml`(`~/.yi/installed-assets.yaml`):

```yaml
installed:
  - ref: <asset id>
    version: 0.1.2        # 当前装的版本
    autoUpdate: false     # false = 钉当前版本不拉上游;true = 自动跟随满足 manifest 约束的新版
    editable: false       # false = 内容锁定防本地改;true = 允许本地改动(自己进化)
    source: registry | local | git
    installedAt: <iso>
```

**行为:**
- `autoUpdate: true`(且 editable 必为 false)—— 资产加载器定期(或启动时)检查上游,拉取满足 manifest `version` 约束的最新版替换。
- `autoUpdate: false` —— 跳过更新检查,永远用 `version` 指定版本。上游变更不影响本地。
- `editable: false` —— 资产内容只读,UI 不允许编辑,文件系统层标只读。防自己意外改坏下载的资产。
- `editable: true`(且 autoUpdate 必为 false)—— 内容可本地修改,本地改动不回传上游(除非显式 publish)。
- **互斥校验:** 两个开关不能同时 true。UI 开一个自动关另一个;加载器加载时校验,违反报错。
- **MVP 简化:** autoUpdate 只做"启动时检查一次",不做后台定时轮询。定时轮询是 Phase 2。editable 的只读保护 MVP 用文件权限标记 + UI 禁编辑,不做文件系统级强隔离(那是 Phase 2 资产沙箱)。

## 2.4 IPC 协议(三进程通信)

类型安全 channel,定义在 `packages/shared/ipc/`。用 tRPC-style 的 router 模式,但走 Electron IPC。

### 2.4.1 Renderer ↔ Main

```typescript
// packages/shared/ipc/renderer-router.ts
export const rendererRouter = {
  intent: {
    submit: (input: IntentInput) => { nodeId: string };
  },
  control: {
    stop: (nodeId: string) => void;
    fork: (parentId: string, newInput: IntentInput) => { nodeId: string };
    resume: (nodeId: string) => void;
    setMode: (mode: 'plan' | 'ask' | 'trusted' | 'bypass') => void;
  },
  permission: {
    respond: (requestId: string, allow: boolean) => void;
  },
  query: {
    tree: () => YiNode[];
    node: (id: string) => YiNode;
    assets: () => AssetManifest[];
  },
  subscribe: {
    ponder: (nodeId: string) => AsyncIterable<string>;
    state: () => AsyncIterable<AgentState>;
  },
  assets: {
    setAutoUpdate: (ref: string, on: boolean) => void;  # 开 autoUpdate 自动关 editable
    setEditable: (ref: string, on: boolean) => void;    # 开 editable 自动关 autoUpdate
    update: (ref: string) => void;     # 手动拉新版(autoUpdate 关时也可手动触发)
  },
};
```

### 2.4.2 Main ↔ Utility

```typescript
// packages/shared/ipc/utility-router.ts
export const utilityRouter = {
  tool: {
    execute: (req: { tool: string; args: unknown; ctx: ToolContext })
      => AsyncIterable<ToolEvent>;
  },
  mcp: {
    call: (req: { relay: string; method: string; args: unknown })
      => unknown;
  },
};
```

每个 task fork 一个 utility,执行完销毁。utility 不持有状态,纯执行体。

---

# 三、工具链与本地能力

## 3.1 工具清单

Utility process 内置工具,实现 `Tool` 接口(见 2.2.3)。

| 工具 | 弈中称 | 能力 | MVP |
|---|---|---|---|
| `fs` | 器·文件 | read/write/move/list,工作目录受限 | ✅ |
| `shell` | 器·终端 | 跑命令,白名单/确认 | ✅ |
| `browser` | 器·浏览器 | fetch/navigate/extract,Playwright 驱动 | ✅(基础) |
| `mcp` | 驿 | 调外部 MCP server | ✅ |

**MVP 工具只 4 件。** fs/shell/browser/mcp 覆盖产品设计里所有"真实操作"场景。读屏和键鼠模拟不做(风险高、收益对 MVP 不关键)。

**工作目录边界:** 每个 task 启动时确定 `workdir`(用户指定或从布势推断)。fs/shell 工具默认在 workdir 及其子树;越界操作按权限模式处理(见 3.2)。

## 3.2 权限模型(4 级)

| 模式 | 行为 | 适用 |
|---|---|---|
| **PLAN** | read-only 推演,不执行任何工具 | 想先看 Agent 怎么打算 |
| **ASK** | 每步工具调用弹窗确认 | 不熟的场景,谨慎 |
| **TRUSTED** | workdir 内随意执行不弹窗;**越界 workdir 才询问** | 日常信任的本地任务 |
| **BYPASS** | 完全不拦,包括越界 | 完全信任,用户自担风险 |

**权限网关在 EXECUTE 每步前拦截,按当前会话模式判定。** 模式可按会话或任务切换。PLAN 模式下 Agent 只出推演不调工具;ASK 每步弹;TRUSTED workdir 内直放、越界弹;BYPASS 全放。

## 3.3 本地能力(支撑落子的非工具件)

| 能力 | 实现 | MVP |
|---|---|---|
| **LLM 客户端** | OpenAI 兼容 HTTP client,baseURL/key 可配(用户填云端或本地 ollama url) | ✅ |
| **Planner** | 两步:① 生成 PlanPayload(调 LLM 出步骤列表)② 逐步执行调 tool。MVP 线性执行 + 用户 fork 修正,不做多轮 ReAct | ✅ |
| **棋谱 Recorder** | 监听状态机事件,写 `.yi/tree.json` + 收官时导出 `.yi.json` | ✅ |
| **全文检索** | 调 ripgrep 子进程或 minisearch(TS),检索棋经 digest | ✅ |
| **资产加载器** | 读 manifest.yaml + composition.yaml,解析依赖,校验 share 和 ≤ 100,查 installed-assets.yaml 判 autoUpdate/editable | ✅ |
| **权限网关** | 在 EXECUTE 每步前按 4 级模式判定 | ✅ |
| **向量检索** | digest + vectors | Phase 2 |
| **弈林市场协议** | 上传/拉取/分账/引用依赖解析 | Phase 3 |

## 3.4 IPC 实现选型

- **Renderer ↔ Main:** Electron `ipcMain`/`ipcRenderer` + 自建类型安全封装(`packages/shared/ipc/`)。Stream 用 `webContents.send` 推送。
- **Main ↔ Utility:** `utilityProcess.fork()`,用 Node `MessagePort` 通信。Utility 崩溃自动重报给 main,不垮 main。

## 3.5 安全与信任边界

| 层 | 边界 | 机制 |
|---|---|---|
| 工具进程 | utility 崩溃不垮 app | utilityProcess 隔离 + 自动销毁 |
| 文件系统 | 越界 workdir | TRUSTED 模式询问,BYPASS 模式放行,PLAN/ASK 按各自规则 |
| Shell | 任意命令 | 白名单常用 + 非白名单按权限模式处理 |
| 网络 | 新域名/新 endpoint | 首次按权限模式处理,记住会话内 |
| 资产 | 执行他人手筋/器代码 | sandbox 里跑,主进程不直接 require |
| LLM | 云端 | baseURL 可配,用户自担 |

## 3.6 路线图(技术,对齐产品阶段)

> **当前进度:** Phase 1(前端先行)已在跑,后端 / 三层进程 / 对话树 / 工具集 / 资产全部**未实现**,等 Phase 2 起步。

| 阶段 | 技术 | 对应产品阶段 | 状态 |
|---|---|---|---|
| **Phase 1**(当前) | **Vue 3 + Vite + Pinia + Naive UI + TS 单 SPA**,跑前端 + mock 状态;9 语言 i18n;深色木质主题 | MVP 前置(0→0.5) | ✅ 在跑 |
| **MVP** | Electron + Vue 3 + TS,三层进程,对话树,4 工具(fs/shell/browser/mcp),OpenAI 兼容 LLM(自定义 baseURL),棋经 md+全文检索,资产目录制+manifest,资产锁定,4 级权限 | MVP(0→1) | ⏳ Phase 2 |
| **Phase 2** | Koa 后端 + utilityProcess 拆进程;向量检索、资产沙箱强隔离、资产自动更新检查 | 种子期 | ⏳ |
| **Phase 3** | 弈林市场协议(上传/拉取/分账)、引用依赖解析与冻结、云端棋经同步 | 商业化 | ⏳ |
| **Phase 4** | 官方专家包矩阵 infra、创作者 dashboard、团队协作 | 生态期 | ⏳ |

## 3.7 MVP 验收标准(技术)

1. 用户能按 `Cmd/Ctrl+Shift+Y` 唤出输入条,输入自然语言意图
2. Agent 走完 PONDER → SPLIT → EXECUTE → DONE,棋枰可视化对应
3. 能调 fs/shell/browser/mcp 至少一种完成真实任务(如"整理下载文件夹里上个月的照片")
4. 随时 STOP,从任意历史节点 FORK 改指令重跑
5. 收官生成 `.yi.json` 棋谱,可重新加载查看
6. 4 级权限模式可切换:PLAN 只推演,ASK 逐次确认,TRUSTED workdir 内直放越界询问,BYPASS 全放
7. 资产可装/设双开关(autoUpdate/editable,互斥),autoUpdate 控上游跟随,editable 控本地改保护
8. LLM baseURL 可配,填云端或本地 ollama url 都能跑

---

# 四、待定事项(留待专题或后续阶段)

1. **棋经的具体 schema 细节** —— digest md 的 frontmatter 字段、`[[]]` 引用语法完整规范。本文档定方向。
2. **向量检索方案** —— Phase 2 选型(sqlite-vec / LanceDB / 其他)。
3. **棋谱(.yi.json)完整字段规范** —— 开放标准的字段定义、导出格式。
4. **市场协议细节** —— 上传/拉取/分账/引用依赖解析/版本冻结。Phase 3。
5. **棋魂(Character)完整规范** —— soul.md 的字段约定。
6. **资产沙箱强隔离** —— Phase 2 选型(V8 isolate / worker_threads / 其他)。

---

# 五、技术决策记录(ADR 摘要)

> Phase 1(已落地) vs Phase 2+(规划)分开记。当前 Phase 1 单 SPA 跑前端 + mock 状态;Phase 2 起 Electron 壳 + Koa 后端 + utilityProcess 时再启用相关项。

| 决策 | 状态 | 选择 | 理由 |
|---|---|---|---|
| UI 框架 | ✅ Phase 1 | **Vue 3.5 + TypeScript + `<script setup>`** | 生态成熟,Naive UI 主题化适合深色木质,Pinia 简洁,vue-i18n 多语言零 boilerplate |
| 构建 | ✅ Phase 1 | **Vite 8** | HMR 快,manualChunks 拆 monaco/mermaid/xterm,esbuild 压缩 |
| 状态管理 | ✅ Phase 1 | **Pinia 3** | 模块化 store(chat/profiles/app/settings),TypeScript 友好 |
| 组件库 | ✅ Phase 1 | **Naive UI 2** | 完整 NButton/NModal/NDropdown/...;CSS 变量驱动主题切换 |
| 路由 | ✅ Phase 1 | **vue-router 4 (hash 模式)** | 静态文件部署友好;`#/yi/...` |
| Shell | ⏳ Phase 2 | Electron 30+ | 跨平台桌面壳,等 SPA 跑稳后接 |
| 主进程 | ⏳ Phase 2 | Node.js (Electron main) | Agent 循环:规划/调度/棋谱/状态机 |
| 工具进程 | ⏳ Phase 2 | Electron utilityProcess | 工具执行:fs/shell/browser/mcp,隔离沙箱 |
| 三层进程拓扑 | ⏳ Phase 2 | renderer / main / utility | 安全边界 + 稳定性 + Electron 原生 utilityProcess |
| 后端运行时 | ⏳ Phase 2 | Koa + @koa/router/cors/bodyparser | 依赖已装,代码未起;REST + WebSocket |
| LLM 集成 | ⏳ Phase 2 | OpenAI 兼容 HTTP client,自定义 baseURL | 不做本地集成,用户填云端或 ollama url |
| 存储 | ✅(概念)/ ⏳(实现) | 全文件(yaml/json/md) | 可 git、可打包、可上架;SQLite 留到检索瓶颈 |
| 棋经检索(MVP) | ⏳ Phase 2 | md + 全文检索 | 简单可版本化;向量留 Phase 2 |
| 权限模型 | ⏳ Phase 2 | 4 级(PLAN/ASK/TRUSTED/BYPASS) | 对齐 opencode,TRUSTED 为日常本地任务 |
| Undo 模型 | ⏳ Phase 2 | 对话树 fork(非文件回滚) | 对齐 opencode,文件快照 Phase 2 |
| 工具集(MVP) | ⏳ Phase 2 | fs/shell/browser/mcp 4 件 | 覆盖核心场景,读屏/键鼠不做 |
| 资产格式 | ⏳ Phase 2 | 目录制 + manifest.yaml | 统一、可 git、可上架、支持引用依赖 |
| 资产版本 | ⏳ Phase 2 | installed-assets.yaml + 双开关互斥(autoUpdate/editable) | 互斥:autoUpdate 控上游跟随,editable 控本地改;不能同时 on |
| 包管理 | ✅ Phase 1 | **npm 单包**;Phase 2 起迁 pnpm monorepo | 当前节省迁移成本;Phase 2 拆 `shared`/`assets`/`storage` 清晰拆包 |
