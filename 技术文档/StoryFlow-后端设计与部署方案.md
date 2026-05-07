# StoryFlow MVP 后端扩充设计与部署方案

## 1. 文档说明

| 项目 | 说明 |
|------|------|
| 文档版本 | v1.0 |
| 适用项目 | StoryFlow-mvp（MBTI 心动相亲局） |
| 前端代码路径 | `Code/StoryFlow-mvp-code` |
| 前置阅读 | `技术架构文档v1.0.md`（当前为纯前端架构） |
| Python 专项（学习向） | `StoryFlow-后端方案-Python-FastAPI.md`（FastAPI 目录、示例、与 Node 对照表） |
| 更新日期 | 2026-03-30 |

本文档在现有「纯前端 + 静态 JSON」MVP 基础上，给出**可选 Python / Node.js** 两套后端技术路线、**云服务与部署形态**建议，以及**部署与日常维护**的可执行步骤 checklist。目标是：架构可演进、运维成本可控、与前端 TypeScript 类型可对齐。**若你希望把 Python 与 Node 分开精读**：总览里 §4 / §5 为缩略版；Python 的展开说明见上表「Python 专项」文档。

---

## 2. 背景与目标

### 2.1 现状摘要

- 剧本与配置来自 `public/data/*.json`；游戏态主要在 Zustand 内存中，部分角色信息可写 `localStorage`。
- 无服务端鉴权、无跨设备存档、无集中化运营数据；适合验证玩法，不适合长期用户体系与内容治理。

### 2.2 引入后端后的典型目标（可按阶段裁剪）

| 优先级 | 能力 | 说明 |
|--------|------|------|
| P0 | 静态资源 API 化 | 剧本列表、单剧本 JSON、gameConfig 可由服务端版本化与灰度 |
| P0 | 健康检查与可观测 | `/health`、`/ready`，结构化日志，便于云探活与排障 |
| P1 | 用户与存档 | 账号或设备令牌、云端存档（对接 `Player` / `GameState` / `PlayerProfile`） |
| P1 | 安全基线 | HTTPS、CORS 白名单、速率限制、敏感配置走环境变量与密钥托管 |
| P2 | 运营与统计 | 结局分布、漏斗、内容热更新审计 |
| P2 | 生成类能力 | AI 评语等（与现有 `generateMockAIComment` 类逻辑对接真实模型时需服务端密钥） |

**设计原则**：第一期可先只做 **P0 + P1 中的「匿名设备存档」或「简单 JWT 用户」** 之一，避免一次性堆满复杂度。

---

## 3. 总体架构建议

### 3.1 逻辑分层

```
[ 浏览器 SPA (Vite + React) ]
        │ HTTPS
        ▼
[ API 网关 / 负载均衡 / CDN（可选） ]
        │
        ▼
[ 应用服务：REST 或少量 tRPC（若全栈 TS） ]
        │
   ┌────┴────┐
   ▼         ▼
[ 关系型 DB ]  [ 对象存储（可选：剧本大文件、版本包） ]
```

- **API 风格**：MVP 推荐 **REST + JSON**（与现有 `fetchJson` 习惯一致）；若团队全 TypeScript 且希望强类型穿透，可评估 **tRPC**（通常与 Node 栈更贴近）。
- **数据库**：首选 **PostgreSQL**（JSONB 适合存剧本片段与扩展字段；生态成熟）。SQLite 仅适合单机演示或极低流量。
- **缓存**：Redis 可选；首期流量小可不启用，用 DB + 合理索引即可。

### 3.2 与前端类型的对齐要点

前端 `src/types.ts` 已定义 `Player`、`GameState`、`PlayerProfile`、`Script` 等。后端宜：

- 以 **OpenAPI（Swagger）** 或 **JSON Schema** 导出契约，前端可用 codegen 生成客户端类型（减少手写漂移）。
- 存档接口建议 **版本化字段**（`schemaVersion`），便于以后剧本结构升级时做迁移。

### 3.3 API 草案（示例，可按迭代裁剪）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 存活探针 |
| GET | `/ready` | 依赖就绪（DB 连接等） |
| GET | `/api/v1/scripts` | 剧本列表（元信息） |
| GET | `/api/v1/scripts/{id}` | 单剧本正文（或返回 CDN 签名 URL） |
| GET | `/api/v1/config/game` | gameConfig |
| POST | `/api/v1/saves` | 创建/覆盖存档（需鉴权或设备 ID） |
| GET | `/api/v1/saves/latest` | 最近存档 |
| POST | `/api/v1/events` | 埋点（可异步队列，第二期） |

鉴权可选路径：**匿名设备 ID + HMAC 签短令牌**（快）、**OAuth/手机号**（产品化）、**Supabase/Auth0**（减少自研）。

---

## 4. 技术选型 A：Python

> **详细版（目录结构、代码模式、Alembic 步骤、与 Nest 对照表）**：见同目录 **`StoryFlow-后端方案-Python-FastAPI.md`**。本节为总览摘要。

### 4.1 推荐组合（生产向）

| 层级 | 选型 | 说明 |
|------|------|------|
| Web 框架 | **FastAPI** | 异步友好、自动生成 OpenAPI、与 Pydantic 校验契合 |
| ASGI 服务器 | **Uvicorn**（+ Gunicorn 多 worker 可选） | 部署标准、与容器编排兼容 |
| ORM | **SQLAlchemy 2.x** + **Alembic** | 迁移可版本化；异步可用 `asyncpg` |
| 校验/配置 | **Pydantic v2** | 与 FastAPI 一体化 |
| 任务队列（可选） | **Celery + Redis** 或 **ARQ** | 埋点批处理、AI 调用削峰 |

**备选**：若团队更熟 Django，可用 **Django + Django REST framework**；开发效率高，但异步与轻量化 API 的「薄后端」感弱于 FastAPI，需接受更重项目结构。

### 4.2 Python 方案的适用场景

- 未来要强化 **数据科学 / 推荐 / NLP** 管道，与 Python 生态贴近。
- 团队已有 Python 运维与发布经验。

### 4.3 项目结构建议（示例）

```
backend-python/
├── app/
│   ├── main.py              # FastAPI 实例、路由挂载
│   ├── api/                 # 各版本路由
│   ├── models/              # ORM
│   ├── schemas/             # Pydantic（请求/响应）
│   ├── services/            # 业务逻辑
│   └── core/                # 配置、安全、DB 会话
├── alembic/                 # 迁移
├── tests/
├── Dockerfile
├── pyproject.toml 或 requirements.txt
└── README.md
```

---

## 5. 技术选型 B：Node.js

### 5.1 推荐组合（生产向）

| 层级 | 选型 | 说明 |
|------|------|------|
| 框架 | **NestJS** | 模块化、依赖注入、与大型团队协作友好 |
| 轻量备选 | **Express / Fastify** + 自组织分层 | 更小样板，需自律约定目录 |
| ORM | **Prisma**（首选）或 TypeORM | Prisma 迁移与类型体验好，和 TS 前端同语系 |
| 运行时 | **Node.js LTS**（当前建议 20.x / 22.x LTS 线） | 与 CI 固定小版本 |
| 校验 | **Zod** 或 **class-validator** | 与 Nest 管道集成成熟 |

### 5.2 Node.js 方案的适用场景

- 希望 **前后端共用类型与工具函数**（monorepo 下可抽 `packages/shared`）。
- 已有前端团队扩展 Full-stack，降低上下文切换成本。

### 5.3 项目结构建议（示例）

```
backend-node/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── scripts/             # 剧本模块：controller + service
│   ├── saves/
│   ├── prisma/
│   │   └── schema.prisma
│   └── common/              # 过滤器、守卫、DTO
├── test/
├── Dockerfile
├── package.json
└── README.md
```

---

## 6. Python vs Node.js 对比小结

| 维度 | Python (FastAPI) | Node.js (NestJS + Prisma) |
|------|------------------|---------------------------|
| 类型与契约 | Pydantic + OpenAPI 一流 | Prisma + TS DTO，前后端共享语言 |
| 性能 | 足够支撑 MVP～中小流量 | 足够支撑 MVP～中小流量 |
| 学习曲线 | Python 后台通用 | 前端工程师延伸友好 |
| 异步与 IO | asyncio 生态成熟 | 原生事件驱动 |
| 招聘/协作 | 数据/算法岗位易衔接 | 与 React 栈统一 |

**决策建议**：若团队以 **前端为主、追求类型一致与 Monorepo**，优先考虑 **Node**；若预期 **强数据/算法 pipeline**，优先考虑 **Python**。两条路在「PostgreSQL + REST + 容器化」层面部署模型相似，**切换成本主要在业务代码而非云架构**。

---

## 7. 云服务与部署形态

### 7.1 部署形态对比

| 形态 | 优点 | 注意点 |
|------|------|--------|
| **容器 + PaaS**（推荐 MVP） | 环境一致、易扩缩、云厂商一键托管 | 需 Dockerfile、健康检查 |
| **Serverless 函数** | 按量计费、免运维实例 | 冷启动、长连接与 WebSocket 受限；适合极薄 API |
| **单机 VM** | 简单直观 | 自备补丁、备份、监控，长期人力成本高 |

**MVP 推荐**：**容器单服务 + 托管 PostgreSQL**；前端仍可走 **Vercel / 静态托管**，通过环境变量配置 `VITE_API_BASE_URL`。

### 7.2 云服务商选型参考

以下为**常见组合**，按合规与备案要求选用国内或国际区：

| 区域倾向 | 计算 / 容器 | 数据库 | CDN / 静态 |
|----------|-------------|--------|------------|
| 中国大陆 | 阿里云 ACK/SAE、腾讯云 TKE/EKS、华为云 CCE | 各云 RDS PostgreSQL | OSS + CDN、静态网站托管 |
| 海外 / 快速上线 | **Fly.io**、**Render**、Railway、AWS ECS/Fargate | Neon、RDS、Managed Postgres | Cloudflare、S3+CloudFront |

选型依据：**备案与域名**、**团队熟悉度**、**托管 PostgreSQL 可用区**、**出站访问（调用外网 AI API）** 是否稳定。

### 7.3 网络与安全基线

- 全站 **HTTPS**；HSTS 按网关能力开启。
- **CORS**：仅允许前端线上域名与本地开发源（`http://localhost:5173` 等）。
- **密钥**：数据库 URL、JWT Secret、第三方 API Key 使用云 **Secrets Manager** 或 PaaS 环境变量，**禁止入库 Git**。
- **速率限制**：网关或应用层对 `/api/*` 限流，防刷存档与埋点。

---

## 8. 部署步骤（通用流程）

下列步骤对 Python / Node **通用**，差异仅在构建命令与启动命令。

### 8.1 预备清单

- [ ] 注册云账号，开通 **容器托管** 与 **RDS PostgreSQL**（或等价）。
- [ ] 准备 **域名** 与 DNS（API 子域如 `api.example.com`）。
- [ ] 创建 **私有容器镜像仓库**（云厂商默认通常自带）。
- [ ] 本地安装 Docker、云 CLI（可选）。

### 8.2 应用容器化

- [ ] 编写多阶段 **Dockerfile**：阶段一安装依赖并构建（Node）；阶段二仅拷贝虚拟环境与代码（Python）或 `dist` + 生产依赖（Node）。
- [ ] **非 root 用户**运行进程；暴露端口与健康检查路径与平台一致。
- [ ] `.dockerignore` 排除 `node_modules`、`__pycache__`、`.git` 等。

**Python 启动示例**（概念）：`uvicorn app.main:app --host 0.0.0.0 --port 8080`  
**Node 启动示例**（概念）：`node dist/main.js` 或 `nest start`（生产宜用编译后产物）

### 8.3 数据库与迁移

- [ ] 在云控制台创建 PostgreSQL，设置 **白名单 / VPC** 仅应用网段可连。
- [ ] 将连接串写入托管平台 **环境变量** `DATABASE_URL`。
- [ ] 首次部署前执行迁移：Python 使用 **Alembic upgrade**；Node 使用 **`prisma migrate deploy`**。
- [ ] 建立 **自动备份策略**（每日 + 保留 7-30 天，按业务定）。

### 8.4 发布到托管平台

- [ ] 构建镜像并推送至镜像仓库（CI 中完成）。
- [ ] 创建服务：CPU/内存按 MVP 可先 0.25～0.5 vCPU + 512MB～1GB 试跑，压测再调。
- [ ] 配置 **环境变量**：`DATABASE_URL`、`JWT_SECRET`、`CORS_ORIGINS`、`LOG_LEVEL` 等。
- [ ] 配置 **HTTP 路由** 将 `api.example.com` 指向服务；启用 TLS。
- [ ] 配置 **健康检查**：HTTP GET `/health`，失败自动重启/摘流。

### 8.5 与前端的联调与上线

- [ ] 前端 `.env.production` 设置 `VITE_API_BASE_URL=https://api.example.com`（或构建时注入）。
- [ ] 验证 **OPTIONS 预检** 与带 Cookie / Bearer 的实际请求（若使用 Cookie 需 `SameSite`、HTTPS）。
- [ ] 灰度：可先让 **仅剧本读取** 走新 API，存档仍本地，降低风险。

---

## 9. 日常维护步骤

### 9.1 监控与告警

- [ ] **可用性**：对外 URL 合成监控（如 1～5 分钟探测 `/health`）。
- [ ] **黄金指标**：延迟、错误率、流量；容器 **CPU/内存**；数据库 **连接数、慢查询**。
- [ ] **日志**：应用输出 **JSON 单行日志**，平台集中收集；设置错误率告警阈值。

### 9.2 版本发布（建议 CI/CD）

- [ ] **分支策略**：`main` 保护分支 + PR；标签发布 `v1.2.3`。
- [ ] **流水线**：lint → test → build 镜像 → push → **滚动发布** 托管服务。
- [ ] **数据库迁移**：迁移 job 在 **新代码就绪前** 或 **首批实例启动前** 自动执行（需约定兼容策略：先扩兼容列，后清旧逻辑）。

### 9.3 备份与灾备

- [ ] 确认 RDS **自动备份** 与 **可恢复时间点**。
- [ ] 周期做 **恢复演练**（季度一次即可）：新建空实例自备份恢复。
- [ ] 若剧本存对象存储，启用 **版本控制** 防误删。

### 9.4 安全运维

- [ ] 依赖漏洞扫描（`pip-audit` / `npm audit`）纳入 CI。
- [ ] 云平台 **最小权限 IAM**；数据库账号分 **迁移账号** 与 **应用账号**（DDL 仅迁移用）。
- [ ] **密钥轮换** 策略（如半年 JWT signing key），文档化步骤。

### 9.5 成本优化（流量上升后）

- [ ] 静态剧本 JSON 走 **CDN**，API 只返回元数据或短缓存头。
- [ ] 读多写少场景加 **HTTP 缓存** 或边缘缓存（注意鉴权接口勿误缓存）。

---

## 10. 分期落地路线图（建议）

| 阶段 | 内容 | 验收标准 |
|------|------|----------|
| Phase 0 | Repo 增加 `backend-*`、Dockerfile、本地 `docker compose`（app + postgres） | 本地可访问 `/health` 与示例 CRUD |
| Phase 1 | 上线只读 API：剧本列表、单剧本、gameConfig | 前端可从环境变量切换数据源 |
| Phase 2 | 存档 + 简单鉴权 + Alembic/Prisma 迁移 | 跨浏览器可恢复同一存档 |
| Phase 3 | 埋点、管理后台或内容版本化 | 可操作灰度剧本 |
| Phase 4 | AI 评语等你方产品化能力 | 密钥仅在服务端，可审计调用 |

---

## 11. 与现有文档的关系

- `技术架构文档v1.0.md` 描述**当前纯前端**实现；本文档描述**引入后端后的目标架构与运维**。
- 后续若后端落地，建议在 `技术架构文档` 中增加一节「服务端架构」并链接本文档，避免双源不一致。

---

## 12. 附录：环境变量清单（示例）

| 变量名 | 用途 |
|--------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `JWT_SECRET` 或 `SESSION_SECRET` | 签发令牌或会话 |
| `CORS_ORIGINS` | 逗号分隔的允许来源 |
| `LOG_LEVEL` | info / debug |
| `OPENAI_API_KEY` 等 | 仅 Phase 4+，且仅服务端 |

---

*文档结束。*
