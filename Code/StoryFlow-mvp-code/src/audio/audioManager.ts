import { Howl, Howler } from 'howler';
import {
  BGMId,
  BGM_PATHS,
  AmbientId,
  AMBIENT_PATHS,
  SFXId,
  SFX_PATHS,
  CHAPTER_BGM,
  CHAPTER_AMBIENT,
} from './constants';

const FADE_DURATION_MS = 800;
const DEFAULT_BGM_VOLUME = 0.5;
const DEFAULT_AMBIENT_VOLUME = 0.25;
const DEFAULT_SFX_VOLUME = 0.6;

const AUDIO_SETTINGS_KEY = 'storyflow_audio_settings';

export type VolumeType = 'bgm' | 'ambient' | 'sfx';

export interface AudioSettings {
  bgmVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  muted: boolean;
}

interface AudioManagerState {
  bgmVolume: number;
  ambientVolume: number;
  sfxVolume: number;
  muted: boolean;
}

function loadAudioSettingsFromStorage(): AudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) return getDefaultAudioSettings();
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    if (!parsed || typeof parsed !== 'object') return getDefaultAudioSettings();
    return {
      ...getDefaultAudioSettings(),
      bgmVolume: clamp(Number(parsed.bgmVolume), 0, 1),
      sfxVolume: clamp(Number(parsed.sfxVolume), 0, 1),
      ambientVolume: clamp(Number(parsed.ambientVolume), 0, 1),
      muted: Boolean(parsed.muted),
    };
  } catch {
    return getDefaultAudioSettings();
  }
}

function getDefaultAudioSettings(): AudioSettings {
  return {
    bgmVolume: DEFAULT_BGM_VOLUME,
    sfxVolume: DEFAULT_SFX_VOLUME,
    ambientVolume: DEFAULT_AMBIENT_VOLUME,
    muted: false,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));
}

class AudioManager {
  private bgmMap: Map<BGMId, Howl> = new Map();
  private ambientMap: Map<AmbientId, Howl> = new Map();
  private sfxMap: Map<SFXId, Howl> = new Map();
  private currentBGM: BGMId | null = null;
  private currentAmbient: AmbientId | null = null;
  private state: AudioManagerState;
  private preloadStarted = false;

  constructor() {
    const saved = loadAudioSettingsFromStorage();
    this.state = {
      bgmVolume: saved.bgmVolume,
      ambientVolume: saved.ambientVolume,
      sfxVolume: saved.sfxVolume,
      muted: saved.muted,
    };
    Howler.mute(this.state.muted);
  }

  /** 从 localStorage 读取并应用已保存的音量/静音设置 */
  applySavedSettings(): void {
    const saved = loadAudioSettingsFromStorage();
    this.state.bgmVolume = saved.bgmVolume;
    this.state.ambientVolume = saved.ambientVolume;
    this.state.sfxVolume = saved.sfxVolume;
    this.state.muted = saved.muted;
    Howler.mute(saved.muted);
    if (this.currentBGM) this.bgmMap.get(this.currentBGM)?.volume(saved.bgmVolume);
    if (this.currentAmbient) this.ambientMap.get(this.currentAmbient)?.volume(saved.ambientVolume);
  }

  /** 供设置页读取当前音量与静音状态 */
  getSettings(): AudioSettings {
    return {
      bgmVolume: this.state.bgmVolume,
      sfxVolume: this.state.sfxVolume,
      ambientVolume: this.state.ambientVolume,
      muted: this.state.muted,
    };
  }

  /** 预加载所有音频（进入主菜单后调用，静默加载不阻塞） */
  preload(): void {
    if (this.preloadStarted) return;
    this.preloadStarted = true;
    this.applySavedSettings();

    (Object.keys(BGM_PATHS) as BGMId[]).forEach((id) => {
      if (this.bgmMap.has(id)) return;
      const howl = new Howl({
        src: [BGM_PATHS[id]],
        loop: id !== 'hidden',
        volume: this.state.bgmVolume,
        html5: false,
        onloaderror: () => {
          console.warn('[Audio] BGM load failed:', id);
        },
      });
      this.bgmMap.set(id, howl);
    });

    (Object.keys(AMBIENT_PATHS) as AmbientId[]).forEach((id) => {
      if (this.ambientMap.has(id)) return;
      const howl = new Howl({
        src: [AMBIENT_PATHS[id]],
        loop: true,
        volume: this.state.ambientVolume,
        html5: false,
        onloaderror: () => {
          console.warn('[Audio] Ambient load failed:', id);
        },
      });
      this.ambientMap.set(id, howl);
    });

    (Object.keys(SFX_PATHS) as SFXId[]).forEach((id) => {
      if (this.sfxMap.has(id)) return;
      const howl = new Howl({
        src: [SFX_PATHS[id]],
        loop: false,
        volume: this.state.sfxVolume,
        html5: true,
        onloaderror: () => {
          console.warn('[Audio] SFX load failed:', id);
        },
      });
      this.sfxMap.set(id, howl);
    });
  }

  /** 播放背景音乐，可选淡入；若已在播同一首则不变 */
  playBGM(id: BGMId, fadeIn = true): void {
    if (this.state.muted) return;
    let howl = this.bgmMap.get(id);
    if (!howl) {
      this.preload();
      howl = this.bgmMap.get(id) ?? null;
    }
    if (!howl) {
      // 预加载异步，首次播放时可能尚未就绪，创建单实例并播放
      const fallback = new Howl({
        src: [BGM_PATHS[id]],
        loop: id !== 'hidden',
        volume: fadeIn ? 0 : this.state.bgmVolume,
        onload: () => {
          fallback.volume(this.state.bgmVolume);
          if (fadeIn) fallback.fade(0, this.state.bgmVolume, FADE_DURATION_MS / 1000);
          fallback.play();
        },
      });
      this.bgmMap.set(id, fallback);
      this.stopBGM(false);
      this.currentBGM = id;
      fallback.play();
      if (fadeIn) fallback.fade(0, this.state.bgmVolume, FADE_DURATION_MS / 1000);
      return;
    }

    if (this.currentBGM === id) {
      if (!howl.playing()) howl.play();
      return;
    }

    this.stopBGM(false);
    howl.volume(fadeIn ? 0 : this.state.bgmVolume);
    howl.play();
    if (fadeIn) howl.fade(0, this.state.bgmVolume, FADE_DURATION_MS / 1000);
    this.currentBGM = id;
  }

  /** 停止当前 BGM，可选淡出 */
  stopBGM(fadeOut = true): void {
    if (this.currentBGM === null) return;
    const howl = this.bgmMap.get(this.currentBGM);
    if (howl) {
      if (fadeOut) {
        howl.fade(howl.volume(), 0, FADE_DURATION_MS / 1000);
        setTimeout(() => {
          howl.stop();
        }, FADE_DURATION_MS);
      } else {
        howl.stop();
      }
    }
    this.currentBGM = null;
  }

  /** 播放环境音（循环），与 BGM 同时存在 */
  playAmbient(id: AmbientId, fadeIn = true): void {
    if (this.state.muted) return;
    let howl = this.ambientMap.get(id);
    if (!howl) {
      this.preload();
      howl = this.ambientMap.get(id) ?? null;
    }
    if (!howl) return;
    if (this.currentAmbient === id) {
      if (!howl.playing()) {
        howl.volume(fadeIn ? 0 : this.state.ambientVolume);
        howl.play();
        if (fadeIn) howl.fade(0, this.state.ambientVolume, FADE_DURATION_MS / 1000);
      }
      return;
    }
    this.stopAmbient(false);
    howl.volume(fadeIn ? 0 : this.state.ambientVolume);
    howl.play();
    if (fadeIn) howl.fade(0, this.state.ambientVolume, FADE_DURATION_MS / 1000);
    this.currentAmbient = id;
  }

  /** 停止当前环境音 */
  stopAmbient(fadeOut = true): void {
    if (this.currentAmbient === null) return;
    const howl = this.ambientMap.get(this.currentAmbient);
    if (howl) {
      if (fadeOut) {
        howl.fade(howl.volume(), 0, FADE_DURATION_MS / 1000);
        setTimeout(() => howl.stop(), FADE_DURATION_MS);
      } else {
        howl.stop();
      }
    }
    this.currentAmbient = null;
  }

  /** 播放 UI/剧情音效（一次） */
  playSFX(id: SFXId): void {
    if (this.state.muted) return;
    let howl = this.sfxMap.get(id);
    if (!howl) {
      this.preload();
      howl = this.sfxMap.get(id) ?? null;
    }
    if (howl) {
      howl.volume(this.state.sfxVolume);
      howl.play();
    }
  }

  /** 设置音量（0–1），type 为 bgm | ambient | sfx，并持久化 */
  setVolume(volume: number, type: VolumeType): void {
    const v = Math.max(0, Math.min(1, volume));
    switch (type) {
      case 'bgm':
        this.state.bgmVolume = v;
        if (this.currentBGM) {
          this.bgmMap.get(this.currentBGM)?.volume(v);
        }
        break;
      case 'ambient':
        this.state.ambientVolume = v;
        if (this.currentAmbient) {
          this.ambientMap.get(this.currentAmbient)?.volume(v);
        }
        break;
      case 'sfx':
        this.state.sfxVolume = v;
        break;
    }
    this.saveAudioSettings();
  }

  /** 静音/取消静音，并持久化 */
  setMuted(muted: boolean): void {
    this.state.muted = muted;
    Howler.mute(muted);
    this.saveAudioSettings();
  }

  isMuted(): boolean {
    return this.state.muted;
  }

  private saveAudioSettings(): void {
    try {
      localStorage.setItem(
        AUDIO_SETTINGS_KEY,
        JSON.stringify({
          bgmVolume: this.state.bgmVolume,
          sfxVolume: this.state.sfxVolume,
          ambientVolume: this.state.ambientVolume,
          muted: this.state.muted,
        })
      );
    } catch {
      // ignore
    }
  }

  /** 停止所有 BGM 与环境音（如返回主菜单时） */
  stopAll(): void {
    this.stopBGM(false);
    this.stopAmbient(false);
  }

  /** 按章节切换剧情内 BGM + 环境音（chapter 1–3）；4 由结局页处理 */
  playForChapter(chapter: number): void {
    const bgmId = CHAPTER_BGM[chapter];
    const ambientId = CHAPTER_AMBIENT[chapter];
    if (bgmId) this.playBGM(bgmId, true);
    if (ambientId) this.playAmbient(ambientId, true);
    if (chapter === 4) {
      this.stopBGM(true);
      this.stopAmbient(true);
    }
  }
}

export const audioManager = new AudioManager();
