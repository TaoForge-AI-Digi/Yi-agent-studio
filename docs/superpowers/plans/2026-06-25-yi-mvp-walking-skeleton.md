# 弈 MVP · 子计划 A:行走骨架 (Walking Skeleton) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭出弈的端到端架构骨架——headless CLI 跑通"布势→长考→分投→落子→收官",棋谱读写,STOP/FORK。架构是真的,能力用 stub(LLM 返回 canned 计划、一个真 fs.list 工具)。

**Architecture:** pnpm monorepo。`packages/shared` 纯类型,`packages/storage` 文件 IO,`packages/assets` 棋谱读写,`apps/desktop` 主进程含对话树/stub LLM/工具注册/Agent 循环/headless 入口。无 Electron、无 UI(留子计划 C)。

**Tech Stack:** TypeScript(node16)、pnpm workspace、Vitest、`ulid`、`js-yaml`。Node 直接跑(`tsx`),不打包。

## Global Constraints

- 全 TypeScript,`strict: true`,`module: NodeNext`,`moduleResolution: NodeNext`
- 包间依赖用 workspace 协议(`"@yi/shared": "workspace:*"`)
- 每个 export 用 `type`/`interface` 显式类型;ESM `.js` 扩展名在相对导入里写全(NodeNext 要求)
- 测试用 Vitest;每个任务先写失败测试再实现(TDD)
- 提交粒度:每个任务结束一次 commit;commit message 用 `feat/fix/test/docs/refactor: <desc>` 约定式
- 不引入未在本计划列出的依赖(YAGNI);LLM 与重工具在子计划 B 才上,本计划只用 stub
- 资产双开关(autoUpdate/editable)互斥约束在子计划 B 的资产加载器里实现;本计划 A 不涉及资产加载

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
│   │       ├── node.ts          # YiNode + payloads
│   │       ├── permission.ts    # PermissionMode
│   │       └── tool.ts          # Tool / ToolContext / ToolEvent
│   ├── storage/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── yaml-json.ts     # readYaml/writeYaml/readJson/writeJson
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
        └── src/
            ├── main/
            │   ├── tree.ts          # ConversationTree
            │   ├── llm-stub.ts      # StubLLMClient
            │   ├── tools.ts         # ToolRegistry + fs.list tool
            │   ├── loop.ts          # AgentLoop
            │   ├── recorder.ts      # 棋谱 recorder
            │   └── cli.ts           # headless 入口
            └── index.ts             # re-export
```

每个文件单一职责。`shared` 零运行时依赖,被所有包引用。`storage` 依赖 `js-yaml`。`assets` 依赖 `shared`+`storage`。`desktop` 依赖全部 + `ulid`。

---

## Task 1: Monorepo scaffold + tooling

**Files:**
- Create: `pnpm-workspace.yaml`, `tsconfig.base.json`, `package.json` (root)
- Create: `packages/shared/{package.json,tsconfig.json}`, `packages/storage/{package.json,tsconfig.json}`, `packages/assets/{package.json,tsconfig.json}`, `apps/desktop/{package.json,tsconfig.json}`

**Interfaces:**
- Consumes: none
- Produces: 一个可 `pnpm install` + `pnpm -r typecheck` 通过(空包)的 monorepo

- [ ] **Step 1: 创建 workspace 根配置**

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
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
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
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "tsx": "^4.7.0"
  }
}
```

- [ ] **Step 2: 创建各包 package.json + tsconfig**

`packages/shared/package.json`:
```json
{
  "name": "@yi/shared",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```
`packages/shared/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "include": ["src"] }
```

`packages/storage/package.json`:
```json
{
  "name": "@yi/storage",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9"
  }
}
```
`packages/storage/tsconfig.json`:
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
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@yi/shared": "workspace:*",
    "@yi/storage": "workspace:*"
  }
}
```
`packages/assets/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "include": ["src"] }
```

`apps/desktop/package.json`:
```json
{
  "name": "@yi/desktop",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "cli": "tsx src/main/cli.ts"
  },
  "dependencies": {
    "@yi/shared": "workspace:*",
    "@yi/storage": "workspace:*",
    "@yi/assets": "workspace:*",
    "ulid": "^2.3.0"
  }
}
```
`apps/desktop/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "include": ["src"] }
```

- [ ] **Step 3: 加最小占位 src/index.ts 让 typecheck 过**

每个包 `src/index.ts` 先写 `export {};`

- [ ] **Step 4: 安装并验证**

Run: `pnpm install`
Run: `pnpm -r typecheck`
Expected: 全部通过(空包)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: monorepo scaffold (pnpm + ts + vitest)"
```

---

## Task 2: packages/shared — 核心节点类型

**Files:**
- Create: `packages/shared/src/node.ts`, `packages/shared/src/permission.ts`, `packages/shared/src/tool.ts`, `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: none
- Produces: `YiNode`, `NodeType`, 6 个 payload 类型, `PermissionMode`, `Tool`, `ToolContext`, `ToolEvent` —— 后续所有任务依赖这些名字

- [ ] **Step 1: 写失败测试 `packages/shared/src/node.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import type { YiNode, IntentPayload } from './node.js';

describe('YiNode type', () => {
  it('可构造一个 intent 节点', () => {
    const node: YiNode = {
      id: '01H',
      parentId: null,
      type: 'intent',
      status: 'done',
      createdAt: '2026-06-25T00:00:00Z',
      payload: {
        input: '整理下载文件夹',
        attachments: [],
        mountedAssets: [],
        mode: 'ask',
      } satisfies IntentPayload,
      childrenIds: [],
    };
    expect(node.type).toBe('intent');
    expect((node.payload as IntentPayload).mode).toBe('ask');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @yi/shared test`
Expected: FAIL — `Cannot find module './node.js'`

- [ ] **Step 3: 实现 `packages/shared/src/permission.ts`**

```typescript
export type PermissionMode = 'plan' | 'ask' | 'trusted' | 'bypass';
```

- [ ] **Step 4: 实现 `packages/shared/src/node.ts`**

```typescript
import type { PermissionMode } from './permission.js';

export type NodeType =
  | 'intent'
  | 'ponder'
  | 'plan'
  | 'action'
  | 'result'
  | 'checkpoint';

export type NodeStatus = 'running' | 'done' | 'stopped' | 'error';

export interface IntentPayload {
  input: string;
  attachments: string[];
  mountedAssets: { type: 'expert-pack' | 'tesuji' | 'qijing'; ref: string }[];
  mode: PermissionMode;
}
export interface PonderPayload {
  reasoning: string;
  modelUsed: string;
  tokensIn: number;
  tokensOut: number;
}
export interface PlanStep {
  id: string;
  description: string;
  tool: string;
  argsPreview: string;
}
export interface PlanPayload {
  steps: PlanStep[];
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

export type NodePayload =
  | IntentPayload | PonderPayload | PlanPayload
  | ActionPayload | ResultPayload | CheckpointPayload;

export interface YiNode {
  id: string;
  parentId: string | null;
  type: NodeType;
  status: NodeStatus;
  createdAt: string;
  payload: NodePayload;
  childrenIds: string[];
}
```

- [ ] **Step 5: 实现 `packages/shared/src/tool.ts`**

```typescript
import type { PermissionMode } from './permission.js';

export interface ToolContext {
  workdir: string;
  permission: PermissionMode;
}

export type ToolEvent =
  | { type: 'progress'; message: string }
  | { type: 'result'; result: unknown }
  | { type: 'error'; message: string };

export interface Tool {
  name: string;
  description: string;
  run(args: unknown, ctx: ToolContext): AsyncIterable<ToolEvent>;
}
```

- [ ] **Step 6: 实现 `packages/shared/src/index.ts`**

```typescript
export * from './node.js';
export * from './permission.js';
export * from './tool.js';
```

- [ ] **Step 7: 跑测试确认通过**

Run: `pnpm --filter @yi/shared test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): YiNode 类型与 payload 定义"
```

---

## Task 3: packages/storage — yaml/json IO

**Files:**
- Create: `packages/storage/src/yaml-json.ts`, `packages/storage/src/index.ts`, `packages/storage/src/yaml-json.test.ts`

**Interfaces:**
- Consumes: `js-yaml`, `node:fs/promises`
- Produces: `readYaml(path)`, `writeYaml(path, data)`, `readJson(path)`, `writeJson(path, data)` —— `packages/assets` 与 `apps/desktop` 依赖

- [ ] **Step 1: 写失败测试**

`packages/storage/src/yaml-json.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeYaml, readYaml, writeJson, readJson } from './yaml-json.js';

describe('storage', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'yi-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it('读写 yaml', async () => {
    await writeYaml(join(dir, 'a.yaml'), { x: 1, list: [1, 2] });
    const got = await readYaml(join(dir, 'a.yaml'));
    expect(got).toEqual({ x: 1, list: [1, 2] });
  });
  it('读写 json', async () => {
    await writeJson(join(dir, 'b.json'), { y: 'hi' });
    const got = await readJson(join(dir, 'b.json'));
    expect(got).toEqual({ y: 'hi' });
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @yi/storage test`
Expected: FAIL — module not found

- [ ] **Step 3: 实现 `packages/storage/src/yaml-json.ts`**

```typescript
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import yaml from 'js-yaml';

export async function readYaml<T = unknown>(path: string): Promise<T> {
  const text = await readFile(path, 'utf8');
  return yaml.load(text) as T;
}

export async function writeYaml(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, yaml.dump(data), 'utf8');
}

export async function readJson<T = unknown>(path: string): Promise<T> {
  const text = await readFile(path, 'utf8');
  return JSON.parse(text) as T;
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), 'utf8');
}
```

- [ ] **Step 4: 实现 `packages/storage/src/index.ts`**

```typescript
export * from './yaml-json.js';
```

- [ ] **Step 5: 跑测试确认通过**

Run: `pnpm --filter @yi/storage test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/storage
git commit -m "feat(storage): yaml/json 读写"
```

---

## Task 4: packages/assets — 棋谱读写

**Files:**
- Create: `packages/assets/src/qipu.ts`, `packages/assets/src/index.ts`, `packages/assets/src/qipu.test.ts`

**Interfaces:**
- Consumes: `@yi/shared`(`YiNode`), `@yi/storage`(`writeJson`/`readJson`)
- Produces: `QipuMeta`, `writeQipu(path, { tree, meta })`, `readQipu(path)` —— `apps/desktop` recorder 与 CLI 依赖

- [ ] **Step 1: 写失败测试**

`packages/assets/src/qipu.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeQipu, readQipu } from './qipu.js';
import type { YiNode } from '@yi/shared';

const tree: YiNode[] = [
  {
    id: 'n1', parentId: null, type: 'intent', status: 'done',
    createdAt: '2026-06-25T00:00:00Z',
    payload: { input: 'hi', attachments: [], mountedAssets: [], mode: 'ask' },
    childrenIds: ['n2'],
  },
  {
    id: 'n2', parentId: 'n1', type: 'result', status: 'done',
    createdAt: '2026-06-25T00:00:01Z',
    payload: { summary: 'done', changes: [], durationMs: 10, tokensTotal: 0 },
    childrenIds: [],
  },
];

describe('qipu', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'yi-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it('写棋谱再读回,树与元数据一致', async () => {
    await writeQipu(join(dir, 'task.yi.json'), {
      meta: { id: 't1', title: '测试', createdAt: '2026-06-25T00:00:00Z', mode: 'ask', model: 'stub', assetsUsed: [], tags: [] },
      tree,
    });
    const got = await readQipu(join(dir, 'task.yi.json'));
    expect(got.tree).toEqual(tree);
    expect(got.meta.title).toBe('测试');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @yi/assets test`
Expected: FAIL — module not found

- [ ] **Step 3: 实现 `packages/assets/src/qipu.ts`**

```typescript
import type { YiNode, PermissionMode } from '@yi/shared';
import { readJson, writeJson } from '@yi/storage';

export interface QipuMeta {
  id: string;
  title: string;
  createdAt: string;
  mode: PermissionMode;
  model: string;
  assetsUsed: { type: string; ref: string; version: string }[];
  tags: string[];
}

export interface Qipu {
  meta: QipuMeta;
  tree: YiNode[];
}

export async function writeQipu(path: string, q: Qipu): Promise<void> {
  await writeJson(path, { ...q.meta, tree: q.tree });
}

export async function readQipu(path: string): Promise<Qipu> {
  const raw = await readJson<Record<string, unknown>>(path);
  const { tree, ...meta } = raw;
  return { meta: meta as unknown as QipuMeta, tree: tree as YiNode[] };
}
```

- [ ] **Step 4: 实现 `packages/assets/src/index.ts`**

```typescript
export * from './qipu.js';
```

- [ ] **Step 5: 跑测试确认通过**

Run: `pnpm --filter @yi/assets test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/assets
git commit -m "feat(assets): 棋谱 .yi.json 读写"
```

---

## Task 5: apps/desktop — 对话树 (ConversationTree)

**Files:**
- Create: `apps/desktop/src/main/tree.ts`, `apps/desktop/src/main/tree.test.ts`

**Interfaces:**
- Consumes: `@yi/shared`(`YiNode`, `IntentPayload`), `ulid`
- Produces: `ConversationTree` 类 —— `addNode`, `stop`, `fork`, `getNode`, `serialize`, `deserialize`。Agent loop 与 recorder 依赖

- [ ] **Step 1: 写失败测试**

`apps/desktop/src/main/tree.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { ConversationTree } from './tree.js';

describe('ConversationTree', () => {
  it('addNode 链接父子,stop 置 stopped,fork 长新分支保留原分支', () => {
    const tree = new ConversationTree();
    const root = tree.addNode({ type: 'intent', parentId: null, payload: {
      input: '整理', attachments: [], mountedAssets: [], mode: 'ask' } });
    const act = tree.addNode({ type: 'action', parentId: root.id, payload: {
      stepId: 's1', tool: 'fs.list', args: {}, result: null, durationMs: 0 } });
    expect(tree.getNode(root.id).childrenIds).toEqual([act.id]);

    tree.stop(act.id);
    expect(tree.getNode(act.id).status).toBe('stopped');

    const forked = tree.fork(root.id, { input: '改主意', attachments: [], mountedAssets: [], mode: 'ask' });
    expect(tree.getNode(root.id).childrenIds).toContain(forked.id);
    expect(tree.getNode(act.id).status).toBe('stopped'); // 原分支保留
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @yi/desktop test`
Expected: FAIL — module not found

- [ ] **Step 3: 实现 `apps/desktop/src/main/tree.ts`**

```typescript
import { ulid } from 'ulid';
import type {
  YiNode, NodeType, NodePayload, IntentPayload, NodeStatus,
} from '@yi/shared';

type AddInput =
  | { type: 'intent'; parentId: string | null; payload: IntentPayload }
  | { type: Exclude<NodeType, 'intent'>; parentId: string; payload: Exclude<NodePayload, IntentPayload> };

export class ConversationTree {
  private nodes = new Map<string, YiNode>();
  private rootId: string | null = null;

  addNode(input: AddInput): YiNode {
    const id = ulid();
    const node: YiNode = {
      id,
      parentId: input.parentId,
      type: input.type,
      status: 'running',
      createdAt: new Date().toISOString(),
      payload: input.payload as NodePayload,
      childrenIds: [],
    };
    this.nodes.set(id, node);
    if (input.parentId === null) this.rootId = id;
    else this.nodes.get(input.parentId)?.childrenIds.push(id);
    return node;
  }

  getNode(id: string): YiNode {
    const n = this.nodes.get(id);
    if (!n) throw new Error(`node not found: ${id}`);
    return n;
  }

  setStatus(id: string, status: NodeStatus): void {
    const n = this.nodes.get(id);
    if (n) n.status = status;
  }

  stop(id: string): void {
    this.setStatus(id, 'stopped');
  }

  fork(parentId: string, intent: IntentPayload): YiNode {
    return this.addNode({ type: 'intent', parentId, payload: intent });
  }

  updatePayload(id: string, payload: NodePayload): void {
    const n = this.nodes.get(id);
    if (n) n.payload = payload;
  }

  serialize(): YiNode[] {
    return [...this.nodes.values()];
  }

  static deserialize(nodes: YiNode[]): ConversationTree {
    const t = new ConversationTree();
    for (const n of nodes) {
      t.nodes.set(n.id, n);
      if (n.parentId === null) t.rootId = n.id;
    }
    return t;
  }

  get root(): YiNode | null {
    return this.rootId ? this.nodes.get(this.rootId) ?? null : null;
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm --filter @yi/desktop test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/main/tree.ts apps/desktop/src/main/tree.test.ts
git commit -m "feat(desktop): 对话树 ConversationTree (add/stop/fork/serialize)"
```

---

## Task 6: apps/desktop — Stub LLM client

**Files:**
- Create: `apps/desktop/src/main/llm-stub.ts`, `apps/desktop/src/main/llm-stub.test.ts`

**Interfaces:**
- Consumes: `@yi/shared`(`PlanPayload`)
- Produces: `StubLLMClient` with `plan(intent: string): Promise<PlanPayload>` —— AgentLoop 依赖。真 LLM client 在子计划 B 替换

- [ ] **Step 1: 写失败测试**

`apps/desktop/src/main/llm-stub.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { StubLLMClient } from './llm-stub.js';

describe('StubLLMClient', () => {
  it('plan 返回单步 fs.list 计划', async () => {
    const llm = new StubLLMClient();
    const plan = await llm.plan('列出文件夹');
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].tool).toBe('fs.list');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @yi/desktop test`
Expected: FAIL — module not found

- [ ] **Step 3: 实现 `apps/desktop/src/main/llm-stub.ts`**

```typescript
import { ulid } from 'ulid';
import type { PlanPayload } from '@yi/shared';

// ponytail: canned 计划,真 LLM 在子计划 B 替换
export class StubLLMClient {
  async plan(intent: string): Promise<PlanPayload> {
    return {
      steps: [
        {
          id: ulid(),
          description: `列出工作目录(${intent.slice(0, 20)})`,
          tool: 'fs.list',
          argsPreview: '{ "path": "." }',
        },
      ],
    };
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm --filter @yi/desktop test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/main/llm-stub.ts apps/desktop/src/main/llm-stub.test.ts
git commit -m "feat(desktop): StubLLMClient (canned 计划, 真脑留 B)"
```

---

## Task 7: apps/desktop — 工具注册表 + fs.list 工具

**Files:**
- Create: `apps/desktop/src/main/tools.ts`, `apps/desktop/src/main/tools.test.ts`

**Interfaces:**
- Consumes: `@yi/shared`(`Tool`, `ToolContext`, `ToolEvent`), `node:fs/promises`
- Produces: `ToolRegistry` 类(`register`, `get`), `fsListTool`(Tool) —— AgentLoop 依赖。其余工具留子计划 B

- [ ] **Step 1: 写失败测试**

`apps/desktop/src/main/tools.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ToolRegistry, fsListTool } from './tools.js';

describe('ToolRegistry + fsListTool', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'yi-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it('fs.list 列出目录内容', async () => {
    await writeFile(join(dir, 'a.txt'), 'x');
    const reg = new ToolRegistry();
    reg.register(fsListTool);
    const tool = reg.get('fs.list');
    const events = [];
    for await (const e of tool.run({ path: '.' }, { workdir: dir, permission: 'trusted' })) {
      events.push(e);
    }
    const result = events.find((e) => e.type === 'result');
    expect(result?.type).toBe('result');
    expect((result as { result: string[] }).result).toContain('a.txt');
  });

  it('未注册工具抛错', () => {
    const reg = new ToolRegistry();
    expect(() => reg.get('nope')).toThrow();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @yi/desktop test`
Expected: FAIL — module not found

- [ ] **Step 3: 实现 `apps/desktop/src/main/tools.ts`**

```typescript
import { readdir } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import type { Tool, ToolContext, ToolEvent } from '@yi/shared';

export class ToolRegistry {
  private tools = new Map<string, Tool>();
  register(tool: Tool): void { this.tools.set(tool.name, tool); }
  get(name: string): Tool {
    const t = this.tools.get(name);
    if (!t) throw new Error(`tool not registered: ${name}`);
    return t;
  }
}

// ponytail: workdir 边界检查在此,越界返回 error 事件(真权限网关在子计划 B)
function insideWorkdir(workdir: string, target: string): boolean {
  const rel = relative(resolve(workdir), resolve(workdir, target));
  return rel === '' || (!rel.startsWith('..') && !resolve(workdir, target).includes(`..${sep}`));
}

export const fsListTool: Tool = {
  name: 'fs.list',
  description: '列出目录内容',
  async *run(args: unknown, ctx: ToolContext): AsyncIterable<ToolEvent> {
    const target = (args as { path?: string })?.path ?? '.';
    if (!insideWorkdir(ctx.workdir, target)) {
      yield { type: 'error', message: '越界 workdir' };
      return;
    }
    const entries = await readdir(resolve(ctx.workdir, target));
    yield { type: 'result', result: entries };
  },
};
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm --filter @yi/desktop test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/main/tools.ts apps/desktop/src/main/tools.test.ts
git commit -m "feat(desktop): ToolRegistry + fs.list 工具(workdir 边界)"
```

---

## Task 8: apps/desktop — Agent loop (端到端接线)

**Files:**
- Create: `apps/desktop/src/main/loop.ts`, `apps/desktop/src/main/loop.test.ts`, `apps/desktop/src/main/recorder.ts`

**Interfaces:**
- Consumes: `ConversationTree`, `StubLLMClient`, `ToolRegistry`, `@yi/shared`
- Produces: `AgentLoop` 类(`run(intent): Promise<YiNode>`)与 `Recorder`(`writeAt(tree, dir)`)。CLI 依赖

- [ ] **Step 1: 写失败测试(用 stub LLM + 真 fs.list + 临时目录)**

`apps/desktop/src/main/loop.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentLoop } from './loop.js';
import { StubLLMClient } from './llm-stub.js';
import { ToolRegistry, fsListTool } from './tools.js';

describe('AgentLoop', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'yi-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it('跑通 intent→ponder→plan→action→result,棋谱树含 5 节点', async () => {
    await writeFile(join(dir, 'hello.txt'), 'hi');
    const reg = new ToolRegistry();
    reg.register(fsListTool);
    const loop = new AgentLoop({ llm: new StubLLMClient(), tools: reg, workdir: dir });
    const root = await loop.run({ input: '列出文件', attachments: [], mountedAssets: [], mode: 'trusted' });
    expect(root.type).toBe('intent');
    const tree = loop.getTree();
    const types = tree.serialize().map((n) => n.type);
    expect(types).toContain('ponder');
    expect(types).toContain('plan');
    expect(types).toContain('action');
    expect(types).toContain('result');
    const action = tree.serialize().find((n) => n.type === 'action');
    expect(action?.status).toBe('done');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @yi/desktop test`
Expected: FAIL — module not found

- [ ] **Step 3: 实现 `apps/desktop/src/main/recorder.ts`**

```typescript
import { writeJson } from '@yi/storage';
import type { YiNode } from '@yi/shared';
import { join } from 'node:path';

export class Recorder {
  async writeTree(dir: string, nodes: YiNode[]): Promise<void> {
    await writeJson(join(dir, '.yi', 'tree.json'), nodes);
  }
}
```

- [ ] **Step 4: 实现 `apps/desktop/src/main/loop.ts`**

```typescript
import { ulid } from 'ulid';
import type {
  YiNode, IntentPayload, ActionPayload, ResultPayload, ToolEvent,
} from '@yi/shared';
import { ConversationTree } from './tree.js';
import { StubLLMClient } from './llm-stub.js';
import { ToolRegistry } from './tools.js';
import { Recorder } from './recorder.js';

export interface AgentLoopDeps {
  llm: StubLLMClient;
  tools: ToolRegistry;
  workdir: string;
}

export class AgentLoop {
  private tree: ConversationTree;
  private recorder = new Recorder();
  constructor(private deps: AgentLoopDeps) {
    this.tree = new ConversationTree();
  }

  getTree(): ConversationTree { return this.tree; }

  async run(intent: IntentPayload): Promise<YiNode> {
    const root = this.tree.addNode({ type: 'intent', parentId: null, payload: intent });
    const started = Date.now();

    // 长考
    const ponder = this.tree.addNode({ type: 'ponder', parentId: root.id, payload: {
      reasoning: `解读布局:${intent.input}`, modelUsed: 'stub', tokensIn: 0, tokensOut: 0 } });
    this.tree.setStatus(ponder.id, 'done');

    // 分投
    const plan = await this.deps.llm.plan(intent.input);
    const planNode = this.tree.addNode({ type: 'plan', parentId: ponder.id, payload: plan });
    this.tree.setStatus(planNode.id, 'done');

    // 落子
    const changes: { path: string; op: 'create' | 'modify' | 'delete' }[] = [];
    let lastAction: YiNode | null = null;
    for (const step of plan.steps) {
      const tool = this.deps.tools.get(step.tool);
      const t0 = Date.now();
      const actionNode = this.tree.addNode({
        type: 'action', parentId: lastAction?.id ?? planNode.id, payload: {
          stepId: step.id, tool: step.tool, args: {}, result: null, durationMs: 0 } });
      let result: unknown = null;
      let errMsg: string | undefined;
      for await (const ev of tool.run({}, { workdir: this.deps.workdir, permission: intent.mode })) {
        if (ev.type === 'result') result = ev.result;
        if (ev.type === 'error') errMsg = ev.message;
      }
      const ap = actionNode.payload as ActionPayload;
      ap.result = result;
      ap.error = errMsg;
      ap.durationMs = Date.now() - t0;
      this.tree.setStatus(actionNode.id, errMsg ? 'error' : 'done');
      lastAction = actionNode;
    }

    // 收官
    const resultPayload: ResultPayload = {
      summary: '完成', changes, durationMs: Date.now() - started, tokensTotal: 0 };
    const resultNode = this.tree.addNode({
      type: 'result', parentId: lastAction?.id ?? planNode.id, payload: resultPayload });
    this.tree.setStatus(resultNode.id, 'done');

    await this.recorder.writeTree(this.deps.workdir, this.tree.serialize());
    return root;
  }
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `pnpm --filter @yi/desktop test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/main/loop.ts apps/desktop/src/main/loop.test.ts apps/desktop/src/main/recorder.ts
git commit -m "feat(desktop): AgentLoop 端到端 (长考→分投→落子→收官) + Recorder"
```

---

## Task 9: apps/desktop — headless CLI 入口

**Files:**
- Create: `apps/desktop/src/main/cli.ts`, `apps/desktop/src/main/cli.test.ts`

**Interfaces:**
- Consumes: `AgentLoop`, `StubLLMClient`, `ToolRegistry`, `fsListTool`, `@yi/assets`(`writeQipu`)
- Produces: `runHeadless(intent, workdir)` 函数 + CLI main。E2E 依赖

- [ ] **Step 1: 写失败测试**

`apps/desktop/src/main/cli.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runHeadless } from './cli.js';
import { readQipu } from '@yi/assets';

describe('runHeadless', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'yi-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it('跑任务并写出 .yi.json 棋谱,可读回', async () => {
    await writeFile(join(dir, 'a.txt'), 'x');
    await runHeadless({
      intent: { input: '列出文件', attachments: [], mountedAssets: [], mode: 'trusted' },
      workdir: dir,
    });
    const qipuPath = join(dir, 'task.yi.json');
    const q = await readQipu(qipuPath);
    expect(q.tree.some((n) => n.type === 'result')).toBe(true);
    // tree.json 也写了
    const treeJson = JSON.parse(await readFile(join(dir, '.yi', 'tree.json'), 'utf8'));
    expect(treeJson.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @yi/desktop test`
Expected: FAIL — module not found

- [ ] **Step 3: 实现 `apps/desktop/src/main/cli.ts`**

```typescript
import { ulid } from 'ulid';
import type { IntentPayload } from '@yi/shared';
import { writeQipu } from '@yi/assets';
import { AgentLoop } from './loop.js';
import { StubLLMClient } from './llm-stub.js';
import { ToolRegistry, fsListTool } from './tools.js';
import { join } from 'node:path';

export interface HeadlessInput {
  intent: IntentPayload;
  workdir: string;
}

export async function runHeadless(input: HeadlessInput): Promise<void> {
  const reg = new ToolRegistry();
  reg.register(fsListTool);
  const loop = new AgentLoop({ llm: new StubLLMClient(), tools: reg, workdir: input.workdir });
  await loop.run(input.intent);
  const tree = loop.getTree().serialize();
  await writeQipu(join(input.workdir, 'task.yi.json'), {
    meta: {
      id: ulid(),
      title: input.intent.input.slice(0, 40),
      createdAt: new Date().toISOString(),
      mode: input.intent.mode,
      model: 'stub',
      assetsUsed: [],
      tags: [],
    },
    tree,
  });
}

// CLI main: pnpm --filter @yi/desktop cli -- <workdir> "<intent>"
async function main() {
  const [, , workdir, intentText] = process.argv;
  if (!workdir || !intentText) {
    console.error('用法: cli <workdir> "<intent>"');
    process.exit(1);
  }
  await runHeadless({
    intent: { input: intentText, attachments: [], mountedAssets: [], mode: 'trusted' },
    workdir,
  });
  console.log('done');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm --filter @yi/desktop test`
Expected: PASS

- [ ] **Step 5: 手动跑一次真 CLI**

Run: `pnpm --filter @yi/desktop cli -- ./test-sandbox "列出文件"`
Expected: 输出 `done`,生成 `./test-sandbox/task.yi.json` 与 `./test-sandbox/.yi/tree.json`

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/main/cli.ts apps/desktop/src/main/cli.test.ts
git commit -m "feat(desktop): headless CLI 入口 (runHeadless + main)"
```

---

## Task 10: 端到端验收 — STOP + FORK + 棋谱重载

**Files:**
- Create: `apps/desktop/src/main/e2e.test.ts`

**Interfaces:**
- Consumes: 全部前序产物
- Produces: 一条端到端测试,覆盖验收标准 4(STOP/FORK)与 5(棋谱重载)

- [ ] **Step 1: 写端到端测试**

`apps/desktop/src/main/e2e.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runHeadless } from './cli.js';
import { readQipu } from '@yi/assets';
import { ConversationTree } from './tree.js';

describe('E2E: 棋谱重载 + fork', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'yi-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it('写出棋谱→读回→fork 出新分支,原分支保留', async () => {
    await writeFile(join(dir, 'a.txt'), 'x');
    await runHeadless({
      intent: { input: '列出文件', attachments: [], mountedAssets: [], mode: 'trusted' },
      workdir: dir,
    });
    // 重载
    const q = await readQipu(join(dir, 'task.yi.json'));
    const tree = ConversationTree.deserialize(q.tree);
    const root = tree.root!;
    expect(root.type).toBe('intent');

    // fork:在 root 下长新分支
    const forked = tree.fork(root.id, {
      input: '改主意:列出并排序', attachments: [], mountedAssets: [], mode: 'trusted' });
    expect(tree.getNode(root.id).childrenIds).toContain(forked.id);
    // 原分支的 result 节点仍在
    expect(q.tree.some((n) => n.type === 'result')).toBe(true);
  });
});
```

- [ ] **Step 2: 跑测试确认通过**

Run: `pnpm --filter @yi/desktop test`
Expected: PASS

- [ ] **Step 3: 跑全量测试 + typecheck**

Run: `pnpm -r test`
Run: `pnpm -r typecheck`
Expected: 全 PASS

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/main/e2e.test.ts
git commit -m "test(desktop): E2E 棋谱重载 + fork 分支"
```

---

## Self-Review Notes

**Spec coverage(对 MVP 验收标准):**
- 验收 1(快捷键唤输入条)→ 子计划 C,本计划 N/A ✅ 已标注
- 验收 2(PONDER→SPLIT→EXECUTE→DONE)→ Task 8 ✅
- 验收 3(调工具完成真实任务)→ Task 7+9,fs.list 真跑 ✅(shell/browser/mcp 留 B)
- 验收 4(STOP/FORK)→ Task 5+10 ✅
- 验收 5(棋谱生成与重载)→ Task 4+9+10 ✅
- 验收 6(4 级权限切换)→ 模式类型已定(Task 2),真权限网关留 B;本计划 mode 透传到 ToolContext ✅ 占位
- 验收 7(资产双开关)→ 子计划 B ✅ 已标注
- 验收 8(LLM baseURL 可配)→ 子计划 B(本计划用 stub)✅ 已标注

**Placeholder scan:** 无 TBD/TODO,每步有完整代码。
**Type consistency:** `IntentPayload.mode` 全程 `PermissionMode`;`ToolEvent`/`Tool` 签名在 shared 定义、tools.ts 与 loop.ts 消费一致;`Qipu` 结构在 assets 定义、cli.ts 消费一致。
