import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Candidate, MBTI, EndingType as GlobalEndingType } from '../../types';
import { useGameStore } from '../../stores/useGameStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { useScriptStore } from '../../stores/useScriptStore';
import { audioManager } from '../../audio';
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

type EndingType = GlobalEndingType;

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
  surface: {
    id: 'surface',
    title: '表面和谐',
    subtitle: '对方满意，你却有点累',
    comment: '你努力照顾对方感受，但和 {opponent.name} 的关系里，你似乎牺牲了不少自己。',
    filterClass: 'ending-page-bg-surface',
  },
  friend: {
    id: 'friend',
    title: '知己难求',
    subtitle: '三观合拍，却差一点心动',
    comment: '你和 {opponent.name} 很聊得来，像是难得的知己，只是缘分停在了朋友的位置。',
    filterClass: 'ending-page-bg-friend',
  },
  fail: {
    id: 'fail',
    title: '分道扬镳',
    subtitle: '相亲失败',
    comment: '性格与观念差异较大，与 {opponent.name} 未能走到一起。',
    filterClass: 'ending-page-bg-fail',
  },
};

function getEndingType(affection: number, alignment: number, urlType?: string | null): EndingType {
  if (urlType === 'success' || urlType === 'surface' || urlType === 'friend' || urlType === 'fail') {
    return urlType;
  }
  // 结局判定规则（需求文档 2.6）
  if (affection >= 80 && alignment >= 70) return 'success';
  if (affection >= 80 && alignment < 50) return 'surface';
  if (affection < 60 && alignment >= 70) return 'friend';
  if (affection < 50 && alignment < 50) return 'fail';
  // 其余组合按权重就近归类
  if (affection >= 70 && alignment >= 60) return 'success';
  if (affection >= 60 && alignment < 60) return 'surface';
  if (alignment >= 60) return 'friend';
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
  const alignment = useGameStore((s) => s.alignment);
  const resetGame = useGameStore((s) => s.resetGame);
  const player = usePlayerStore((s) => s.player);
  const currentScriptId = useScriptStore((s) => s.currentScriptId);
  const appendEnding = useProfileStore((s) => s.appendEnding);
  const bumpEncounter = useProfileStore((s) => s.bumpEncounter);

  const wroteHistoryRef = useRef(false);

  const endingType = useMemo(
    () => getEndingType(affection, alignment, urlType),
    [affection, alignment, urlType]
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

  // 结局页 BGM：完美/表面和谐 → 温暖；知己/分道 → 遗憾
  useEffect(() => {
    audioManager.stopAll();
    if (endingType === 'success' || endingType === 'surface') {
      audioManager.playBGM('ending_perfect', true);
    } else {
      audioManager.playBGM('ending_regret', true);
    }
  }, [endingType]);

  // 写入玩家档案：历史记录 + 图鉴统计（MVP 最小可用）
  useEffect(() => {
    if (!opponent || !player) return;
    if (wroteHistoryRef.current) return;
    wroteHistoryRef.current = true;

    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    appendEnding({
      date,
      scriptId: currentScriptId ?? 'unknown',
      opponentMbti: opponent.mbti,
      endingType,
      affection,
      alignment,
      aiComment: '（AI 评价占位：后续接入/增强）',
    });

    bumpEncounter(opponent.mbti, {
      soulmate: endingType === 'success',
      endingId: endingType,
      affection,
      alignment,
    });
  }, [appendEnding, bumpEncounter, opponent, player, currentScriptId, endingType, affection, alignment]);

  const handleRestart = () => {
    resetGame();
    navigate('/scripts', { replace: true });
  };

  if (!opponent) return null;

  return (
    <div
      className={`ending-page min-h-screen w-full min-w-0 lg:min-w-[1280px] flex flex-col bg-cover bg-center bg-no-repeat ${config.filterClass ?? ''}`}
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
              onClick={() => {
                audioManager.playSFX('ui_click');
                handleRestart();
              }}
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
