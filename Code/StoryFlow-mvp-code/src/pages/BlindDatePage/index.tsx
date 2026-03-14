import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Candidate, MBTI } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useGameStore } from '../../stores/useGameStore';
import {
  generateCandidates,
  getJobLabel,
  type GameConfigFull,
} from '../../utils/generateCandidates';
import './BlindDate.less';

const MBTI_AVATARS_MALE: Record<MBTI, string> = {
  ENFJ: '/person_img/avatar_male_enfj.png',
  INTJ: '/person_img/avatar_male_intj.png',
  INFJ: '/person_img/avatar_male_infj.png',
  ENTJ: '/person_img/avatar_male_entj.png',
};

const MBTI_AVATARS_FEMALE: Record<MBTI, string> = {
  ENFJ: '/person_img/avatar_female_enfj.png',
  INTJ: '/person_img/avatar_female_intj.png',
  INFJ: '/person_img/avatar_female_infj.png',
  ENTJ: '/person_img/avatar_female_entj.png',
};

const MBTI_COLORS: Record<MBTI, string> = {
  ENFJ: '#FF9F7C',
  INTJ: '#7C6A9F',
  INFJ: '#6B8E7C',
  ENTJ: '#B84A62',
};

function getCandidateAvatar(playerGender: 'male' | 'female', mbti: MBTI): string {
  const avatars = playerGender === 'male' ? MBTI_AVATARS_FEMALE : MBTI_AVATARS_MALE;
  return avatars[mbti];
}

function BlindDatePage() {
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const startGame = useGameStore((s) => s.startGame);

  const [config, setConfig] = useState<GameConfigFull | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<Candidate | null>(null);

  useEffect(() => {
    if (!player) {
      navigate('/create/myRole', { replace: true });
      return;
    }
    fetch('/data/gameConfig.json')
      .then((res) => res.json())
      .then((data: GameConfigFull) => {
        setConfig(data);
        setCandidates(generateCandidates(data, player.gender));
      })
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [player, navigate]);

  const refreshCandidates = useCallback(() => {
    if (!config || !player) return;
    setCandidates(generateCandidates(config, player.gender));
    setConfirming(null);
  }, [config, player]);

  const confirmSelect = useCallback(
    (c: Candidate) => {
      if (!c) return;
      startGame(c);
      navigate('/game?chapter=1', { replace: true });
    },
    [startGame, navigate]
  );

  const handleRandomMatch = useCallback(() => {
    if (candidates.length === 0) return;
    const random = candidates[Math.floor(Math.random() * candidates.length)];
    confirmSelect(random);
  }, [candidates, confirmSelect]);

  if (!player) return null;

  if (loading) {
    return (
      <div className="blind-date-page blind-date-loading">
        <div className="blind-date-loading-text">正在为你匹配候选人…</div>
      </div>
    );
  }

  return (
    <div
      className="blind-date-page min-h-screen min-w-[1280px] flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/background/bg-01.png)' }}
    >
      <div className="blind-date-content flex flex-col flex-1 items-center py-10 px-6">
        <header className="blind-date-header text-center mb-6">
          <h1 className="blind-date-title">选择你的心动对象</h1>
          <p className="blind-date-subtitle">在 5 位候选人中选择一位开始约会</p>
        </header>

        {player && (
          <div className="blind-date-my-info">
            <span className="blind-date-my-mbti" style={{ backgroundColor: MBTI_COLORS[player.mbti] }}>
              {player.mbti}
            </span>
            <span className="blind-date-my-desc">{player.description}</span>
          </div>
        )}

        <div className="blind-date-cards">
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              className="blind-date-card"
              onClick={() => setConfirming(c)}
            >
              <div
                className="blind-date-card-bg"
                style={{ backgroundImage: 'url(/background/card.png)' }}
              />
              <div className="blind-date-card-inner">
                <div className="blind-date-card-avatar-wrap">
                  <img
                    src={getCandidateAvatar(player.gender, c.mbti)}
                    alt={c.name}
                    className="blind-date-card-avatar"
                  />
                </div>
                <div className="blind-date-card-info">
                  <div className="blind-date-card-name">{c.name}</div>
                  <div className="blind-date-card-meta">
                    {c.age} 岁 · {config ? getJobLabel(config, c.job) : c.job}
                  </div>
                  <span
                    className="blind-date-card-mbti"
                    style={{ backgroundColor: MBTI_COLORS[c.mbti] }}
                  >
                    {c.mbti}
                  </span>
                  <p className="blind-date-card-tagline">{c.tagline}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <footer className="blind-date-footer">
          <button
            type="button"
            className="blind-date-btn blind-date-btn-secondary"
            onClick={() => navigate('/create/myRole')}
          >
            返回修改角色
          </button>
          <button
            type="button"
            className="blind-date-btn blind-date-btn-secondary"
            onClick={refreshCandidates}
          >
            换一批
          </button>
          <button
            type="button"
            className="blind-date-btn blind-date-btn-primary"
            onClick={handleRandomMatch}
          >
            随机匹配
          </button>
        </footer>
      </div>

      {confirming && (
        <div className="blind-date-modal-overlay" onClick={() => setConfirming(null)}>
          <div className="blind-date-modal" onClick={(e) => e.stopPropagation()}>
            <p className="blind-date-modal-text">
              确定选择 <strong>{confirming.name}</strong> 开始约会吗？
            </p>
            <div className="blind-date-modal-actions">
              <button
                type="button"
                className="blind-date-btn blind-date-btn-secondary"
                onClick={() => setConfirming(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="blind-date-btn blind-date-btn-primary"
                onClick={() => confirmSelect(confirming)}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlindDatePage;
