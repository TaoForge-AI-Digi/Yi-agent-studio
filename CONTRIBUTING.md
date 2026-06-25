# 贡献到 弈 (Yi)

感谢有兴趣参与弈。这是一个早期项目,Phase 1(前端先行)正在跑,Phase 2(后端 + 三层进程 + 工具集)即将启动。各种形式的贡献都欢迎:提 Issue、写 PR、改文档、做资产(手筋/器/驿/棋魂/棋经/专家包)、社区答疑。

---

## 行为准则

- 友善、包容、就事论事。
- 不容忍人身攻击、骚扰、歧视。
- 尊重不同的经验背景和技能栈。

---

## 我能贡献什么

| 类型 | 怎么入手 |
|---|---|
| **Bug 反馈** | 在 Issue 区描述:复现步骤 / 预期 / 实际 / 截图 / 浏览器或 OS 版本 |
| **功能建议** | 先搜现有 Issue 避免重复;附使用场景,而不只是"想要 X" |
| **前端代码** | `apps/client/` 是主战场,见下文开发流程 |
| **文档** | `docs/` + README;中文优先,英文次之 |
| **i18n 翻译** | `apps/client/src/i18n/locales/`,9 种语言(zh/en/ja/ko/fr/de/ru/es/pt,zh-TW 可加) |
| **资产** | 弈林市场尚未上线,但你可以按 `docs/superpowers/specs/2026-06-25-yi-tech-architecture.md` §2.2 定义的目录结构贡献示例资产 |
| **安全漏洞** | 不要公开 Issue,见 [SECURITY.md](SECURITY.md) / README 底部邮箱 |

---

## 开发流程

### 前置

- Node 20+(**推荐 23+**;Node 18 部分原生依赖装不上)
- npm 10+(或 pnpm 9+,如果你更习惯)
- Git

### 拉代码 + 装依赖

```bash
git https://github.com/TaoForge-AI-Digi/Yi-agent-studio
cd Yi/apps/client
npm install
```

### 跑起来

```bash
npm run dev          # Vite dev server, http://localhost:5173/
npm run typecheck    # vue-tsc,提交前必跑
npm run build        # 生产构建到 dist/
npm run preview      # 预览生产包
```

### 跑测试

```bash
npx vitest                            # 单元
npx playwright install --with-deps    # 一次性装 E2E 浏览器
npx playwright test                   # E2E
```

(Phase 1 测试覆盖率较低,欢迎补)

### 改代码

- **新组件/页面**:参考 `apps/client/src/components/yi...` `apps/client/src/views/yi...` 目录的风格(都还在抄自 hermes-studio 的过渡期,逐渐往自研风格收敛)。
- **新路由**:`apps/client/src/router/index.ts` + 新 view 文件。路径前缀 `/yi/...`,route name `yi.xxx`。
- **i18n**:`apps/client/src/i18n/locales/zh.ts` 加 key,其他 8 种语言同步加(英语 `en.ts` 优先,其余可后续补)。
- **状态**:`apps/client/src/stores/yi...`,用 Pinia `defineStore`。

### 提交

- **Commit 风格**建议 [Conventional Commits](https://www.conventionalcommits.org/):`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `test:` / `style:` / `perf:`。
- 一个 commit 做一件事;PR 拆细。
- 中文 / 英文 commit 都可以,推荐中文(`feat: 新增角色页 nav-item`)。
- 提交前:`npm run typecheck` 必须过。

### 提 PR

1. fork 仓库,新分支:`git checkout -b feat/role-page`
2. 改 + commit + push
3. 提 PR,标题 + 描述,关联 Issue
4. 等 review

---

## 目录结构速览

```
apps/client/
├── public/                       静态资源
├── src/
│   ├── App.vue
│   ├── main.ts                   入口
│   ├── router/                   vue-router(hash)
│   ├── stores/                   Pinia
│   │   ├── chat.ts
│   │   ├── profiles.ts
│   │   ├── app.ts
│   │   └── settings.ts
│   ├── components/
│   │   ├── layout/               AppSidebar / PageSidebar / ThemeSwitch
│   │   ├── chat/                 ChatPanel / ChatInput / MessageList
│   │   ├── skills/               技能相关
│   │   ├── plugins/              插件相关
│   │   ├── settings/             设置页各 tab
│   │   └── ...
│   ├── views/                    路由 view
│   ├── api/                      REST + WS 客户端
│   ├── composables/              useTheme / useKeyboard
│   ├── i18n/locales/             9 语言
│   └── styles/                   variables.scss
├── vite.config.ts
└── package.json
```

---

## 决策与文档

- **产品设计**:`docs/superpowers/specs/2026-06-25-yi-product-design.md`
- **技术架构 + ADR**:`docs/superpowers/specs/2026-06-25-yi-tech-architecture.md`
- **实施计划**:`docs/superpowers/plans/2026-06-25-yi-mvp-*.md`

改大方向前请先翻这些;有疑问开 Issue 讨论。

---

## 协议

贡献的代码遵循 [Apache License 2.0](LICENSE)。

提 PR 即表示你同意按 Apache-2.0 协议授权你的贡献。
