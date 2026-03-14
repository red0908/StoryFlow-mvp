// MBTI 人格类型（与需求文档、gameConfig 一致）
export type MBTI = 'ENFJ' | 'INTJ' | 'INFJ' | 'ENTJ';

/** 玩家信息（角色创建后） */
export interface Player {
  gender: 'male' | 'female';
  age: number;
  job: string; // 职业 ID，对应 gameConfig.jobs[].id
  mbti: MBTI;
  description: string; // 一句话介绍
}

/** 候选人信息（随机生成或选择的对象） */
export interface Candidate {
  id: string;
  name: string;
  age: number;
  job: string;
  mbti: MBTI;
  tagline: string; // 一句话介绍
}

/** 游戏进行中的状态（当前章节、节点、好感度等） */
export interface GameState {
  opponent: Candidate | null; // 当前选择的相亲对象
  currentChapter: number; // 1-4
  currentNodeId: string; // 剧本中的节点 ID
  affection: number; // 好感度 0-100，初始 50
  flags: Record<string, unknown>; // 自定义变量，用于复杂分支
}

/** 选项效果：固定好感增减 */
export interface AffectionEffect {
  type: 'affection';
  operator: 'add' | 'subtract';
  value?: number;
  valueByMbti?: Partial<Record<MBTI, number>>;
}

/** 选项条件：如好感度比较 */
export interface AffectionCondition {
  type: 'affection';
  operator: '<=' | '>=' | '<' | '>' | '===';
  value: number;
}

/** 剧本中单个选项 */
export interface StoryOption {
  text: string;
  nextNode: string;
  effects: AffectionEffect[];
  condition?: AffectionCondition;
}

/** 剧本节点 */
export interface StoryNode {
  id: string;
  chapter: number;
  text: string;
  options: StoryOption[];
}
