import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type {
  Script,
  StoryNode,
  StoryOption,
  Condition,
  Effect,
  Candidate,
  MBTI,
  Player,
} from '../../types';
import { useGameStore } from '../../stores/useGameStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useScriptStore } from '../../stores/useScriptStore';
import { audioManager } from '../../audio';
import './GamePage.less';

const CHAPTER_TITLES: Record<number, string> = {
  1: '第一章·开头',
  2: '第二章·发展',
  3: '第三章·高潮',
  4: '第四章·结局',
};

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

function getOpponentAvatar(playerGender: 'male' | 'female', mbti: MBTI): string {
  const avatars = playerGender === 'male' ? MBTI_AVATARS_FEMALE : MBTI_AVATARS_MALE;
  return avatars[mbti];
}

/** 我的角色头像（按性别 + MBTI） */
function getPlayerAvatar(gender: 'male' | 'female', mbti: MBTI): string {
  const avatars = gender === 'male' ? MBTI_AVATARS_MALE : MBTI_AVATARS_FEMALE;
  return avatars[mbti];
}

/** 文本插值：将 {opponent.name}、{opponent.mbti}、{player.name} 等替换为实际值 */
function interpolateText(
  text: string,
  ctx: {
    opponent: Candidate | null;
    player?: { name?: string; description?: string; job?: string } | null;
  }
): string {
  if (!ctx.opponent) return text;
  return text
    .replace(/\{opponent\.name\}/g, ctx.opponent.name)
    .replace(/\{opponent\.mbti\}/g, ctx.opponent.mbti)
    .replace(/\{player\.name\}/g, ctx.player?.name ?? '')
    .replace(/\{player\.description\}/g, ctx.player?.description ?? '');
}

/** 判断单个条件是否通过 */
function evaluateSingleCondition(
  condition: Condition,
  ctx: {
    affection: number;
    alignment: number;
    player: ReturnType<typeof usePlayerStore>['player'];
    flags: Record<string, unknown>;
  }
): boolean {
  switch (condition.type) {
    case 'affection': {
      const { operator, value } = condition;
      switch (operator) {
        case '<=':
          return ctx.affection <= value;
        case '>=':
          return ctx.affection >= value;
        case '<':
          return ctx.affection < value;
        case '>':
          return ctx.affection > value;
        case '===':
          return ctx.affection === value;
        default:
          return true;
      }
    }
    case 'alignment': {
      const { operator, value } = condition;
      switch (operator) {
        case '<=':
          return ctx.alignment <= value;
        case '>=':
          return ctx.alignment >= value;
        case '<':
          return ctx.alignment < value;
        case '>':
          return ctx.alignment > value;
        case '===':
          return ctx.alignment === value;
        default:
          return true;
      }
    }
    case 'playerMbti':
      return ctx.player?.mbti === condition.value;
    case 'playerJob':
      return ctx.player?.job === condition.value;
    case 'flag':
      return ctx.flags[condition.key] === condition.value;
    default:
      return true;
  }
}

/** 过滤出满足条件的选项 */
function filterOptions(
  options: StoryOption[],
  ctx: {
    affection: number;
    alignment: number;
    player: ReturnType<typeof usePlayerStore>['player'];
    flags: Record<string, unknown>;
  }
): StoryOption[] {
  return options.filter((opt) => {
    if (!opt.condition) return true;
    const cond = opt.condition;
    if (Array.isArray(cond)) {
      return cond.every((c) => evaluateSingleCondition(c, ctx));
    }
    return evaluateSingleCondition(cond, ctx);
  });
}

/** 计算选项效果带来的好感度/贴合度变化量（用于播放对应 UI 音效） */
function computeEffectDeltas(
  effects: Effect[],
  ctx: {
    opponentMbti: MBTI;
    playerMbti: MBTI | undefined;
    playerJob: string | undefined;
  }
): { affectionDelta: number; alignmentDelta: number } {
  let affectionDelta = 0;
  let alignmentDelta = 0;
  effects.forEach((eff) => {
    if (eff.type === 'affection') {
      if (eff.value != null) {
        affectionDelta += eff.value;
      } else if (eff.valueByMbti && ctx.opponentMbti in eff.valueByMbti) {
        affectionDelta += eff.valueByMbti[ctx.opponentMbti] ?? 0;
      }
      return;
    }
    if (eff.type === 'alignment') {
      if (eff.value != null) {
        alignmentDelta += eff.value;
      } else if (eff.valueByPlayerMbti && ctx.playerMbti && ctx.playerMbti in eff.valueByPlayerMbti) {
        alignmentDelta += eff.valueByPlayerMbti[ctx.playerMbti] ?? 0;
      }
      return;
    }
    if (eff.type === 'jobEffect' && ctx.playerJob === eff.job) {
      if (typeof eff.affection === 'number') affectionDelta += eff.affection;
      if (typeof eff.alignment === 'number') alignmentDelta += eff.alignment;
    }
  });
  return { affectionDelta, alignmentDelta };
}

/** 执行选项效果（好感度 / 贴合度 / 职业加成 / flag） */
function applyEffects(
  effects: Effect[],
  ctx: {
    opponentMbti: MBTI;
    playerMbti: MBTI | undefined;
    playerJob: string | undefined;
    addAffection: (delta: number) => void;
    addAlignment: (delta: number) => void;
    setFlag: (key: string, value: unknown) => void;
  }
): void {
  effects.forEach((eff) => {
    if (eff.type === 'affection') {
      if (eff.value != null) {
        ctx.addAffection(eff.value);
      } else if (eff.valueByMbti && ctx.opponentMbti in eff.valueByMbti) {
        const delta = eff.valueByMbti[ctx.opponentMbti] ?? 0;
        ctx.addAffection(delta);
      }
      return;
    }

    if (eff.type === 'alignment') {
      if (eff.value != null) {
        ctx.addAlignment(eff.value);
        return;
      }
      if (eff.valueByPlayerMbti && ctx.playerMbti && ctx.playerMbti in eff.valueByPlayerMbti) {
        const delta = eff.valueByPlayerMbti[ctx.playerMbti] ?? 0;
        ctx.addAlignment(delta);
      }
      return;
    }

    if (eff.type === 'setFlag') {
      ctx.setFlag(eff.key, eff.value);
      return;
    }

    if (eff.type === 'jobEffect') {
      if (ctx.playerJob && ctx.playerJob === eff.job) {
        if (typeof eff.affection === 'number') {
          ctx.addAffection(eff.affection);
        }
        if (typeof eff.alignment === 'number') {
          ctx.addAlignment(eff.alignment);
        }
      }
    }
  });
}

function GamePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const currentScriptId = useScriptStore((s) => s.currentScriptId);
  const {
    opponent,
    currentChapter,
    currentNodeId,
    affection,
    alignment,
    flags,
    setCurrentNode,
    addAffection,
    addAlignment,
    setFlag,
  } = useGameStore();

  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [placeholderMessage, setPlaceholderMessage] = useState<string | null>(null);

  const chapterFromUrl = Math.min(4, Math.max(1, Number(searchParams.get('chapter')) || 1));

  // 从 localStorage 恢复玩家角色（避免 HMR/异常导致 store 空但已创建过角色）
  useEffect(() => {
    if (usePlayerStore.getState().player) return;
    try {
      const raw = localStorage.getItem('storyflow_player');
      if (raw) {
        usePlayerStore.getState().setPlayer(JSON.parse(raw) as Player);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // 加载剧本：必须依赖 currentScriptId，否则修订篇等会错误沿用首次挂载时的路径
  useEffect(() => {
    let scriptPath = '/data/story.json';
    if (currentScriptId && currentScriptId !== 'modern_love' && currentScriptId !== 'modern_love_2') {
      scriptPath = `/data/scripts/${currentScriptId}.json`;
    }
    setLoading(true);
    setNodes([]);
    let cancelled = false;
    fetch(scriptPath)
      .then((res) => {
        if (!res.ok) throw new Error(`剧本加载失败 ${res.status}`);
        return res.json();
      })
      .then((data: Script | StoryNode[]) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setNodes(data);
        } else if (data && Array.isArray((data as Script).nodes)) {
          setNodes((data as Script).nodes);
        } else {
          setNodes([]);
        }
      })
      .catch(() => {
        if (!cancelled) setNodes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentScriptId]);

  // 无对手时重定向；同步 URL 章节；空节点时设为本章第一个节点
  useEffect(() => {
    if (!opponent) {
      navigate('/blindDate', { replace: true });
      return;
    }
    if (loading) return;

    setSearchParams({ chapter: String(chapterFromUrl) }, { replace: true });

    if (!currentNodeId && nodes.length > 0) {
      const firstInChapter = nodes.find((n) => n.chapter === chapterFromUrl);
      if (firstInChapter) {
        setCurrentNode(firstInChapter.id, firstInChapter.chapter);
      }
    }
  }, [opponent, loading, nodes, chapterFromUrl, currentNodeId, setCurrentNode, navigate, setSearchParams]);

  // 剧情页 BGM + 环境音：按当前章节切换（1 咖啡厅、2 公园、3 餐厅）
  useEffect(() => {
    if (!opponent || loading) return;
    const chapter = currentChapter || chapterFromUrl;
    if (chapter >= 1 && chapter <= 3) {
      audioManager.playForChapter(chapter);
    }
    return () => {
      // 离开游戏页时由目标页接管 BGM，这里不强制 stop
    };
  }, [opponent, loading, currentChapter, chapterFromUrl]);

  const currentNode = nodes.find((n) => n.id === currentNodeId);
  const visibleOptions = currentNode
    ? filterOptions(currentNode.options ?? [], {
        affection,
        alignment,
        player,
        flags,
      })
    : [];

  const handleOptionClick = useCallback(
    (opt: StoryOption) => {
      if (!opponent || !currentNode) return;
      setPlaceholderMessage(null);

      // UI 音效：按钮点击
      audioManager.playSFX('ui_click');
      const effects = opt.effects ?? [];
      const { affectionDelta, alignmentDelta } = computeEffectDeltas(effects, {
        opponentMbti: opponent.mbti,
        playerMbti: player?.mbti,
        playerJob: player?.job,
      });
      if (affectionDelta > 0) audioManager.playSFX('ui_affection_up');
      else if (affectionDelta < 0) audioManager.playSFX('ui_affection_down');
      if (alignmentDelta !== 0) audioManager.playSFX('ui_alignment');

      // 先根据效果更新好感度 / 贴合度 / flag
      applyEffects(effects, {
        opponentMbti: opponent.mbti,
        playerMbti: player?.mbti,
        playerJob: player?.job,
        addAffection,
        addAlignment,
        setFlag,
      });

      const next = nodes.find((n) => n.id === opt.nextNode);
      if (next) {
        if (next.chapter !== currentChapter) audioManager.playSFX('ui_page_turn');
        setCurrentNode(next.id, next.chapter);
        setSearchParams({ chapter: String(next.chapter) }, { replace: true });
      } else {
        // 无下一节点时直接进入结局页
        navigate('/ending', { replace: true });
      }
    },
    [opponent, currentNode, nodes, currentChapter, player?.job, addAffection, addAlignment, setFlag, setCurrentNode, setSearchParams, navigate]
  );

  if (!opponent) return null;
  if (loading) {
    return (
      <div className="game-page game-page-loading">
        <div className="game-page-loading-text">加载剧情中…</div>
      </div>
    );
  }

  return (
    <div
      className="game-page min-h-screen w-full min-w-0 lg:min-w-[1280px] flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/background/bg-01.png)' }}
    >
      <div className="game-page-content flex flex-col flex-1">
        {/* 顶部状态栏 */}
        <header className="game-page-header">
          <div className="game-page-chapter">
            {CHAPTER_TITLES[currentChapter] ?? `第${currentChapter}章`}
          </div>
          <div className="game-page-status">
            {player && (
              <>
                <div className="game-page-player-wrap">
                  <img
                    src={getPlayerAvatar(player.gender, player.mbti)}
                    alt="我的角色"
                    className="game-page-player-avatar"
                  />
                  <span className="game-page-player-label">我</span>
                  <span
                    className="game-page-mbti game-page-mbti-player"
                    style={{ backgroundColor: MBTI_COLORS[player.mbti] }}
                  >
                    {player.mbti}
                  </span>
                </div>
                <span className="game-page-heart" aria-hidden>♥</span>
              </>
            )}
            <div className="game-page-opponent-wrap">
              <img
                src={player ? getOpponentAvatar(player.gender, opponent.mbti) : ''}
                alt={opponent.name}
                className="game-page-opponent-avatar"
              />
              <span className="game-page-opponent-name">{opponent.name}</span>
              <span
                className="game-page-mbti game-page-mbti-opponent"
                style={{ backgroundColor: MBTI_COLORS[opponent.mbti] }}
              >
                {opponent.mbti}
              </span>
            </div>
            <div className="game-page-affection">
              <span className="game-page-affection-label">好感度</span>
              <div className="game-page-affection-bar-wrap">
                <div
                  className="game-page-affection-bar"
                  style={{ width: `${affection}%` }}
                />
              </div>
              <span className="game-page-affection-value">{affection}</span>
            </div>
            <div className="game-page-affection">
              <span className="game-page-affection-label">贴合度</span>
              <div className="game-page-affection-bar-wrap">
                <div
                  className="game-page-affection-bar game-page-alignment-bar"
                  style={{ width: `${alignment}%` }}
                />
              </div>
              <span className="game-page-affection-value">{alignment}</span>
            </div>
          </div>
        </header>

        {/* 中部剧情框 + 选项区（紧贴剧情框下方） */}
        <main className="game-page-main">
          <div className="game-page-story-card">
            <div className="game-page-story-body">
              <p className="game-page-story-text">
                {currentNode
                  ? interpolateText(currentNode.text, { opponent, player })
                  : '暂无剧情'}
              </p>
            </div>
            {player && (
              <div className="game-page-story-figure">
                <img
                  src={getOpponentAvatar(player.gender, opponent.mbti)}
                  alt={opponent.name}
                  className="game-page-story-avatar"
                />
              </div>
            )}
          </div>
          <section className="game-page-options-wrap">
            {visibleOptions.length > 0 ? (
              <div className="game-page-options">
                {visibleOptions.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className="game-page-option-btn"
                    onClick={() => handleOptionClick(opt)}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            ) : (
              <p className="game-page-no-options">暂无可选选项</p>
            )}
            {placeholderMessage && (
              <p className="game-page-placeholder-msg">{placeholderMessage}</p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default GamePage;
