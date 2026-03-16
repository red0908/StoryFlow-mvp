// MBTI 人格类型（与需求文档、gameConfig 一致）
export type MBTI = 'ENFJ' | 'INTJ' | 'INFJ' | 'ENTJ';

export type EndingType = 'success' | 'surface' | 'friend' | 'fail';

/** 玩家信息（角色创建后） */
export interface Player {
  name: string;
  gender: 'male' | 'female';
  age: number;
  job: string; // 职业 ID，对应 gameConfig.jobs[].id
  mbti: MBTI;
  description: string; // 一句话介绍
}

export interface CharacterRecord {
  encounterCount: number;
  soulmateCount: number;
  endings: string[];
  bestAffection: number;
  bestAlignment: number;
}

export interface EndingRecord {
  date: string;
  scriptId: string;
  opponentMbti: MBTI;
  endingType: EndingType;
  affection: number;
  alignment: number;
  aiComment: string;
}

export interface PlayerProfile {
  displayName: string;
  charmLevel: number;
  charmExp: number;
  unlockedScripts: string[];
  characterCollection: Partial<Record<MBTI, CharacterRecord>>;
  endingHistory: EndingRecord[];
  badges: string[];
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

/** 游戏进行中的状态（当前章节、节点、双数值等） */
export interface GameState {
  opponent: Candidate | null; // 当前选择的相亲对象
  currentChapter: number; // 1-4
  currentNodeId: string; // 剧本中的节点 ID
  affection: number; // 好感度 0-100，初始 50
  alignment: number; // 贴合度 0-100，初始 50
  flags: Record<string, unknown>; // 自定义变量，用于复杂分支
}

/** 选项效果：好感度、贴合度、职业加成与 flag 设置 */
export type Effect =
  | {
      type: 'affection';
      value?: number;
      valueByMbti?: Partial<Record<MBTI, number>>;
    }
  | {
      type: 'alignment';
      value?: number;
      valueByPlayerMbti?: Partial<Record<MBTI, number>>;
    }
  | {
      type: 'setFlag';
      key: string;
      value: unknown;
    }
  | {
      type: 'jobEffect';
      job: string;
      affection?: number;
      alignment?: number;
    };

/** 选项条件：好感度 / 贴合度 / 玩家 MBTI / 职业 / flag */
export type Condition =
  | {
      type: 'affection' | 'alignment';
      operator: '<=' | '>=' | '<' | '>' | '===';
      value: number;
    }
  | {
      type: 'playerMbti';
      value: MBTI;
    }
  | {
      type: 'playerJob';
      value: string;
    }
  | {
      type: 'flag';
      key: string;
      value: unknown;
    };

/** 剧本中单个选项 */
export interface StoryOption {
  text: string;
  nextNode: string;
  effects: Effect[];
  /** 可以是单个条件或者条件数组（全部满足） */
  condition?: Condition | Condition[];
}

/** 剧本节点 */
export interface StoryNode {
  id: string;
  chapter: number;
  scene?: string;
  text: string;
  options: StoryOption[];
}

/** 整个剧本（单文件） */
export interface Script {
  id: string;
  title: string;
  description: string;
  recommendedMbti: MBTI[];
  characters: MBTI[];
  nodes: StoryNode[];
}
