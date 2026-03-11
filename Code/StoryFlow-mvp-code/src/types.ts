// 关键数据结构类型定义
export interface Player {
  gender: 'male' | 'female';
  age: number;
  job: string;
  mbti: 'ENFJ' | 'INTJ' | 'INFJ' | 'ENTJ';
  description: string;
}

export interface Candidate {
  id: string;
  name: string;
  age: number;
  job: string;
  mbti: 'ENFJ' | 'INTJ' | 'INFJ' | 'ENTJ';
  tagline: string;
}

export interface GameState {
  opponent: Candidate;
  currentChapter: number;
  currentNodeId: string;
  affection: number;
  flags: Record<string, any>;
}

export interface StoryNode {
  id: string;
  chapter: number;
  text: string;
  options: Array<{
    text: string;
    nextNode: string;
    effects: Array<any>;
    condition?: any;
  }>;
}
