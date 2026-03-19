import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const AUTO_SCROLL_INTERVAL_MS = 4000;
const PLAYER_STORAGE_KEY = 'storyflow_player';

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
  const [playerHydrated, setPlayerHydrated] = useState(false);
  const [confirming, setConfirming] = useState<Candidate | null>(null);
  const [scrollIndex, setScrollIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollIndexRef = useRef(0);
  scrollIndexRef.current = scrollIndex;

  // 先从 localStorage 恢复角色（与创建页写入的 key 一致），避免 store 未同步时误判无角色
  useEffect(() => {
    if (!usePlayerStore.getState().player) {
      try {
        const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
        if (raw) usePlayerStore.getState().setPlayer(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
    setPlayerHydrated(true);
  }, []);

  useEffect(() => {
    if (!playerHydrated) return;
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
  }, [playerHydrated, player, navigate]);

  const refreshCandidates = useCallback(() => {
    if (!config || !player) return;
    setCandidates(generateCandidates(config, player.gender));
    setConfirming(null);
    setScrollIndex(0);
  }, [config, player]);

  const n = candidates.length;
  const GAP = 16;

  const goToIndex = useCallback(
    (index: number) => {
      const i = Math.max(0, Math.min(index, n - 1));
      setScrollIndex(i);
      const container = scrollContainerRef.current;
      if (!container || !container.children.length) return;
      const firstCard = container.children[0] as HTMLElement;
      const cardWidth = firstCard.offsetWidth;
      const paddingLeft = parseFloat(getComputedStyle(container).paddingLeft) || (container.clientWidth - cardWidth) / 2;
      const targetScrollLeft = paddingLeft + i * (cardWidth + GAP);
      container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
    },
    [n]
  );

  useEffect(() => {
    if (n <= 0) return;
    const timer = setInterval(() => {
      const next = (scrollIndexRef.current + 1) % n;
      goToIndex(next);
    }, AUTO_SCROLL_INTERVAL_MS);
    autoScrollTimerRef.current = timer;
    return () => clearInterval(timer);
  }, [n, goToIndex]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || n <= 0) return;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;
    const firstCard = container.children[0] as HTMLElement | undefined;
    if (!firstCard) return;
    const cardWidth = firstCard.offsetWidth;
    const paddingLeft = parseFloat(getComputedStyle(container).paddingLeft) || (clientWidth - cardWidth) / 2;
    const center = scrollLeft + clientWidth / 2;
    const cardCenter = paddingLeft + cardWidth / 2;
    const index = Math.round((center - cardCenter) / (cardWidth + GAP));
    const clamped = Math.max(0, Math.min(index, n - 1));
    setScrollIndex(clamped);
  }, [n]);

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

  if (!playerHydrated || !player) {
    return (
      <div className="blind-date-page blind-date-loading">
        <div className="blind-date-loading-text">加载中…</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="blind-date-page blind-date-loading">
        <div className="blind-date-loading-text">正在为你匹配候选人…</div>
      </div>
    );
  }

  return (
    <div
      className="blind-date-page min-h-screen w-full min-w-0 lg:min-w-[1280px] flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/background/bg-01.png)' }}
    >
      <div className="blind-date-content flex flex-col flex-1 items-center py-10 px-6">
        <header className="blind-date-header text-center mb-6">
          <h1 className="blind-date-title">选择你的心动对象</h1>
          <p className="blind-date-subtitle">在 5 位候选人中选择一位开始约会</p>
        </header>

        {player && (
          <div className="blind-date-my-info">
            <span className="blind-date-my-name">{player.name}</span>
            <span className="blind-date-my-mbti" style={{ backgroundColor: MBTI_COLORS[player.mbti] }}>
              {player.mbti}
            </span>
            <span className="blind-date-my-desc">{player.description}</span>
          </div>
        )}

        <div className="blind-date-cards-outer">
          <button
            type="button"
            className="blind-date-cards-prev"
            onClick={() => goToIndex(scrollIndex - 1)}
            aria-label="上一个"
          >
            ‹
          </button>
          <div
            ref={scrollContainerRef}
            className="blind-date-cards"
            onScroll={handleScroll}
          >
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
          <button
            type="button"
            className="blind-date-cards-next"
            onClick={() => goToIndex(scrollIndex + 1)}
            aria-label="下一个"
          >
            ›
          </button>
          <div className="blind-date-cards-dots" role="tablist" aria-label="候选人">
            {/* <span className="blind-date-cards-dots-hint" aria-hidden>···</span> */}
            {candidates.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === scrollIndex}
                className={`blind-date-dot ${i === scrollIndex ? 'blind-date-dot-active' : ''}`}
                onClick={() => goToIndex(i)}
                aria-label={`第 ${i + 1} 位`}
              />
            ))}
          </div>
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
