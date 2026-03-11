# 项目代码架构介绍

## 一、整体架构

本项目为**纯前端 SPA**，基于 React + Redux Toolkit + Tailwind CSS 实现，无需后端，所有数据（剧本、角色库）均打包在静态资源中，适合部署于 Vercel/GitHub Pages 等平台。

```
[前端 SPA] (React + Redux Toolkit)
	├── 视图层：创建角色 / 选择对象 / 剧情互动 / 结局展示
	├── 状态管理：playerSlice, gameSlice (好感/当前节点/历史)
	├── 剧本引擎：剧本 JSON 加载器、条件解释器、效果执行器
	└── 工具层：随机生成器、本地存储封装
```

## 二、主要模块划分

| 模块           | 职责                                                         |
|----------------|--------------------------------------------------------------|
| 角色创建模块   | 收集用户输入，校验并存储至 store                              |
| 候选人模块     | 生成 5 个异性对象，提供选择交互                              |
| 剧情主控模块   | 加载剧本，渲染当前节点，处理选项点击                          |
| 剧本数据       | 剧本 JSON 文件，包含节点、选项、条件、效果                    |
| 本地存储模块   | 读写游戏进度与角色信息                                       |

## 三、技术栈

- **构建工具**：Vite
- **框架**：React 18 + Redux Toolkit
- **样式**：Tailwind CSS（快速搭建 UI，减少手写 CSS）
- **路由**：不使用 react-router，采用条件渲染切换（创建/选择/游戏/结局）
- **类型检查**：TypeScript（可选）
- **部署**：Vercel / Netlify

## 四、关键数据结构

### 1. 玩家信息 (Player)
```typescript
interface Player {
	gender: 'male' | 'female';
	age: number;
	job: string;        // 职业ID
	mbti: 'ENFJ' | 'INTJ' | 'INFJ' | 'ENTJ';
	description: string; // 一句话介绍
}
```

### 2. 候选人信息 (Candidate)
```typescript
interface Candidate {
	id: string;
	name: string;
	age: number;
	job: string;
	mbti: 'ENFJ' | 'INTJ' | 'INFJ' | 'ENTJ';
	tagline: string;     // 一句话介绍
}
```

### 3. 游戏状态 (GameState)
```typescript
interface GameState {
	opponent: Candidate;         // 当前选择的相亲对象
	currentChapter: number;      // 1-4
	currentNodeId: string;       // 剧本中的节点ID
	affection: number;           // 好感度 0-100
	flags: Record<string, any>;  // 自定义变量（用于复杂分支）
}
```

### 4. 剧本节点 (StoryNode) 示例
```json
{
	"id": "c1_node1",
	"chapter": 1,
	"text": "你坐在咖啡厅，等待 {opponent.name} 的到来。她/他穿着一件简单的衬衫，微笑着向你打招呼。",
	"options": [
		{
			"text": "直接开门见山，聊聊工作。",
			"nextNode": "c1_node2",
			"effects": [
				{ "type": "affection", "operator": "add", "value": 2 }
			]
		},
		{
			"text": "先夸赞对方的穿着，拉近距离。",
			"nextNode": "c1_node3",
			"effects": [
				{ 
					"type": "affection", 
					"operator": "add", 
					"valueByMbti": { "INTJ": 1, "ENFJ": 3, "INFJ": 2, "ENTJ": 1 }
				}
			],
			"condition": { "type": "affection", "operator": "<=", "value": 60 }
		}
	]
}
```

## 五、架构特点与扩展性

- **纯前端、无后端依赖**，易于部署和维护。
- **剧本与角色数据均为 JSON 配置**，便于后续扩展更多 MBTI 类型、剧情分支和结局。
- **状态管理清晰**，支持本地存储自动保存进度，提升用户体验。

---
如需详细开发计划、剧本结构或更多技术细节，请参考需求文档。
