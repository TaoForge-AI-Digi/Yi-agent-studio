# 弈 MVP · 子计划 C:前端先行 (Vue 3 + Vite SPA, Mock State) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **状态:** 历史规划稿。原计划为 Electron + React + Zustand + pnpm monorepo,**实际落地已改方案**:Vue 3 + Vite + Pinia + Naive UI 的单 SPA(`apps/client/`),无 monorepo,无 Electron,状态走 mock。Phase 1 任务见同目录 `2026-06-25-yi-mvp-walking-skeleton.md`。技术栈全景见 `docs/superpowers/specs/2026-06-25-yi-tech-architecture.md` §1.1 / §1.4 / §3.6 / §五 ADR。

**Goal:** 搭出弈的完整前端——浏览器/Vite dev server 窗口里看见棋枰/侧栏/对话/输入条/模式切换/资产开关/角色/典藏/市场,状态用 mock(硬编码对话树 + 假 stream),棋谱可 load/save。让创始人先看见产品样子,真能力(后端 / 三层进程 / utility 沙箱)后续接入。

**Architecture:** 单 Vue 3 SPA(`apps/client/`)。Vite 8 跑 dev server + 生产构建,Pinia 3 管状态,Naive UI 2 提供组件,vue-router 4 (hash 模式)管路由,vue-i18n 11 管多语言。当前由抄自 hermes-studio 的 287 个 Vue 文件 + 9 语言 i18n + 深色木质主题构成壳,内填奕品牌。

**Tech Stack:** TypeScript 5.8、Vue 3.5、`<script setup>`、Vite 8、Pinia 3、Naive UI 2、vue-router 4、vue-i18n 11、monaco-editor、xterm.js、@vue-flow/core、markdown-it + katex + highlight.js + mermaid、Vitest 3、Playwright、js-yaml、adm-zip。详见 `docs/superpowers/specs/2026-06-25-yi-tech-architecture.md` §1.1。

## Global Constraints

- 全 TypeScript,`strict: true`。SPA 由 Vite 处理 ESBuild,无 main 进程
- 单包,无 workspace
- ESM,`vite.config.ts` 配 `manualChunks` 拆 monaco/mermaid/xterm/vue-vendor/ui-vendor
- TDD:每个任务先写失败测试再实现(组件测试用 Vitest + @testing-library/react)
- 提交粒度:每任务一 commit,约定式 message
- 不引入未列出依赖。LLM/真工具/真 AgentLoop 在 B/A 残余,本计划全 mock
- 资产双开关互斥:autoUpdate && editable 非法,UI 开一个自动关另一个,可都 off
- UI 基调:围棋隐喻(棋枰=主视图、棋子=节点、小目=推演窗、收官=总结卡),深色木质/素雅,非花哨

---

## File Structure

```
yi-agent-studio/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── package.json
├── packages/
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── node.ts          # YiNode + payloads (UI 契约)
│   │       ├── permission.ts    # PermissionMode
│   │       └── asset.ts         # AssetInstallState (双开关)
│   └── assets/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           └── qipu.ts          # writeQipu / readQipu
└── apps/
    └── desktop/
        ├── package.json
        ├── tsconfig.json
        ├── electron.vite.config.ts
        ├── electron/
        │   ├── main.ts          # Electron main: 创建窗口
        │   └── preload.ts       # 桥接 mock 状态源
        └── src/
            ├── main/            # (空,留 A 残余)
            ├── renderer/
            │   ├── index.html
            │   ├── main.tsx
            │   ├── App.tsx
            │   ├── state/
            │   │   ├── store.ts         # Zustand store
            │   │   └── mock-data.ts     # 硬编码对话树 + 假 stream
            │   ├── components/
            │   │   ├── Qipan.tsx        # 棋枰:树视图
            │   │   ├── Qizi.tsx         # 棋子:节点 + 动画
            │   │   ├── Xiaomu.tsx       # 小目:推演窗
            │   │   ├── ShouGuan.tsx     # 收官:总结卡
            │   │   ├── BuShiBar.tsx     # 布势输入条
            │   │   ├── ModeSwitch.tsx   # 模式切换
            │   │   └── AssetLocks.tsx   # 资产双开关
            │   └── styles.css
            └── index.ts
```

`shared` 零运行时依赖。`assets` 依赖 `shared`+`js-yaml`。`desktop` 依赖全部 + Electron 生态。

---

## Task 1: Monorepo + Electron + Vite + React scaffold

**Files:**
- Create: `pnpm-workspace.yaml`, `tsconfig.base.json`, `package.json` (root)
- Create: `packages/shared/{package.json,tsconfig.json}`, `packages/assets/{package.json,tsconfig.json}`, `apps/desktop/{package.json,tsconfig.json,electron.vite.config.ts}`

**Interfaces:**
- Consumes: none
- Produces: 可 `pnpm install` + `pnpm dev` 打开空白 Electron 窗口的骨架

- [ ] **Step 1: workspace 根**

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "declaration": true,
    "sourceMap": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

`package.json` (root):
```json
{
  "name": "yi-agent-studio",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter @yi/desktop dev",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: packages**

`packages/shared/package.json`:
```json
{
  "name": "@yi/shared",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "scripts": { "typecheck": "tsc --noEmit", "test": "vitest run" }
}
```
`packages/shared/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "include": ["src"] }
```

`packages/assets/package.json`:
```json
{
  "name": "@yi/assets",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "scripts": { "typecheck": "tsc --noEmit", "test": "vitest run" },
  "dependencies": {
    "@yi/shared": "workspace:*",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": { "@types/js-yaml": "^4.0.9" }
}
```
`packages/assets/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "include": ["src"] }
```

- [ ] **Step 3: apps/desktop package**

`apps/desktop/package.json`:
```json
{
  "name": "@yi/desktop",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "electron-vite dev",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@yi/shared": "workspace:*",
    "@yi/assets": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "framer-motion": "^11.2.0",
    "ulid": "^2.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "electron": "^30.0.0",
    "electron-vite": "^2.2.0",
    "vite": "^5.2.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jsdom": "^24.0.0"
  }
}
```
`apps/desktop/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "include": ["src", "electron"] }
```

`apps/desktop/electron.vite.config.ts`:
```typescript
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: { build: { rollupOptions: { input: { index: 'electron/main.ts' } } } },
  preload: { build: { rollupOptions: { input: { index: 'electron/preload.ts' } } } },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
  },
});
```

> 注:`@vitejs/plugin-react` 需加入 devDependencies。Step 3 末补 `"@vitejs/plugin-react": "^4.2.0"` 到 devDependencies。

- [ ] **Step 4: 最小 Electron main + preload + 空白 React**

`apps/desktop/electron/main.ts`:
```typescript
import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
    },
  });
  win.loadFile(join(__dirname, '../renderer/index.html'));
});
```

`apps/desktop/electron/preload.ts`:
```typescript
// 桥接,本计划先空,后续任务填 mock API
export {};
```

`apps/desktop/src/renderer/index.html`:
```html
<!doctype html>
<html><head><meta charset="utf-8"><title>弈</title></head>
<body><div id="root"></div><script type="module" src="./main.tsx"></script></body></html>
```

`apps/desktop/src/renderer/main.tsx`:
```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

createRoot(document.getElementById('root')!).render(<App />);
```

`apps/desktop/src/renderer/App.tsx`:
```typescript
import React from 'react';
export function App() { return <div>弈 — 棋枰将在此</div>; }
```

各包 `src/index.ts` 写 `export {};` 让 typecheck 过。

- [ ] **Step 5: 安装并验证**

Run: `pnpm install`
Run: `pnpm -r typecheck`
Expected: 通过

- [ ] **Step 6: 手动启动验证窗口**

Run: `pnpm dev`
Expected: 打开 Electron 窗口,显示"弈 — 棋枰将在此"。手动关闭窗口后继续。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: Electron + Vite + React monorepo scaffold"
```

---

## Task 2: packages/shared — UI 契约类型

**Files:**
- Create: `packages/shared/src/{node.ts,permission.ts,asset.ts,index.ts}`, `packages/shared/src/node.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `YiNode`, `NodeType`, 6 payloads, `PermissionMode`, `AssetInstallState`, `AssetRef` —— 全 UI 依赖

- [ ] **Step 1: 失败测试**

`packages/shared/src/node.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import type { YiNode, IntentPayload } from './node.js';

describe('YiNode', () => {
  it('构造 intent 节点', () => {
    const n: YiNode = {
      id: '01H', parentId: null, type: 'intent', status: 'done',
      createdAt: '2026-06-25T00:00:00Z',
      payload: { input: '整理', attachments: [], mountedAssets: [], mode: 'ask' } satisfies IntentPayload,
      childrenIds: [],
    };
    expect(n.type).toBe('intent');
  });
});
```

- [ ] **Step 2: 跑确认失败**

Run: `pnpm --filter @yi/shared test` → FAIL (module not found)

- [ ] **Step 3: 实现 `permission.ts`**

```typescript
export type PermissionMode = 'plan' | 'ask' | 'trusted' | 'bypass';
```

- [ ] **Step 4: 实现 `node.ts`**

```typescript
import type { PermissionMode } from './permission.js';

export type NodeType = 'intent' | 'ponder' | 'plan' | 'action' | 'result' | 'checkpoint';
export type NodeStatus = 'running' | 'done' | 'stopped' | 'error';

export interface IntentPayload {
  input: string; attachments: string[];
  mountedAssets: { type: 'expert-pack' | 'tesuji' | 'qijing'; ref: string }[];
  mode: PermissionMode;
}
export interface PonderPayload {
  reasoning: string; modelUsed: string; tokensIn: number; tokensOut: number;
}
export interface PlanStep { id: string; description: string; tool: string; argsPreview: string; }
export interface PlanPayload { steps: PlanStep[]; }
export interface ActionPayload {
  stepId: string; tool: string; args: unknown; result: unknown; error?: string; durationMs: number;
}
export interface ResultPayload {
  summary: string; changes: { path: string; op: 'create' | 'modify' | 'delete' }[];
  durationMs: number; tokensTotal: number;
}
export interface CheckpointPayload { label: string; }

export type NodePayload =
  | IntentPayload | PonderPayload | PlanPayload
  | ActionPayload | ResultPayload | CheckpointPayload;

export interface YiNode {
  id: string; parentId: string | null; type: NodeType; status: NodeStatus;
  createdAt: string; payload: NodePayload; childrenIds: string[];
}
```

- [ ] **Step 5: 实现 `asset.ts`**

```typescript
export interface AssetRef { type: string; ref: string; version: string; }

export interface AssetInstallState {
  ref: string;
  version: string;
  autoUpdate: boolean;   // 跟随上游
  editable: boolean;     // 允许本地改
  source: 'registry' | 'local' | 'git';
  installedAt: string;
}

// 互斥校验:autoUpdate && editable 非法;可都 off
export function isValidLockCombo(s: { autoUpdate: boolean; editable: boolean }): boolean {
  return !(s.autoUpdate && s.editable);
}
```

- [ ] **Step 6: `index.ts`**

```typescript
export * from './node.js';
export * from './permission.js';
export * from './asset.js';
```

- [ ] **Step 7: 测试通过 + Commit**

Run: `pnpm --filter @yi/shared test` → PASS
```bash
git add packages/shared
git commit -m "feat(shared): YiNode/payload/PermissionMode/AssetInstallState 类型"
```

---

## Task 3: packages/assets — 棋谱读写

**Files:**
- Create: `packages/assets/src/{qipu.ts,index.ts,qipu.test.ts}`

**Interfaces:**
- Consumes: `@yi/shared`, `js-yaml`, `node:fs/promises`
- Produces: `Qipu`, `QipuMeta`, `writeQipu`, `readQipu`

- [ ] **Step 1: 失败测试**

`packages/assets/src/qipu.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeQipu, readQipu } from './qipu.js';
import type { YiNode } from '@yi/shared';

const tree: YiNode[] = [
  { id: 'n1', parentId: null, type: 'intent', status: 'done', createdAt: 't',
    payload: { input: 'hi', attachments: [], mountedAssets: [], mode: 'ask' }, childrenIds: ['n2'] },
  { id: 'n2', parentId: 'n1', type: 'result', status: 'done', createdAt: 't',
    payload: { summary: 'done', changes: [], durationMs: 1, tokensTotal: 0 }, childrenIds: [] },
];

describe('qipu', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'yi-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });
  it('读写棋谱一致', async () => {
    await writeQipu(join(dir, 't.yi.json'), {
      meta: { id: 't1', title: 'T', createdAt: 't', mode: 'ask', model: 'stub', assetsUsed: [], tags: [] },
      tree,
    });
    const got = await readQipu(join(dir, 't.yi.json'));
    expect(got.tree).toEqual(tree);
    expect(got.meta.title).toBe('T');
  });
});
```

- [ ] **Step 2: 跑确认失败** → Run: `pnpm --filter @yi/assets test` → FAIL

- [ ] **Step 3: 实现 `qipu.ts`**

```typescript
import type { YiNode, PermissionMode } from '@yi/shared';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import yaml from 'js-yaml';

export interface QipuMeta {
  id: string; title: string; createdAt: string; mode: PermissionMode;
  model: string; assetsUsed: { type: string; ref: string; version: string }[]; tags: string[];
}
export interface Qipu { meta: QipuMeta; tree: YiNode[]; }

export async function writeQipu(path: string, q: Qipu): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  // ponytail: json 而非 yaml,棋谱含树结构,json 更稳;yaml 留给 manifest
  await writeFile(path, JSON.stringify({ ...q.meta, tree: q.tree }, null, 2), 'utf8');
}

export async function readQipu(path: string): Promise<Qipu> {
  const raw = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
  const { tree, ...meta } = raw;
  return { meta: meta as unknown as QipuMeta, tree: tree as YiNode[] };
}

// ponytail: yaml dump 备用,manifest 格式留子计划 B
export function dumpYaml(data: unknown): string { return yaml.dump(data); }
```

- [ ] **Step 4: `index.ts` + 测试通过 + Commit**

`packages/assets/src/index.ts`: `export * from './qipu.js';`
Run: `pnpm --filter @yi/assets test` → PASS
```bash
git add packages/assets
git commit -m "feat(assets): 棋谱 .yi.json 读写"
```

---

## Task 4: mock 状态源 + Zustand store

**Files:**
- Create: `apps/desktop/src/renderer/state/{mock-data.ts,store.ts,store.test.ts}`

**Interfaces:**
- Consumes: `@yi/shared`(`YiNode`, `PermissionMode`, `AssetInstallState`, `isValidLockCombo`)
- Produces: `useYiStore`(Zustand):`nodes`, `rootId`, `mode`, `assets`, `ponderStream`, `setMode`, `toggleAutoUpdate`, `toggleEditable`, `loadQipu`, `saveQipu`, `startMockRun`(假跑一轮)。所有组件依赖

- [ ] **Step 1: 失败测试**

`apps/desktop/src/renderer/state/store.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { useYiStore } from './store.js';

describe('useYiStore', () => {
  it('toggleAutoUpdate 开则 editable 自动关(互斥)', () => {
    useYiStore.setState({ assets: [{
      ref: 'a', version: '0.1', autoUpdate: false, editable: true, source: 'local', installedAt: 't' }] });
    useYiStore.getState().toggleAutoUpdate('a');
    const a = useYiStore.getState().assets.find((x) => x.ref === 'a')!;
    expect(a.autoUpdate).toBe(true);
    expect(a.editable).toBe(false);
  });
  it('都 off 合法', () => {
    useYiStore.setState({ assets: [{
      ref: 'b', version: '0.1', autoUpdate: true, editable: false, source: 'local', installedAt: 't' }] });
    useYiStore.getState().toggleAutoUpdate('b'); // 关 autoUpdate
    const b = useYiStore.getState().assets.find((x) => x.ref === 'b')!;
    expect(b.autoUpdate).toBe(false);
    expect(b.editable).toBe(false);
  });
});
```

- [ ] **Step 2: 跑确认失败** → Run: `pnpm --filter @yi/desktop test` → FAIL

- [ ] **Step 3: 实现 `mock-data.ts`**

```typescript
import type { YiNode, AssetInstallState } from '@yi/shared';

// 硬编码一棵对话树,UI 渲染它
export const mockTree: YiNode[] = [
  { id: 'n1', parentId: null, type: 'intent', status: 'done', createdAt: '2026-06-25T10:00:00Z',
    payload: { input: '整理下载文件夹里上个月的照片', attachments: [], mountedAssets: [], mode: 'trusted' },
    childrenIds: ['n2'] },
  { id: 'n2', parentId: 'n1', type: 'ponder', status: 'done', createdAt: '2026-06-25T10:00:01Z',
    payload: { reasoning: '解读布局:需扫描下载文件夹→过滤上月→按日期重命名', modelUsed: 'stub', tokensIn: 12, tokensOut: 34 },
    childrenIds: ['n3'] },
  { id: 'n3', parentId: 'n2', type: 'plan', status: 'done', createdAt: '2026-06-25T10:00:02Z',
    payload: { steps: [
      { id: 's1', description: '列出下载文件夹', tool: 'fs.list', argsPreview: '{ "path": "~/Downloads" }' },
      { id: 's2', description: '过滤上月照片', tool: 'fs.filter', argsPreview: '{ "ext": ["jpg","png"], "since": "2026-05" }' },
      { id: 's3', description: '按日期重命名', tool: 'fs.rename', argsPreview: '{ "pattern": "{date}-{name}" }' },
    ] },
    childrenIds: ['n4', 'n5', 'n6'] },
  { id: 'n4', parentId: 'n3', type: 'action', status: 'done', createdAt: '2026-06-25T10:00:03Z',
    payload: { stepId: 's1', tool: 'fs.list', args: {}, result: ['a.jpg', 'b.png', 'c.txt'], durationMs: 12 },
    childrenIds: [] },
  { id: 'n5', parentId: 'n3', type: 'action', status: 'done', createdAt: '2026-06-25T10:00:04Z',
    payload: { stepId: 's2', tool: 'fs.filter', args: {}, result: ['a.jpg', 'b.png'], durationMs: 8 },
    childrenIds: [] },
  { id: 'n6', parentId: 'n3', type: 'action', status: 'running', createdAt: '2026-06-25T10:00:05Z',
    payload: { stepId: 's3', tool: 'fs.rename', args: {}, result: null, durationMs: 0 },
    childrenIds: [] },
];

export const mockAssets: AssetInstallState[] = [
  { ref: 'tesuji-photo-org', version: '0.1.0', autoUpdate: true, editable: false, source: 'registry', installedAt: 't' },
  { ref: 'qijing-investment', version: '0.2.1', autoUpdate: false, editable: false, source: 'registry', installedAt: 't' },
  { ref: 'my-own-soul', version: '0.0.1', autoUpdate: false, editable: true, source: 'local', installedAt: 't' },
];

// 假 stream:推理链逐字吐
export async function* mockPonderStream(): AsyncIterable<string> {
  const text = '解读布局:需扫描下载文件夹 → 过滤上月 → 按日期重命名 → 生成索引';
  for (const ch of text) {
    yield ch;
    await new Promise((r) => setTimeout(r, 30));
  }
}
```

- [ ] **Step 4: 实现 `store.ts`**

```typescript
import { create } from 'zustand';
import type { YiNode, PermissionMode, AssetInstallState } from '@yi/shared';
import { isValidLockCombo } from '@yi/shared';
import { mockTree, mockAssets, mockPonderStream } from './mock-data.js';

interface YiState {
  nodes: YiNode[];
  rootId: string | null;
  mode: PermissionMode;
  assets: AssetInstallState[];
  ponderText: string;
  setMode: (m: PermissionMode) => void;
  toggleAutoUpdate: (ref: string) => void;
  toggleEditable: (ref: string) => void;
  runMockPonder: () => Promise<void>;
}

export const useYiStore = create<YiState>((set, get) => ({
  nodes: mockTree,
  rootId: mockTree[0]?.id ?? null,
  mode: 'trusted',
  assets: mockAssets,
  ponderText: '',

  setMode: (m) => set({ mode: m }),

  toggleAutoUpdate: (ref) => set((s) => ({
    assets: s.assets.map((a) => {
      if (a.ref !== ref) return a;
      const next = { ...a, autoUpdate: !a.autoUpdate, editable: false };
      return isValidLockCombo(next) ? next : a;
    }),
  })),

  toggleEditable: (ref) => set((s) => ({
    assets: s.assets.map((a) => {
      if (a.ref !== ref) return a;
      const next = { ...a, editable: !a.editable, autoUpdate: false };
      return isValidLockCombo(next) ? next : a;
    }),
  })),

  runMockPonder: async () => {
    set({ ponderText: '' });
    let acc = '';
    for await (const ch of mockPonderStream()) {
      acc += ch;
      set({ ponderText: acc });
    }
  },
}));
```

- [ ] **Step 5: 测试通过 + Commit**

Run: `pnpm --filter @yi/desktop test` → PASS
```bash
git add apps/desktop/src/renderer/state
git commit -m "feat(renderer): mock 状态源 + Zustand store (含互斥校验)"
```

---

## Task 5: 棋枰 + 棋子组件(树视图 + 动画)

**Files:**
- Create: `apps/desktop/src/renderer/components/{Qipan.tsx,Qizi.tsx}`, `apps/desktop/src/renderer/styles.css`, `Qipan.test.tsx`

**Interfaces:**
- Consumes: `useYiStore`(nodes), `@yi/shared`(YiNode), framer-motion
- Produces: `<Qipan/>` 渲染对话树,棋子按 status 显示(done=亮/running=脉动/stopped=暗/error=红)

- [ ] **Step 1: 失败测试**

`apps/desktop/src/renderer/components/Qipan.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useYiStore } from '../state/store.js';
import { Qipan } from './Qipan.js';
import { mockTree } from '../state/mock-data.js';

describe('Qipan', () => {
  it('渲染所有节点', () => {
    useYiStore.setState({ nodes: mockTree });
    render(<Qipan />);
    expect(screen.getByText(/整理下载文件夹/)).toBeTruthy();
    expect(screen.getByText(/列出下载文件夹/)).toBeTruthy();
  });
});
```

> vitest config 需 jsdom 环境。在 `apps/desktop` 加 `vitest.config.ts`:
> ```typescript
> import { defineConfig } from 'vitest/config';
> export default defineConfig({ test: { environment: 'jsdom', setupFiles: ['./src/renderer/test-setup.ts'] } });
> ```
> `src/renderer/test-setup.ts`: `import '@testing-library/jest-dom';`

- [ ] **Step 2: 跑确认失败** → Run: `pnpm --filter @yi/desktop test` → FAIL

- [ ] **Step 3: 实现 `styles.css`(围棋基调)**

```css
:root {
  --board: #2a2018; --line: #5a4a38; --stone-light: #e8d8b8; --stone-dark: #1a1208;
  --accent: #c8a060; --text: #e8d8b8; --muted: #8a7a60;
  --running: #f0c060; --error: #c04040; --stopped: #6a5a48;
}
body { margin: 0; background: var(--board); color: var(--text); font-family: system-ui, sans-serif; }
.qipan { padding: 24px; }
.qizi { display: inline-flex; flex-direction: column; align-items: center; margin: 12px; }
.stone { width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--line); }
.stone.done { background: var(--stone-light); }
.stone.running { background: var(--running); animation: pulse 1.2s infinite; }
.stone.stopped { background: var(--stopped); }
.stone.error { background: var(--error); }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.qizi-label { font-size: 12px; color: var(--muted); margin-top: 4px; max-width: 120px; text-align: center; }
.branch { display: flex; flex-wrap: wrap; border-left: 2px solid var(--line); padding-left: 16px; margin-left: 24px; }
```

- [ ] **Step 4: 实现 `Qizi.tsx`**

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import type { YiNode, NodeType } from '@yi/shared';

const typeLabel: Record<NodeType, string> = {
  intent: '布势', ponder: '长考', plan: '分投', action: '落子', result: '收官', checkpoint: '检查点',
};

export function Qizi({ node }: { node: YiNode }) {
  return (
    <motion.div className="qizi" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
      <div className={`stone ${node.status}`} />
      <div className="qizi-label">{typeLabel[node.type]}</div>
    </motion.div>
  );
}
```

- [ ] **Step 5: 实现 `Qipan.tsx`(递归渲染树)**

```typescript
import React from 'react';
import { useYiStore } from '../state/store.js';
import { Qizi } from './Qizi.js';
import type { YiNode } from '@yi/shared';

function Branch({ parentId }: { parentId: string | null }) {
  const nodes = useYiStore((s) => s.nodes);
  const children = nodes.filter((n) => n.parentId === parentId);
  return (
    <div className="branch">
      {children.map((n) => (
        <div key={n.id}>
          <Qizi node={n} />
          <Branch parentId={n.id} />
        </div>
      ))}
    </div>
  );
}

export function Qipan() {
  const rootId = useYiStore((s) => s.rootId);
  if (!rootId) return <div className="qipan">尚无棋局</div>;
  return (
    <div className="qipan">
      <Branch parentId={null} />
    </div>
  );
}
```

- [ ] **Step 6: 接入 App**

`apps/desktop/src/renderer/App.tsx`:
```typescript
import React from 'react';
import './styles.css';
import { Qipan } from './components/Qipan.js';

export function App() {
  return (
    <div>
      <h1 style={{ padding: 24, margin: 0, borderBottom: '1px solid var(--line)' }}>弈</h1>
      <Qipan />
    </div>
  );
}
```

- [ ] **Step 7: 测试通过 + 手动 dev 看棋枰 + Commit**

Run: `pnpm --filter @yi/desktop test` → PASS
Run: `pnpm dev` → 看见棋枰树渲染,落子有动画。手动关窗。
```bash
git add apps/desktop/src/renderer/components/Qipan.tsx apps/desktop/src/renderer/components/Qizi.tsx apps/desktop/src/renderer/components/Qipan.test.tsx apps/desktop/src/renderer/styles.css apps/desktop/src/renderer/App.tsx apps/desktop/vitest.config.ts apps/desktop/src/renderer/test-setup.ts
git commit -m "feat(renderer): 棋枰树视图 + 棋子动画(status 着色)"
```

---

## Task 6: 小目推演窗 + 收官总结卡

**Files:**
- Create: `apps/desktop/src/renderer/components/{Xiaomu.tsx,ShouGuan.tsx}`

**Interfaces:**
- Consumes: `useYiStore`(ponderText, nodes 里 result 节点)
- Produces:`<Xiaomu/>` 推理链 stream 显示 + 触发按钮;`<ShouGuan/>` 收官卡(摘要/改动/耗时)

- [ ] **Step 1: 实现 `Xiaomu.tsx`**

```typescript
import React from 'react';
import { useYiStore } from '../state/store.js';

export function Xiaomu() {
  const text = useYiStore((s) => s.ponderText);
  const run = useYiStore((s) => s.runMockPonder);
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, width: 320, padding: 16,
      background: 'rgba(20,16,12,0.85)', border: '1px solid var(--line)', borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>小目 · 长考</div>
      <div style={{ minHeight: 60, fontSize: 13 }}>{text || '—'}</div>
      <button onClick={run} style={{ marginTop: 8, padding: '4px 12px', cursor: 'pointer' }}>重演推理</button>
    </div>
  );
}
```

- [ ] **Step 2: 实现 `ShouGuan.tsx`**

```typescript
import React from 'react';
import { useYiStore } from '../state/store.js';
import type { ResultPayload } from '@yi/shared';

export function ShouGuan() {
  const nodes = useYiStore((s) => s.nodes);
  const result = nodes.find((n) => n.type === 'result');
  if (!result) return null;
  const p = result.payload as ResultPayload;
  return (
    <div style={{ margin: 24, padding: 16, background: 'rgba(200,160,96,0.12)',
      border: '1px solid var(--accent)', borderRadius: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>收官</div>
      <div>{p.summary}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
        耗时 {(p.durationMs / 1000).toFixed(1)}s · {p.changes.length} 处改动
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 接入 App**

`App.tsx` 增加组件:
```typescript
import { Xiaomu } from './components/Xiaomu.js';
import { ShouGuan } from './components/ShouGuan.js';
// ...在 <Qipan/> 后加 <ShouGuan/> <Xiaomu/>
```

- [ ] **Step 4: 手动验证 + Commit**

Run: `pnpm dev` → 看见小目窗(点"重演推理"逐字 stream)、收官卡。关窗。
```bash
git add apps/desktop/src/renderer/components/Xiaomu.tsx apps/desktop/src/renderer/components/ShouGuan.tsx apps/desktop/src/renderer/App.tsx
git commit -m "feat(renderer): 小目推演窗(stream) + 收官总结卡"
```

---

## Task 7: 布势输入条 + 全局快捷键

**Files:**
- Create: `apps/desktop/src/renderer/components/BuShiBar.tsx`, 修改 `electron/main.ts` 注册全局快捷键

**Interfaces:**
- Consumes: `useYiStore`(setMode, mode), Electron globalShortcut
- Produces:`Cmd/Ctrl+Shift+Y` 唤出/隐藏输入条;输入条含文本框 + 模式选择 + 发送(本计划发送只 push 一个 mock intent 节点到树)

- [ ] **Step 1: 修改 `electron/main.ts` 注册快捷键 + IPC**

```typescript
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import { join } from 'node:path';

let win: BrowserWindow | null = null;
app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 1200, height: 800, show: true,
    webPreferences: { preload: join(__dirname, '../preload/index.mjs'), contextIsolation: true },
  });
  win.loadFile(join(__dirname, '../renderer/index.html'));
  globalShortcut.register('CommandOrControl+Shift+Y', () => {
    win?.webContents.send('yi:toggle-bushi');
  });
});
app.on('will-quit', () => globalShortcut.unregisterAll());

ipcMain.on('yi:dev-tools', () => win?.webContents.openDevTools());
```

- [ ] **Step 2: `preload.ts` 暴露 toggle 订阅**

```typescript
import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('yi', {
  onToggleBushu: (cb: () => void) => ipcRenderer.on('yi:toggle-bushi', cb),
});
```

- [ ] **Step 3: 实现 `BuShiBar.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { useYiStore } from '../state/store.js';
import type { PermissionMode } from '@yi/shared';
import { ulid } from 'ulid';

export function BuShiBar() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const mode = useYiStore((s) => s.mode);
  const setMode = useYiStore((s) => s.setMode);
  const nodes = useYiStore((s) => s.nodes);
  const setNodes = useYiStore.setState;

  useEffect(() => {
    (window as any).yi?.onToggleBushu(() => setOpen((o) => !o));
  }, []);

  const send = () => {
    if (!text.trim()) return;
    const id = ulid();
    setNodes({
      nodes: [...nodes, {
        id, parentId: null, type: 'intent', status: 'done', createdAt: new Date().toISOString(),
        payload: { input: text, attachments: [], mountedAssets: [], mode },
        childrenIds: [],
      }],
    });
    setText(''); setOpen(false);
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      width: 560, padding: 16, background: 'var(--board)', border: '1px solid var(--line)', borderRadius: 8 }}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="布势:说意图,不说怎么做"
        style={{ width: '100%', height: 60, background: '#1a1208', color: 'var(--text)', border: '1px solid var(--line)' }} />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <select value={mode} onChange={(e) => setMode(e.target.value as PermissionMode)} style={{ background: '#1a1208', color: 'var(--text)' }}>
          <option value="plan">PLAN</option><option value="ask">ASK</option>
          <option value="trusted">TRUSTED</option><option value="bypass">BYPASS</option>
        </select>
        <button onClick={send} style={{ marginLeft: 'auto', padding: '4px 16px', cursor: 'pointer' }}>落子</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 接入 App + 手动验证**

App 加 `<BuShiBar/>`。Run: `pnpm dev` → 按 `Ctrl+Shift+Y` 弹输入条,输入文字点"落子",棋枰多一个布势节点。关窗。

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/electron/main.ts apps/desktop/electron/preload.ts apps/desktop/src/renderer/components/BuShiBar.tsx apps/desktop/src/renderer/App.tsx
git commit -m "feat(renderer): 布势输入条 + 全局快捷键 Cmd/Ctrl+Shift+Y"
```

---

## Task 8: 模式切换 + 资产双开关 UI

**Files:**
- Create: `apps/desktop/src/renderer/components/{ModeSwitch.tsx,AssetLocks.tsx}`, `AssetLocks.test.tsx`

**Interfaces:**
- Consumes: `useYiStore`(mode, setMode, assets, toggleAutoUpdate, toggleEditable)
- Produces:`<ModeSwitch/>` 4 级模式切换;`<AssetLocks/>` 每资产两个开关,互斥联动

- [ ] **Step 1: 失败测试 `AssetLocks.test.tsx`**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useYiStore } from '../state/store.js';
import { AssetLocks } from './AssetLocks.js';

describe('AssetLocks', () => {
  it('开 editable 自动关 autoUpdate', () => {
    useYiStore.setState({ assets: [{
      ref: 'x', version: '0.1', autoUpdate: true, editable: false, source: 'registry', installedAt: 't' }] });
    render(<AssetLocks />);
    const editableCheckbox = screen.getByLabelText(/editable-x/);
    fireEvent.click(editableCheckbox);
    const a = useYiStore.getState().assets[0];
    expect(a.editable).toBe(true);
    expect(a.autoUpdate).toBe(false);
  });
});
```

- [ ] **Step 2: 跑确认失败** → FAIL

- [ ] **Step 3: 实现 `ModeSwitch.tsx`**

```typescript
import React from 'react';
import { useYiStore } from '../state/store.js';
import type { PermissionMode } from '@yi/shared';

const modes: { v: PermissionMode; label: string; desc: string }[] = [
  { v: 'plan', label: 'PLAN', desc: '只推演' },
  { v: 'ask', label: 'ASK', desc: '逐次确认' },
  { v: 'trusted', label: 'TRUSTED', desc: 'workdir 内随意' },
  { v: 'bypass', label: 'BYPASS', desc: '完全不拦' },
];

export function ModeSwitch() {
  const mode = useYiStore((s) => s.mode);
  const setMode = useYiStore((s) => s.setMode);
  return (
    <div style={{ padding: '8px 24px', display: 'flex', gap: 8, borderBottom: '1px solid var(--line)' }}>
      {modes.map((m) => (
        <button key={m.v} onClick={() => setMode(m.v)}
          style={{ padding: '4px 12px', cursor: 'pointer',
            background: mode === m.v ? 'var(--accent)' : 'transparent',
            color: mode === m.v ? '#1a1208' : 'var(--text)', border: '1px solid var(--line)' }}>
          {m.label} <span style={{ fontSize: 10, opacity: 0.7 }}>{m.desc}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 实现 `AssetLocks.tsx`**

```typescript
import React from 'react';
import { useYiStore } from '../state/store.js';

export function AssetLocks() {
  const assets = useYiStore((s) => s.assets);
  const toggleAutoUpdate = useYiStore((s) => s.toggleAutoUpdate);
  const toggleEditable = useYiStore((s) => s.toggleEditable);
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>资产库</div>
      {assets.map((a) => (
        <div key={a.ref} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
          <div style={{ flex: 1 }}>
            <div>{a.ref}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.version} · {a.source}</div>
          </div>
          <label style={{ fontSize: 12 }}>
            <input type="checkbox" checked={a.autoUpdate}
              onChange={() => toggleAutoUpdate(a.ref)} /> autoUpdate
          </label>
          <label style={{ fontSize: 12 }} aria-label={`editable-${a.ref}`}>
            <input type="checkbox" checked={a.editable}
              onChange={() => toggleEditable(a.ref)} /> editable
          </label>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: 接入 App + 测试通过 + 手动验证**

App 加 `<ModeSwitch/>`(在 h1 下)、`<AssetLocks/>`(在 ShouGuan 后)。
Run: `pnpm --filter @yi/desktop test` → PASS
Run: `pnpm dev` → 切模式高亮;资产开关互斥(开一个另一个自动关)。关窗。

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/renderer/components/ModeSwitch.tsx apps/desktop/src/renderer/components/AssetLocks.tsx apps/desktop/src/renderer/components/AssetLocks.test.tsx apps/desktop/src/renderer/App.tsx
git commit -m "feat(renderer): 模式切换 + 资产双开关 UI (互斥联动)"
```

---

## Task 9: 棋谱 load/save (接 assets 包,真文件 IO)

**Files:**
- Create: `apps/desktop/src/renderer/components/QipuIO.tsx`, 修改 `preload.ts`/`main.ts` 加文件 dialog IPC

**Interfaces:**
- Consumes: `@yi/assets`(writeQipu/readQipu), Electron dialog
- Produces: `<QipuIO/>` 两个按钮:保存棋谱(弹 dialog 选路径,调 writeQipu)、加载棋谱(选文件,调 readQipu,塞进 store)

- [ ] **Step 1: `main.ts` 加 dialog IPC**

```typescript
import { dialog } from 'electron';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

ipcMain.handle('yi:save-qipu', async (_e, data: unknown) => {
  const res = await dialog.showSaveDialog(win!, { defaultPath: 'task.yi.json', filters: [{ name: 'Yi 棋谱', extensions: ['yi.json'] }] });
  if (res.canceled || !res.filePath) return null;
  await mkdir(join(res.filePath, '..'), { recursive: true });
  await writeFile(res.filePath, JSON.stringify(data, null, 2), 'utf8');
  return res.filePath;
});

ipcMain.handle('yi:load-qipu', async () => {
  const res = await dialog.showOpenDialog(win!, { filters: [{ name: 'Yi 棋谱', extensions: ['yi.json'] }], properties: ['openFile'] });
  if (res.canceled || !res.filePaths.length) return null;
  return JSON.parse(await readFile(res.filePaths[0], 'utf8'));
});
```

- [ ] **Step 2: `preload.ts` 暴露**

```typescript
contextBridge.exposeInMainWorld('yi', {
  onToggleBushu: (cb: () => void) => ipcRenderer.on('yi:toggle-bushi', cb),
  saveQipu: (data: unknown) => ipcRenderer.invoke('yi:save-qipu', data),
  loadQipu: () => ipcRenderer.invoke('yi:load-qipu'),
});
```

- [ ] **Step 3: 实现 `QipuIO.tsx`**

```typescript
import React from 'react';
import { useYiStore } from '../state/store.js';
import { ulid } from 'ulid';

export function QipuIO() {
  const nodes = useYiStore((s) => s.nodes);
  const mode = useYiStore((s) => s.mode);
  const setNodes = useYiStore.setState;

  const save = async () => {
    const data = {
      id: ulid(), title: '任务', createdAt: new Date().toISOString(),
      mode, model: 'mock', assetsUsed: [], tags: [], tree: nodes,
    };
    await (window as any).yi.saveQipu(data);
  };
  const load = async () => {
    const data = await (window as any).yi.loadQipu();
    if (data?.tree) setNodes({ nodes: data.tree, rootId: data.tree[0]?.id ?? null });
  };

  return (
    <div style={{ padding: '8px 24px' }}>
      <button onClick={save} style={{ marginRight: 8, cursor: 'pointer' }}>保存棋谱</button>
      <button onClick={load} style={{ cursor: 'pointer' }}>加载棋谱</button>
    </div>
  );
}
```

- [ ] **Step 4: 接入 App + 手动验证**

App 加 `<QipuIO/>`(在 ModeSwitch 下)。
Run: `pnpm dev` → 点"保存棋谱"弹系统 dialog 选路径存;点"加载棋谱"选刚存的文件,棋枰重新渲染。关窗。

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/electron/main.ts apps/desktop/electron/preload.ts apps/desktop/src/renderer/components/QipuIO.tsx apps/desktop/src/renderer/App.tsx
git commit -m "feat(renderer): 棋谱 load/save (dialog + 真文件 IO)"
```

---

## Task 10: 端到端可见性手测 + 全量验证

**Files:**
- 无新文件,跑全量验证

- [ ] **Step 1: 全量测试 + typecheck**

Run: `pnpm -r test`
Run: `pnpm -r typecheck`
Expected: 全 PASS

- [ ] **Step 2: 手测清单(逐条在 dev 窗口验证)**

Run: `pnpm dev`,逐条验证:
1. 窗口打开,棋枰渲染 mock 对话树,6 个节点,落子有 spring 动画
2. running 状态棋子(n6)脉动
3. 右上小目窗,点"重演推理"逐字 stream
4. 收官卡显示摘要/耗时
5. 顶部模式切换,4 个按钮,当前高亮
6. 资产库 3 个资产,autoUpdate/editable 互斥(开一个另一个自动关,可都关)
7. 按 `Ctrl+Shift+Y` 弹布势输入条,输入文字点"落子",棋枰多一个布势节点
8. 点"保存棋谱"存文件,点"加载棋谱"读回,棋枰刷新

全部通过 = C 完成。

- [ ] **Step 3: Commit 验证记录**

```bash
git commit --allow-empty -m "test: C 端到端可见性手测通过 (10/10)"
```

---

## Self-Review Notes

**对 MVP 验收标准覆盖:**
- 验收 1(快捷键唤输入条)→ Task 7 ✅
- 验收 2(PONDER→SPLIT→EXECUTE→DONE 可视化)→ Task 5+6(mock 树展示这些节点)✅
- 验收 3(调工具完成真实任务)→ 本计划 mock,留 B ✅ 已标注
- 验收 4(STOP/FORK)→ 树结构支持(Task 5 渲染分支),FORK UI 留 B 接真运行时 ✅ 部分
- 验收 5(棋谱写回加载)→ Task 9 ✅
- 验收 6(4 级权限切换)→ Task 8 ✅(UI 切换;真网关留 B)
- 验收 7(资产双开关)→ Task 8 ✅
- 验收 8(LLM baseURL)→ 留 B ✅ 已标注

**Placeholder scan:** 无 TBD;每步有完整代码。
**Type consistency:** `YiNode`/`PermissionMode`/`AssetInstallState` 在 shared 定义,store 与组件消费一致;`isValidLockCombo` 互斥校验 store 内调用。
**与 A 残余衔接:** shared/assets 在本计划建好,A 残余只做 `tree`/`loop`/`cli`/`tools`/stub,store 的 mock 数据源后续换成 IPC 订阅真 AgentLoop 状态。
