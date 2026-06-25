# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.0.x (Phase 1 / MVP 前置) | ✅ 当前在跑,接受安全报告 |

Phase 1 是早期前端先行,没有发布版本号,所有 commit 在 `main` 分支。

## Reporting a Vulnerability

**请不要通过公开 Issue 报告安全漏洞。**

发邮件到 `<duanmuqianlin@gmail.com>`,包含:

- 漏洞类型(XSS / RCE / SSRF / 鉴权绕过 / 信息泄露 / 依赖投毒 ...)
- 复现步骤(尽量短,够别人重现即可)
- 影响范围
- 你的复现环境(浏览器 / OS / Node 版本 / commit hash)
- 可选:修复建议

我们会:

- **24 小时内**确认收到
- **7 天内**给出初判 + 修复时间表
- 修复后公开致谢(除非你要求匿名)

## 已知范围

Phase 1 = Vue 3 SPA + mock 状态。无后端、无 Electron 沙箱,主要风险面:

- **XSS** via Markdown / KaTeX / Mermaid 渲染:`apps/client/src/components/yi...` 内的渲染器;Hermes 项目未审计过这些组件,审阅优先
- **依赖投毒**:`apps/client/package.json` 第三方依赖;跑 `npm audit` + 锁文件审查
- **本地文件路径穿越**:如果未来加入文件 IO 工具,需做 workdir 边界校验

## 沙箱规划

Phase 2 起跑 Electron + utilityProcess + Koa 后端,会引入:

- 工具进程隔离(utilityProcess 沙箱)
- 文件系统 workdir 边界
- 资产(V8 isolate / worker_threads 强隔离)
- 网络域名白名单
- 4 级权限模型(PLAN / ASK / TRUSTED / BYPASS)

详见 [`docs/superpowers/specs/2026-06-25-yi-tech-architecture.md` §3.5 安全与信任边界](docs/superpowers/specs/2026-06-25-yi-tech-architecture.md)。
