from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db import dispose_engine, get_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await dispose_engine()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", summary="存活探针（负载均衡 / 平台健康检查）")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready", summary="就绪探针（校验数据库等依赖，可调度流量）")
async def ready() -> dict[str, object]:
    engine = get_engine()
    if engine is None:
        return {"ready": True, "database": "not_configured"}
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return {"ready": True, "database": "ok"}
