from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/ping", summary="连通性探针（带 API 前缀）")
async def ping() -> dict[str, str]:
    return {"message": "pong"}
