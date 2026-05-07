# StoryFlow · 心域奇旅（MVP）

以 **MBTI 人格理论** 为核心的轻量级相亲互动叙事游戏：玩家在剧本中创建角色、从候选对象中择一，通过章节选项推动剧情，**好感度**与**贴合度**共同影响走向与四种结局；配合剧本大厅、玩家档案、心域地图与沉浸式 BGM/UI 音效，形成可反复体验的 MVP 闭环。

本仓库为 **心域奇旅 / StoryFlow** 的 **1.0 MVP** 全量资料与代码集合。

---

## 仓库结构

| 路径 | 说明 |
|------|------|
| `Code/StoryFlow-mvp-code/` | 主前端工程：React 18、Vite、Redux Toolkit、Tailwind CSS、`react-router-dom` 路由 |
| `backend-python/` | 后端骨架：Python / FastAPI（健康检查、就绪检查、与后续业务扩展对齐，详见该目录 README） |
| `需求文档/`、`设计文档/`、`技术文档/`、`内容文档/` | 需求、交互与视觉设计、架构与后端方案、剧本与内容素材说明 |
| `心域奇旅/`、`其他文档/` | 大平台与衍生说明、执行计划等 |

前端详细模块划分（角色创建、候选人、剧情引擎、剧本 JSON、本地进度等）见 [`Code/README.md`](Code/README.md)。

---

## 核心用户流程（MVP）

```text
首页 → 剧本大厅 → 创建角色 → 选择相亲对象（5 选 1）→
四章剧情（选项驱动）→ 结局判定 → 模拟 AI 评语 → 档案 / 心域地图
```

主要路由入口：`/`、`/scripts`、`/create/myRole`、`/blindDate`、`/game`、`/ending`、`/profile`、`/map` 等（见 `Code/StoryFlow-mvp-code/src/App.tsx`）。

---

## 本地开发速览

**前端**

```bash
cd Code/StoryFlow-mvp-code
npm install
npm run dev
```

**后端 API（可选，与 FastAPI 方案文档配合迭代）**

```bash
cd backend-python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

亦可使用 `backend-python/docker-compose.yml` 启动 API + PostgreSQL，详见 [`backend-python/README.md`](backend-python/README.md)。

---

## 文档索引

- 产品与玩法定稿：`需求文档/需求文档20260317.md`
- 前端架构说明：`Code/README.md`
- 后端技术方案：`技术文档/StoryFlow-后端方案-Python-FastAPI.md`、`技术文档/StoryFlow-后端设计与部署方案.md`

---

## 许可证与备注

具体开源协议以项目后续补充为准；MVP 阶段 AI 评语为规则/模板模拟，不依赖外部大模型接口。
