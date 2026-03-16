import { create } from 'zustand';
import type { MBTI } from '../types';

export interface ScriptSummary {
  id: string;
  title: string;
  description: string;
  recommendedMbti: MBTI[];
  cover?: string;
}

interface ScriptStoreState {
  /** 当前选择的剧本 ID，未选择时为 null */
  currentScriptId: string | null;
  currentScript?: ScriptSummary | null;
  setCurrentScript: (script: ScriptSummary) => void;
  resetScript: () => void;
}

export const useScriptStore = create<ScriptStoreState>((set) => ({
  currentScriptId: null,
  currentScript: null,
  setCurrentScript: (script) =>
    set({
      currentScriptId: script.id,
      currentScript: script,
    }),
  resetScript: () =>
    set({
      currentScriptId: null,
      currentScript: null,
    }),
}));

