# StoryFlow API（Python / FastAPI）

与 [`技术文档/StoryFlow-后端方案-Python-FastAPI.md`](../技术文档/StoryFlow-后端方案-Python-FastAPI.md) 对齐的最小可运行骨架：健康检查、就绪检查（可选数据库）、`/api/v1/ping`。

## 环境要求

- **Python 3.11+**（推荐 3.12）。若本机 `python3 --version` 低于 3.11，可只用下方 Docker Compose，或先用 pyenv / 官方安装包升级解释器。
- 安装依赖前建议先升级 pip：`python -m pip install --upgrade pip`

## 本地开发

```bash
cd backend-python
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

未设置 `DATABASE_URL` 时，`GET /ready` 会返回 `database: not_configured` 且仍为 `ready: true`，便于先跑通 API。

## Docker Compose（API + PostgreSQL）

```bash
docker compose up --build
```

- 文档与调试：<http://localhost:8000/docs>
- 健康：<http://localhost:8000/health>
- 就绪（连库）：<http://localhost:8000/ready>

## 测试

```bash
pip install -e ".[dev]"
pytest
```

## 后续迭代

按技术文档增加 `alembic`、剧本只读路由、存档表等。
