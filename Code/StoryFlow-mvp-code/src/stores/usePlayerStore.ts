import { create } from 'zustand';
import type { Player } from '../types';

interface PlayerState {
  /** 当前玩家角色，未创建时为 null */
  player: Player | null;
  setPlayer: (player: Player) => void;
  resetPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  player: null,
  setPlayer: (player) => set({ player }),
  resetPlayer: () => set({ player: null }),
}));
