import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '../../stores/useProfileStore';
import { audioManager } from '../../audio';
import './ProfilePage.less';

const NAME_MAX = 12;

function ProfilePage() {
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.profile);
  const setDisplayName = useProfileStore((s) => s.setDisplayName);

  const [draft, setDraft] = useState(profile.displayName);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [audioSettings, setAudioSettings] = useState(() => audioManager.getSettings());

  // 进入页面或档案中的昵称变化时，同步到输入框
  useEffect(() => {
    setDraft(profile.displayName);
  }, [profile.displayName]);

  const error = useMemo(() => {
    if (!draft.trim()) return '昵称不能为空';
    if (draft.trim().length > NAME_MAX) return `昵称不超过 ${NAME_MAX} 字`;
    return '';
  }, [draft]);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (error) return;
    const name = draft.trim();
    if (!name) return;
    audioManager.playSFX('ui_click');
    setDisplayName(name);
    setSaveSuccess(true);
  };

  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(false), 2200);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  return (
    <div
      className="profile-page min-h-screen min-w-[1280px] flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/background/bg-01.png)' }}
    >
      <div className="profile-page-content flex flex-col flex-1 items-center py-10 px-6">
        <header className="profile-page-header text-center mb-6">
          <h1 className="profile-page-title">玩家档案</h1>
          <p className="profile-page-subtitle">设置你的昵称，它会在所有剧本中通用显示</p>
        </header>

        <main className="profile-page-card">
          <label className="profile-page-label">昵称</label>
          <input
            className="profile-page-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, NAME_MAX))}
            placeholder="例如：阿远、七七、程一"
            maxLength={NAME_MAX}
          />
          {error ? <div className="profile-page-error">{error}</div> : <div className="profile-page-hint">建议 2～8 字，方便在剧情中展示</div>}
          {saveSuccess && <div className="profile-page-success">已保存，昵称将在所有剧本中生效</div>}

          <div className="profile-page-stats">
            <div className="profile-page-stat">
              <span className="profile-page-stat-label">魅力等级</span>
              <span className="profile-page-stat-value">{profile.charmLevel}</span>
            </div>
            <div className="profile-page-stat">
              <span className="profile-page-stat-label">历史结局</span>
              <span className="profile-page-stat-value">{profile.endingHistory.length}</span>
            </div>
            <div className="profile-page-stat">
              <span className="profile-page-stat-label">已解锁剧本</span>
              <span className="profile-page-stat-value">{profile.unlockedScripts.length}</span>
            </div>
          </div>

          <section className="profile-page-audio">
            <h2 className="profile-page-audio-title">音效设置</h2>
            <div className="profile-page-audio-mute">
              <input
                type="checkbox"
                id="profile-audio-mute"
                checked={audioSettings.muted}
                onChange={(e) => {
                  const muted = e.target.checked;
                  setAudioSettings((s) => ({ ...s, muted }));
                  audioManager.setMuted(muted);
                }}
                className="profile-page-audio-checkbox"
              />
              <label htmlFor="profile-audio-mute" className="profile-page-audio-mute-label">
                静音
              </label>
            </div>
            <div className="profile-page-audio-sliders">
              <div className="profile-page-audio-row">
                <span className="profile-page-audio-label">背景音乐</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(audioSettings.bgmVolume * 100)}
                  onChange={(e) => {
                    const v = Number(e.target.value) / 100;
                    setAudioSettings((s) => ({ ...s, bgmVolume: v }));
                    audioManager.setVolume(v, 'bgm');
                  }}
                  disabled={audioSettings.muted}
                  className="profile-page-audio-slider"
                />
                <span className="profile-page-audio-value">{Math.round(audioSettings.bgmVolume * 100)}%</span>
              </div>
              <div className="profile-page-audio-row">
                <span className="profile-page-audio-label">环境音</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(audioSettings.ambientVolume * 100)}
                  onChange={(e) => {
                    const v = Number(e.target.value) / 100;
                    setAudioSettings((s) => ({ ...s, ambientVolume: v }));
                    audioManager.setVolume(v, 'ambient');
                  }}
                  disabled={audioSettings.muted}
                  className="profile-page-audio-slider"
                />
                <span className="profile-page-audio-value">{Math.round(audioSettings.ambientVolume * 100)}%</span>
              </div>
              <div className="profile-page-audio-row">
                <span className="profile-page-audio-label">音效</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(audioSettings.sfxVolume * 100)}
                  onChange={(e) => {
                    const v = Number(e.target.value) / 100;
                    setAudioSettings((s) => ({ ...s, sfxVolume: v }));
                    audioManager.setVolume(v, 'sfx');
                  }}
                  disabled={audioSettings.muted}
                  className="profile-page-audio-slider"
                />
                <span className="profile-page-audio-value">{Math.round(audioSettings.sfxVolume * 100)}%</span>
              </div>
            </div>
          </section>

          <div className="profile-page-actions">
            <button
              type="button"
              className="profile-page-btn profile-page-btn-secondary"
              onClick={() => {
                audioManager.playSFX('ui_click');
                navigate('/');
              }}
            >
              返回首页
            </button>
            <button
              type="button"
              className="profile-page-btn profile-page-btn-secondary"
              onClick={() => {
                audioManager.playSFX('ui_click');
                navigate('/map');
              }}
            >
              查看心域地图
            </button>
            <button type="button" className="profile-page-btn profile-page-btn-primary" onClick={handleSave} disabled={!!error} aria-disabled={!!error}>
              保存昵称
            </button>
          </div>
        </main>

        <footer className="profile-page-footer">
          <button
            type="button"
            className="profile-page-link"
            onClick={() => {
              audioManager.playSFX('ui_click');
              navigate('/scripts');
            }}
          >
            去剧本大厅开始游戏 →
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ProfilePage;

