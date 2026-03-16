# 音频资源目录

请将音源设计文档中的音频文件按以下结构放置，文件名需与下表一致。

## 目录结构

```
audio/
├── bgm/          # 背景音乐
├── ambient/      # 环境音效（可循环）
└── sfx/          # UI 与剧情音效
```

## 文件名清单（与代码中 constants 一致）

- **bgm/**：bgm_main_menu.mp3, bgm_coffee.mp3, bgm_park.mp3, bgm_restaurant.mp3, bgm_ending_perfect.mp3, bgm_ending_regret.mp3, bgm_hidden.mp3
- **ambient/**：amb_coffee.mp3, amb_park.mp3, amb_restaurant.mp3
- **sfx/**：ui_click.mp3, ui_affection_up.mp3, ui_affection_down.mp3, ui_alignment.mp3, ui_hidden_unlock.mp3, ui_page_turn.mp3, ui_hover.mp3, ui_option_appear.mp3, sfx_gift.mp3, sfx_bell.mp3

若某文件缺失，控制台会输出 load 警告，不影响其他音频播放。
