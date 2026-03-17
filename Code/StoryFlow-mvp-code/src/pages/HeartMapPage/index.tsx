import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MBTI } from '../../types';
import { useProfileStore } from '../../stores/useProfileStore';
import { audioManager } from '../../audio';
import './HeartMapPage.less';

const MBTI_COLORS: Record<MBTI, string> = {
  ENFJ: '#FF9F7C',
  INTJ: '#7C6A9F',
  INFJ: '#6B8E7C',
  ENTJ: '#B84A62',
};

const ALL_BADGES = [
  { id: 'first_ending', name: '初次心动', desc: '完成任意一个结局' },
  { id: 'soulmate_once', name: '灵魂伴侣', desc: '达成一次「灵魂伴侣」结局' },
  { id: 'explorer', name: '探索者', desc: '触发任意隐藏节点（后续开放）' },
  { id: 'collector', name: '收集控', desc: '解锁全部基础结局（后续开放）' },
];

function HeartMapPage() {
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.profile);

  const mbtiList = useMemo<MBTI[]>(() => ['ENFJ', 'INTJ', 'INFJ', 'ENTJ'], []);

  return (
    <div
      className="heart-map-page min-h-screen w-full min-w-0 lg:min-w-[1280px] flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/background/bg-01.png)' }}
    >
      <div className="heart-map-page-content flex flex-col flex-1 items-center py-10 px-6">
        <header className="heart-map-header text-center mb-6">
          <h1 className="heart-map-title">心域地图</h1>
          <p className="heart-map-subtitle">你的攻略足迹、勋章收集与 AI 评价历史（MVP 占位版）</p>
        </header>

        <main className="heart-map-main w-full max-w-6xl">
          <section className="heart-map-section">
            <div className="heart-map-section-title">MBTI 角色图鉴</div>
            <div className="heart-map-grid">
              {mbtiList.map((mbti) => {
                const rec = profile.characterCollection?.[mbti];
                const encounterCount = rec?.encounterCount ?? 0;
                const soulmateCount = rec?.soulmateCount ?? 0;
                const endings = rec?.endings?.length ?? 0;
                return (
                  <div key={mbti} className="heart-map-card">
                    <div className="heart-map-card-head">
                      <span className="heart-map-mbti" style={{ backgroundColor: `${MBTI_COLORS[mbti]}CC` }}>
                        {mbti}
                      </span>
                      <span className="heart-map-card-status">{encounterCount > 0 ? '已相遇' : '未相遇'}</span>
                    </div>
                    <div className="heart-map-card-body">
                      <div className="heart-map-kv">
                        <span className="heart-map-k">相遇次数</span>
                        <span className="heart-map-v">{encounterCount}</span>
                      </div>
                      <div className="heart-map-kv">
                        <span className="heart-map-k">灵魂伴侣</span>
                        <span className="heart-map-v">{soulmateCount}</span>
                      </div>
                      <div className="heart-map-kv">
                        <span className="heart-map-k">解锁结局</span>
                        <span className="heart-map-v">{endings}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="heart-map-section">
            <div className="heart-map-section-title">勋章墙</div>
            <div className="heart-map-badges">
              {ALL_BADGES.map((b) => {
                const unlocked = profile.badges.includes(b.id);
                return (
                  <div key={b.id} className={`heart-map-badge ${unlocked ? 'heart-map-badge-unlocked' : ''}`}>
                    <div className="heart-map-badge-name">{b.name}</div>
                    <div className="heart-map-badge-desc">{b.desc}</div>
                    <div className="heart-map-badge-state">{unlocked ? '已获得' : '未解锁'}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="heart-map-section">
            <div className="heart-map-section-title">AI 历史评价记录</div>
            {profile.endingHistory.length === 0 ? (
              <div className="heart-map-empty">暂时还没有任何结局记录，去完成一次故事吧。</div>
            ) : (
              <div className="heart-map-history">
                {profile.endingHistory.slice(0, 20).map((h, idx) => (
                  <div key={`${h.date}-${idx}`} className="heart-map-history-item">
                    <div className="heart-map-history-head">
                      <span className="heart-map-history-date">{h.date}</span>
                      <span className="heart-map-history-meta">
                        剧本 {h.scriptId} · 对方 {h.opponentMbti} · 结局 {h.endingType}
                      </span>
                    </div>
                    <div className="heart-map-history-body">
                      <div className="heart-map-history-kv">
                        <span>好感度 {h.affection}</span>
                        <span>贴合度 {h.alignment}</span>
                      </div>
                      <div className="heart-map-history-comment">{h.aiComment || '（AI 评价占位：后续接入/增强）'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <footer className="heart-map-footer">
          <button
            type="button"
            className="heart-map-btn heart-map-btn-secondary"
            onClick={() => {
              audioManager.playSFX('ui_click');
              navigate('/');
            }}
          >
            返回首页
          </button>
          <button
            type="button"
            className="heart-map-btn heart-map-btn-secondary"
            onClick={() => {
              audioManager.playSFX('ui_click');
              navigate('/profile');
            }}
          >
            返回档案
          </button>
          <button
            type="button"
            className="heart-map-btn heart-map-btn-secondary"
            onClick={() => {
              audioManager.playSFX('ui_click');
              navigate('/scripts');
            }}
          >
            去剧本大厅
          </button>
        </footer>
      </div>
    </div>
  );
}

export default HeartMapPage;

