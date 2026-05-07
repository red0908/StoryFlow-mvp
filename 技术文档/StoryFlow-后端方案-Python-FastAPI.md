# StoryFlow 后端方案详解：Python（FastAPI）

## 1. 文档说明

| 项目 | 说明 |
|------|------|
| 文档版本 | v1.0 |
| 配套总览 | `StoryFlow-后端设计与部署方案.md`（双栈对比、云与运维 checklist） |
| 另一侧栈 | 总览文档 §5 **Node.js（NestJS）** — 可与本文对照学习 |
| 更新日期 | 2026-03-30 |
| 仓库内骨架 | `backend-python/`（FastAPI + `/health`、`/ready`、Compose 起 PostgreSQL） |

本文聚焦 **Python 路线**：技术栈、心智模型、目录结构、与 StoryFlow 前端类型的对齐方式，以及和 **Node/Nest** 的对比，便于**单独深入学习** Python 方案，再和总览里的 Node 一节对照。

---

## 2. 推荐技术栈（生产向 MVP）

| 层级 | 选型 | 角色 |
|------|------|------|
| 语言 | **Python 3.11+**（建议 3.12） | 类型注解 + 生态成熟 |
| Web 框架 | **FastAPI** | 路由、依赖注入、自动 OpenAPI |
| ASGI 服务 | **Uvicorn** | 开发；生产可多 worker 或前置 Gunicorn |
| 数据校验 | **Pydantic v2** | 请求体/响应体 = 显式模型，类似 TS 接口 |
| ORM | **SQLAlchemy 2.x** | `declarative` + `session`；支持 async |
| 驱动（异步） | **asyncpg** | PostgreSQL 异步连接 |
| 迁移 | **Alembic** | 版本化 DDL，与 SQLAlchemy 模型同步 |
| HTTP 客户端（测） | **httpx** | 异步测试 `AsyncClient` 调自己的 API |

**依赖管理**：推荐 **`uv` + `pyproject.toml`** 或 **Poetry**；传统也可用 `pip-tools` 锁定 `requirements.txt`。

**备选框架**：**Django + Django REST framework** 适合后台管理-heavy、自带 Admin 的团队；本 MVP 更偏「薄 API + JSON」，FastAPI 更贴当前前端形态。

---

## 3. 为什么用 FastAPI（学习角度）

- **OpenAPI 自动生成**：与总览里「前端 codegen 对齐契约」一致；你在浏览器打开 `/docs` 即可调试，相当于自带 Swagger UI。
- **依赖注入（Depends）**：数据库会话、当前用户、配置对象都可注入，和 NestJS 的 Provider 理念接近，语法更轻。
- **async/await**：路由里可 `await` 数据库与 HTTP 出站请求，避免阻塞线程；**注意**：混用大量同步 IO 时要么改成异步驱动，要么放到线程池，否则失去 async 收益。
- **Pydantic**：把「JSON 长什么样」写进模型里，思想上接近前端的 `interface` + 运行时校验（zod 一类）。

---

## 4. 建议目录结构（可与 `backend-python/` 实际仓库一致）

```
backend-python/
├── pyproject.toml           # 或 requirements.txt
├── alembic.ini
├── alembic/
│   └── versions/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 实例 lifespan（启动/关闭 DB 引擎）
│   ├── core/
│   │   ├── config.py        # Pydantic Settings：读环境变量
│   │   ├── security.py      # JWT / 口令哈希（按需）
│   │   └── db.py            # engine、session factory
│   ├── api/
│   │   └── v1/
│   │       ├── router.py    # 聚合子路由
│   │       ├── health.py
│   │       ├── scripts.py   # 剧本列表/详情
│   │       └── saves.py     # 存档（Phase 2）
│   ├── models/              # SQLAlchemy ORM 表
│   ├── schemas/             # Pydantic：请求/响应 DTO（不入 DB 的纯结构）
│   └── services/            # 业务逻辑，供路由薄层调用
├── tests/
│   └── test_health.py
└── Dockerfile
```

**分层习惯**：`schemas` ≈ 前端的 DTO；`models` ≈ 数据库行；`services` ≈ 可单测的业务规则。**不要让路由里堆 SQL**。

---

## 5. 与前端 `types.ts` 的对齐思路

前端已有 `Player`、`GameState`、`Script`、`StoryNode` 等。Python 侧典型做法是：

1. **响应体**用 Pydantic 模型 mirror 字段名与嵌套结构（枚举用 `Literal` 或 `Enum`）。
2. **首批只读 API**：剧本与 `gameConfig` 的 JSON 可先 **原样从 DB 或文件读出**，Pydantic 只做最外层包装（如 `Script`），减少一次结构改版的全链路修改。
3. **存档接口**：设计 `SavePayload`，内含 `schemaVersion`、`player`、`gameState`；后端存 **JSONB** 列，便于以后前端加字段而不必立刻改表结构。

示例（仅说明形状，非完整项目）：

```python
# app/schemas/script.py
from pydantic import BaseModel, Field

class StoryNodeOut(BaseModel):
    id: str
    chapter: int
    text: str
    # options: list[StoryOptionOut]  # 按需展开

class ScriptOut(BaseModel):
    id: str
    title: str
    description: str
    nodes: list[dict]  # MVP 可先宽松，与 public JSON 一致
```

严格模式可在迭代中把 `nodes: list[dict]` 换成嵌套的 `StoryNodeOut`，与 TypeScript 一并收紧。

---

## 6. 核心代码模式（极简示例）

### 6.1 应用入口与健康检查

```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()

app = FastAPI(title="StoryFlow API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health():
    return {"status": "ok"}
```

### 6.2 依赖注入：数据库会话

```python
# app/core/db.py（概念）
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

engine = create_async_engine("postgresql+asyncpg://...", pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
```

```python
# app/api/v1/scripts.py（概念）
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db

router = APIRouter(prefix="/scripts", tags=["scripts"])

@router.get("/{script_id}")
async def get_script(script_id: str, db: AsyncSession = Depends(get_db)):
    # service 层查询并组装 ScriptOut
    ...
```

心智对照：**`Depends(get_db)`** ≈ Nest 里在 controller 构造函数或方法参数里注入 `PrismaService`。

---

## 7. 数据库与 Alembic（学习步骤）

1. 在 `app/models/` 定义 SQLAlchemy 模型（表 `scripts` 元数据表、表 `saves` 等）。
2. `alembic init` 一次后，配置 `alembic/env.py` 指向同一 `Base.metadata`。
3. 生成迁移：`alembic revision --autogenerate -m "init"`（自动 diff 需谨慎人工 Review）。
4. 应用迁移：`alembic upgrade head`（CI/CD 发布步骤里执行）。
5. **团队约定**：不在生产手工改表；缺迁移的 hotfix 也要补 revision。

---

## 8. 本地运行与测试

```bash
# 开发（热重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 若使用 Docker Compose：app + postgres 同网段，DATABASE_URL 指向服务名 postgres
```

**pytest + httpx**：对 `app` 使用 `AsyncClient` 测 `GET /health`、`GET /api/v1/scripts/...`，无需起真实服务器（`lifespan` 按需 mock DB）。

---

## 9. 部署要点（Python 特有）

- 生产用 **`uvicorn app.main:app --host 0.0.0.0 --port 8080`**，进程管理交给容器或 systemd。
- CPU 绑定多核时可用 **Gunicorn + Uvicorn worker**：`gunicorn -k uvicorn.workers.UvicornWorker app.main:app`。
- 静态大 JSON 若仍放对象存储，FastAPI 只返回 URL 或 metadata，避免大 body 挤占应用内存。

更多通用步骤见总览文档 **§8 部署步骤**、**§9 日常维护**。

---

## 10. 与 Node.js（NestJS + Prisma）对照表（学习用）

| 维度 | Python（本文） | Node（总览 §5） |
|------|----------------|-----------------|
| 语言 | Python + 类型注解 | TypeScript 端到端 |
| Web 层 | FastAPI 路由 + Depends | Nest Controller + Provider |
| 请求体验证 | Pydantic | class-validator / Zod |
| ORM | SQLAlchemy 2 | Prisma 或 TypeORM |
| 迁移 | Alembic | `prisma migrate` |
| API 契约 | 自动 OpenAPI | Nest 可配 Swagger；Prisma 不管 HTTP |
| 与前端共用类型 | OpenAPI codegen → TS | Monorepo 共享包更自然 |
| 异步模型 | asyncio + asyncpg | 原生 Promise/async |
| 典型适用 | 数据/算法/脚本多、团队偏 Python | 全栈 TS、前后端一人维护 |

两条路在 **PostgreSQL + REST + Docker + 同一套 API 路径** 上可以平行实现；**对比学习**时建议：先读懂总览里的 API 草案，再用「Python 实现一版只读 `/scripts`」和「Nest 实现同一接口」对照请求/响应与错误码。

---

## 11. 推荐阅读（官方）

- [FastAPI 中文文档](https://fastapi.tiangolo.com/zh/)（若需英文以官网为准）
- [SQLAlchemy 2.0 教程](https://docs.sqlalchemy.org/en/20/tutorial/index.html)
- [Alembic 教程](https://alembic.sqlalchemy.org/en/latest/tutorial.html)

---

*文档结束。*
