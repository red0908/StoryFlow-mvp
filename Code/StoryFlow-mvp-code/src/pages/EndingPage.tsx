import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Candidate, MBTI } from '../types';
import { useGameStore } from '../stores/useGameStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import './EndingPage.less';

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

function getOpponentAvatar(playerGender: 'male' | 'female', mbti: MBTI): string {
  const avatars = playerGender === 'male' ? MBTI_AVATARS_FEMALE : MBTI_AVATARS_MALE;
  return avatars[mbti];
}

type EndingType = 'success' | 'regret' | 'fail';

interface EndingConfig {
  id: EndingType;
  title: string;
  subtitle: string;
  comment: string;
  filterClass?: string;
}

const ENDINGS: Record<EndingType, EndingConfig> = {
  success: {
    id: 'success',
    title: '灵魂伴侣',
    subtitle: '匹配成功',
    comment: '你们性格相契，彼此理解，和 {opponent.name} 的这次相亲圆满成功。',
    filterClass: 'ending-page-bg-success',
  },
  regret: {
    id: 'regret',
    title: '略有遗憾',
    subtitle: '有好感但未更进一步',
    comment: '你们相处愉快，但和 {opponent.name} 似乎还差一点缘分。',
    filterClass: 'ending-page-bg-regret',
  },
  fail: {
    id: 'fail',
    title: '分道扬镳',
    subtitle: '相亲失败',
    comment: '性格与观念差异较大，与 {opponent.name} 未能走到一起。',
    filterClass: 'ending-page-bg-fail',
  },
};

function getEndingType(affection: number, urlType?: string | null): EndingType {
  if (urlType === 'success' || urlType === 'regret' || urlType === 'fail') {
    return urlType;
  }
  if (affection >= 80) return 'success';
  if (affection >= 50) return 'regret';
  return 'fail';
}

function interpolateComment(
  text: string,
  ctx: { opponent: Candidate | null; player?: { description?: string } | null }
): string {
  if (!ctx.opponent) return text;
  return text
    .replace(/\{opponent\.name\}/g, ctx.opponent.name)
    .replace(/\{opponent\.mbti\}/g, ctx.opponent.mbti)
    .replace(/\{player\.description\}/g, ctx.player?.description ?? '');
}

function EndingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get('type');

  const opponent = useGameStore((s) => s.opponent);
  const affection = useGameStore((s) => s.affection);
  const resetGame = useGameStore((s) => s.resetGame);
  const player = usePlayerStore((s) => s.player);

  const endingType = useMemo(
    () => getEndingType(affection, urlType),
    [affection, urlType]
  );
  const config = ENDINGS[endingType];
  const comment = useMemo(
    () => interpolateComment(config.comment, { opponent, player }),
    [config.comment, opponent, player]
  );

  useEffect(() => {
    if (!opponent) {
      navigate('/blindDate', { replace: true });
    }
  }, [opponent, navigate]);

  const handleRestart = () => {
    resetGame();
    navigate('/', { replace: true });
  };

  if (!opponent) return null;

  return (
    <div
      className={`ending-page min-h-screen min-w-[1280px] flex flex-col bg-cover bg-center bg-no-repeat ${config.filterClass ?? ''}`}
      style={{ backgroundImage: 'url(/background/bg-01.png)' }}
    >
      <div className="ending-page-content flex flex-col flex-1 items-center justify-center">
        <div className="ending-page-card">
          <h1 className="ending-page-title">{config.title}</h1>
          <p className="ending-page-subtitle">{config.subtitle}</p>

          <div className="ending-page-comment-wrap">
            <p className="ending-page-comment">{comment}</p>
          </div>

          {player && (
            <div className="ending-page-avatar-wrap">
              <img
                src={getOpponentAvatar(player.gender, opponent.mbti)}
                alt={opponent.name}
                className="ending-page-avatar"
              />
              <span className="ending-page-opponent-name">{opponent.name}</span>
              <span className="ending-page-mbti">{opponent.mbti}</span>
            </div>
          )}

          <div className="ending-page-affection-wrap">
            <span className="ending-page-affection-label">最终好感度</span>
            <span className="ending-page-affection-value">{affection}</span>
          </div>

          <div className="ending-page-actions">
            <button
              type="button"
              className="ending-page-btn ending-page-btn-primary"
              onClick={handleRestart}
            >
              重新开始
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EndingPage;
