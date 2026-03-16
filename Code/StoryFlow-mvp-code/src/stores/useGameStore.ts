import { create } from 'zustand';
import type { Candidate, GameState } from '../types';

const INITIAL_AFFECTION = 50;
const INITIAL_ALIGNMENT = 50;

interface GameStoreState extends Omit<GameState, 'opponent'> {
  opponent: Candidate | null;
  setOpponent: (opponent: Candidate | null) => void;
  setCurrentNode: (nodeId: string, chapter: number) => void;
  addAffection: (delta: number) => void;
  setAffection: (value: number) => void;
  addAlignment: (delta: number) => void;
  setAlignment: (value: number) => void;
  setFlag: (key: string, value: unknown) => void;
  resetGame: () => void;
  /** 开始新游戏：选定对方后初始化游戏状态 */
  startGame: (opponent: Candidate) => void;
}

const getInitialState = (): Pick<GameStoreState, 'opponent' | 'currentChapter' | 'currentNodeId' | 'affection' | 'alignment' | 'flags'> => ({
  opponent: null,
  currentChapter: 1,
  currentNodeId: '',
  affection: INITIAL_AFFECTION,
  alignment: INITIAL_ALIGNMENT,
  flags: {},
});

export const useGameStore = create<GameStoreState>((set) => ({
  ...getInitialState(),

  setOpponent: (opponent) => set({ opponent }),

  setCurrentNode: (nodeId, chapter) =>
    set({ currentNodeId: nodeId, currentChapter: chapter }),

  addAffection: (delta) =>
    set((state) => ({
      affection: Math.min(100, Math.max(0, state.affection + delta)),
    })),

  setAffection: (value) =>
    set({ affection: Math.min(100, Math.max(0, value)) }),

  addAlignment: (delta) =>
    set((state) => ({
      alignment: Math.min(100, Math.max(0, state.alignment + delta)),
    })),

  setAlignment: (value) =>
    set({ alignment: Math.min(100, Math.max(0, value)) }),

  setFlag: (key, value) =>
    set((state) => ({
      flags: { ...state.flags, [key]: value },
    })),

  resetGame: () => set(getInitialState()),

  startGame: (opponent) =>
    set({
      opponent,
      currentChapter: 1,
      currentNodeId: '', // 由剧情引擎设为第一章第一个节点 id
      affection: INITIAL_AFFECTION,
       alignment: INITIAL_ALIGNMENT,
      flags: {},
    }),
}));
