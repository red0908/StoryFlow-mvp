import { create } from 'zustand';
import type { EndingRecord, MBTI, PlayerProfile } from '../types';

const PROFILE_STORAGE_KEY = 'storyflow_profile';

function getDefaultProfile(): PlayerProfile {
  return {
    displayName: '',
    charmLevel: 1,
    charmExp: 0,
    unlockedScripts: ['modern_love', 'modern_love_2'],
    characterCollection: {},
    endingHistory: [],
    badges: [],
  };
}

function loadProfileFromStorage(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return getDefaultProfile();
    const parsed = JSON.parse(raw) as Partial<PlayerProfile> | null;
    if (!parsed || typeof parsed !== 'object') return getDefaultProfile();
    return {
      ...getDefaultProfile(),
      ...parsed,
      characterCollection: parsed.characterCollection ?? {},
      endingHistory: parsed.endingHistory ?? [],
      badges: parsed.badges ?? [],
      unlockedScripts: parsed.unlockedScripts ?? getDefaultProfile().unlockedScripts,
    };
  } catch {
    return getDefaultProfile();
  }
}

function saveProfileToStorage(profile: PlayerProfile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

interface ProfileStoreState {
  profile: PlayerProfile;
  setDisplayName: (name: string) => void;
  /** 将剧本 id 加入已解锁列表（若尚未存在） */
  unlockScript: (scriptId: string) => void;
  appendEnding: (record: EndingRecord) => void;
  bumpEncounter: (mbti: MBTI, patch?: { soulmate?: boolean; endingId?: string; affection?: number; alignment?: number }) => void;
}

export const useProfileStore = create<ProfileStoreState>((set, get) => ({
  profile: loadProfileFromStorage(),

  setDisplayName: (name) => {
    const nextName = name.trim();
    set((state) => {
      const next = { ...state.profile, displayName: nextName };
      saveProfileToStorage(next);
      return { profile: next };
    });
  },

  unlockScript: (scriptId) => {
    set((state) => {
      const list = state.profile.unlockedScripts;
      if (list.includes(scriptId)) return state;
      const next = { ...state.profile, unlockedScripts: [...list, scriptId] };
      saveProfileToStorage(next);
      return { profile: next };
    });
  },

  appendEnding: (record) => {
    set((state) => {
      const next = {
        ...state.profile,
        endingHistory: [record, ...state.profile.endingHistory].slice(0, 50),
      };
      saveProfileToStorage(next);
      return { profile: next };
    });
  },

  bumpEncounter: (mbti, patch) => {
    const profile = get().profile;
    const prev = profile.characterCollection?.[mbti] ?? {
      encounterCount: 0,
      soulmateCount: 0,
      endings: [],
      bestAffection: 0,
      bestAlignment: 0,
    };
    const nextEndings = patch?.endingId
      ? Array.from(new Set([...(prev.endings ?? []), patch.endingId]))
      : prev.endings ?? [];
    const next = {
      ...profile,
      characterCollection: {
        ...profile.characterCollection,
        [mbti]: {
          encounterCount: prev.encounterCount + 1,
          soulmateCount: prev.soulmateCount + (patch?.soulmate ? 1 : 0),
          endings: nextEndings,
          bestAffection: Math.max(prev.bestAffection, patch?.affection ?? prev.bestAffection),
          bestAlignment: Math.max(prev.bestAlignment, patch?.alignment ?? prev.bestAlignment),
        },
      },
    };
    saveProfileToStorage(next);
    set({ profile: next });
  },
}));

