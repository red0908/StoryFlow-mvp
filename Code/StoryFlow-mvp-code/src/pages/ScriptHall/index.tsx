import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MBTI } from '../../types';
import { useScriptStore, type ScriptSummary } from '../../stores/useScriptStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { audioManager } from '../../audio';
import { fetchJsonWithTimeout } from '../../utils/fetchJson';
import './ScriptHall.less';

/** 从 index.json 拉取的剧本项，解锁状态由 profile.unlockedScripts 控制 */
type ScriptItemFromApi = ScriptSummary;

const MBTI_COLORS: Record<MBTI, string> = {
  ENFJ: '#FF9F7C',
  INTJ: '#7C6A9F',
  INFJ: '#6B8E7C',
  ENTJ: '#B84A62',
};

function ScriptHall() {
  const navigate = useNavigate();
  const setCurrentScript = useScriptStore((s) => s.setCurrentScript);
  const profile = useProfileStore((s) => s.profile);
  const displayName = profile.displayName;
  const unlockedScripts = profile.unlockedScripts;

  const [scripts, setScripts] = useState<ScriptItemFromApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJsonWithTimeout<ScriptItemFromApi[]>('/data/scripts/index.json')
      .then((data) => {
        setScripts(Array.isArray(data) ? data : []);
      })
      .catch(() => setScripts([]))
      .finally(() => setLoading(false));
  }, []);

  // 剧本大厅与主菜单共用主菜单 BGM（从结局返回时切回）
  useEffect(() => {
    audioManager.preload();
    audioManager.playBGM('main_menu', true);
  }, []);

  const handleSelectScript = useCallback(
    (item: ScriptItemFromApi) => {
      if (!unlockedScripts.includes(item.id)) return;
      audioManager.playSFX('ui_click');
      setCurrentScript({
        id: item.id,
        title: item.title,
        description: item.description,
        recommendedMbti: item.recommendedMbti,
        cover: item.cover,
      });
      navigate('/create/myRole');
    },
    [navigate, setCurrentScript, unlockedScripts]
  );

  if (loading) {
    return (
      <div className="script-hall-page script-hall-loading">
        <div className="script-hall-loading-text">加载剧本中…</div>
      </div>
    );
  }

  return (
    <div
      className="script-hall-page min-h-screen w-full min-w-0 lg:min-w-[1280px] flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/background/bg-01.png)' }}
    >
      <div className="script-hall-content flex flex-col flex-1 items-center py-10 px-6">
        <header className="script-hall-header text-center mb-6">
          <h1 className="script-hall-title">剧本大厅</h1>
          <p className="script-hall-subtitle">选择一个剧本，开始一段全新的心动旅程</p>
          <div className="script-hall-top-actions">
            <button
              type="button"
              className="script-hall-top-btn"
              onClick={() => {
                audioManager.playSFX('ui_click');
                navigate('/profile');
              }}
            >
              {displayName ? `玩家：${displayName}` : '设置昵称'}
            </button>
            <button
              type="button"
              className="script-hall-top-btn"
              onClick={() => {
                audioManager.playSFX('ui_click');
                navigate('/map');
              }}
            >
              心域地图
            </button>
          </div>
        </header>

        <main className="script-hall-main">
          {scripts.length === 0 ? (
            <p className="script-hall-empty">暂时没有可用的剧本，请稍后再试。</p>
          ) : (
            <div className="script-hall-grid">
              {scripts.map((script) => {
                const unlocked = unlockedScripts.includes(script.id);
                return (
                  <button
                    key={script.id}
                    type="button"
                    className={`script-hall-card ${unlocked ? '' : 'script-hall-card-locked'}`}
                    onClick={() => handleSelectScript(script)}
                    disabled={!unlocked}
                  >
                    <div
                      className="script-hall-card-bg"
                      style={{
                        backgroundImage: script.cover
                          ? `url(${script.cover})`
                          : 'url(/background/card.png)',
                      }}
                    />
                    <div className="script-hall-card-inner">
                      <div className="script-hall-card-header">
                        <h2 className="script-hall-card-title">{script.title}</h2>
                        {!unlocked && <span className="script-hall-badge-lock">待解锁</span>}
                      </div>
                      <p className="script-hall-card-desc">{script.description}</p>
                      <div className="script-hall-card-footer">
                        <span className="script-hall-tag-label">推荐人格</span>
                        <div className="script-hall-mbti-tags">
                          {script.recommendedMbti.map((m) => (
                            <span
                              key={m}
                              className="script-hall-mbti-tag"
                              style={{ backgroundColor: `${MBTI_COLORS[m]}CC` }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>

        <footer className="script-hall-footer">
          <button
            type="button"
            className="script-hall-btn script-hall-btn-secondary"
            onClick={() => navigate('/')}
          >
            返回首页
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ScriptHall;

