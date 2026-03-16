/**
 * 音频路径与 ID 常量（与 基本音频设计.md / public/audio 目录结构一致）
 */

const AUDIO_BASE = '/audio';

/** BGM 编号与路径 */
export const BGM_IDS = {
  main_menu: 'bgm_main_menu',
  coffee: 'bgm_coffee',
  park: 'bgm_park',
  restaurant: 'bgm_restaurant',
  ending_perfect: 'bgm_ending_perfect',
  ending_regret: 'bgm_ending_regret',
  hidden: 'bgm_hidden',
} as const;

export type BGMId = keyof typeof BGM_IDS;

export const BGM_PATHS: Record<BGMId, string> = {
  main_menu: `${AUDIO_BASE}/bgm/bgm_main_menu.mp3`,
  coffee: `${AUDIO_BASE}/bgm/bgm_coffee.mp3`,
  park: `${AUDIO_BASE}/bgm/bgm_park.mp3`,
  restaurant: `${AUDIO_BASE}/bgm/bgm_restaurant.mp3`,
  ending_perfect: `${AUDIO_BASE}/bgm/bgm_ending_perfect.mp3`,
  ending_regret: `${AUDIO_BASE}/bgm/bgm_ending_regret.mp3`,
  hidden: `${AUDIO_BASE}/bgm/bgm_hidden.mp3`,
};

/** 环境音编号与路径 */
export const AMBIENT_IDS = {
  coffee: 'amb_coffee',
  park: 'amb_park',
  restaurant: 'amb_restaurant',
} as const;

export type AmbientId = keyof typeof AMBIENT_IDS;

export const AMBIENT_PATHS: Record<AmbientId, string> = {
  coffee: `${AUDIO_BASE}/ambient/amb_coffee.mp3`,
  park: `${AUDIO_BASE}/ambient/amb_park.mp3`,
  restaurant: `${AUDIO_BASE}/ambient/amb_restaurant.mp3`,
};

/** UI 音效编号与路径 */
export const SFX_IDS = {
  ui_click: 'ui_click',
  ui_affection_up: 'ui_affection_up',
  ui_affection_down: 'ui_affection_down',
  ui_alignment: 'ui_alignment',
  ui_hidden_unlock: 'ui_hidden_unlock',
  ui_page_turn: 'ui_page_turn',
  ui_hover: 'ui_hover',
  ui_option_appear: 'ui_option_appear',
  sfx_gift: 'sfx_gift',
  sfx_bell: 'sfx_bell',
} as const;

export type SFXId = keyof typeof SFX_IDS;

export const SFX_PATHS: Record<SFXId, string> = {
  ui_click: `${AUDIO_BASE}/sfx/ui_click.mp3`,
  ui_affection_up: `${AUDIO_BASE}/sfx/ui_affection_up.mp3`,
  ui_affection_down: `${AUDIO_BASE}/sfx/ui_affection_down.mp3`,
  ui_alignment: `${AUDIO_BASE}/sfx/ui_alignment.mp3`,
  ui_hidden_unlock: `${AUDIO_BASE}/sfx/ui_hidden_unlock.mp3`,
  ui_page_turn: `${AUDIO_BASE}/sfx/ui_page_turn.mp3`,
  ui_hover: `${AUDIO_BASE}/sfx/ui_hover.mp3`,
  ui_option_appear: `${AUDIO_BASE}/sfx/ui_option_appear.mp3`,
  sfx_gift: `${AUDIO_BASE}/sfx/sfx_gift.mp3`,
  sfx_bell: `${AUDIO_BASE}/sfx/sfx_bell.mp3`,
};

/** 章节 1–3 对应的 BGM 与环境音（第四章进入结局页后由结局页播放结局 BGM） */
export const CHAPTER_BGM: Record<number, BGMId> = {
  1: 'coffee',
  2: 'park',
  3: 'restaurant',
};

export const CHAPTER_AMBIENT: Record<number, AmbientId> = {
  1: 'coffee',
  2: 'park',
  3: 'restaurant',
};
