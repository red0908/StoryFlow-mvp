import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Player, MBTI } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useScriptStore } from '../../stores/useScriptStore';
import { useProfileStore } from '../../stores/useProfileStore';
import './CreateRole.less';

const PLAYER_STORAGE_KEY = 'storyflow_player';
const AGE_MIN = 25;
const AGE_MAX = 35;
const DESC_MAX_LEN = 50;

interface GameConfigJob {
  id: string;
  label: string;
}
interface GameConfigMbti {
  id: MBTI;
  label: string;
  tagline: string;
}
interface GameConfig {
  jobs: GameConfigJob[];
  mbti: GameConfigMbti[];
}

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

function getMbtiAvatar(gender: Player['gender'] | null, mbti: MBTI): string | null {
  if (gender === null) return null;
  return gender === 'male' ? MBTI_AVATARS_MALE[mbti] : MBTI_AVATARS_FEMALE[mbti];
}

const MBTI_COLORS: Record<MBTI, string> = {
  ENFJ: '#FF9F7C',
  INTJ: '#7C6A9F',
  INFJ: '#6B8E7C',
  ENTJ: '#B84A62',
};

function CreateRole() {
  const navigate = useNavigate();
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const currentScript = useScriptStore((s) => s.currentScript);
  const displayName = useProfileStore((s) => s.profile.displayName);

  const [config, setConfig] = useState<GameConfig | null>(null);
  const [gender, setGender] = useState<Player['gender'] | null>(null);
  const [age, setAge] = useState<number>(28);
  const [job, setJob] = useState<string>('');
  const [mbti, setMbti] = useState<MBTI | null>(null);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/data/gameConfig.json')
      .then((res) => res.json())
      .then((data: GameConfig) => setConfig(data))
      .catch(() => setConfig({ jobs: [], mbti: [] }));
  }, []);

  // 没有设置昵称时，先引导去玩家档案页
  useEffect(() => {
    if (!displayName.trim()) {
      navigate('/profile', { replace: true });
    }
  }, [displayName, navigate]);

  const jobIds = config?.jobs.map((j) => j.id) ?? [];
  const mbtiIds = config?.mbti.map((m) => m.id) ?? [];

  const generateDescription = useCallback(() => {
    if (!config) return;
    const jobLabel = config.jobs.find((j) => j.id === job)?.label ?? '';
    const mbtiItem = config.mbti.find((m) => m.id === mbti);
    const tagline = mbtiItem?.tagline ?? '';
    if (jobLabel || tagline) {
      setDescription(`${jobLabel}，${tagline}。`);
    }
  }, [config, job, mbti]);

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (gender === null) next.gender = '请选择性别';
    if (age < AGE_MIN || age > AGE_MAX) next.age = `年龄需在 ${AGE_MIN}～${AGE_MAX} 之间`;
    if (!job || !jobIds.includes(job)) next.job = '请选择职业';
    if (!mbti || !mbtiIds.includes(mbti)) next.mbti = '请选择 MBTI';
    if (!description.trim()) next.description = '请填写一句话介绍';
    else if (description.length > DESC_MAX_LEN) next.description = `介绍不超过 ${DESC_MAX_LEN} 字`;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [gender, age, job, mbti, description, jobIds, mbtiIds]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!displayName.trim()) {
        navigate('/profile', { replace: true });
        return;
      }
      if (!validate() || gender === null || mbti === null) return;
      const player: Player = {
        name: displayName.trim(),
        gender,
        age,
        job,
        mbti,
        description: description.trim(),
      };
      setPlayer(player);
      try {
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
      } catch (_) {}
      navigate('/blindDate');
    },
    [displayName, validate, gender, age, job, mbti, description, setPlayer, navigate]
  );

  const handleRandom = useCallback(() => {
    if (!config) return;
    setGender(Math.random() > 0.5 ? 'male' : 'female');
    setAge(AGE_MIN + Math.floor(Math.random() * (AGE_MAX - AGE_MIN + 1)));
    setJob(config.jobs[Math.floor(Math.random() * config.jobs.length)].id);
    setMbti(config.mbti[Math.floor(Math.random() * config.mbti.length)].id);
    setErrors({});
  }, [config]);

  if (!config) {
    return (
      <div className="create-role-page create-role-loading">
        <div className="create-role-loading-text">加载中…</div>
      </div>
    );
  }

  return (
    <div
      className="create-role-page min-h-screen w-full min-w-0 lg:min-w-[1280px] flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/background/bg-01.png)' }}
    >
      <div className="create-role-content flex flex-col flex-1 items-center justify-center py-10 px-6">
        <header className="create-role-header text-center mb-6">
          <button
            type="button"
            className="create-role-back-home"
            onClick={() => navigate('/')}
            aria-label="返回首页"
          >
            返回首页
          </button>
          <h1 className="create-role-title">创建我的角色</h1>
          <p className="create-role-subtitle">
            {currentScript
              ? `当前剧本：${currentScript.title}，先认识一下自己，再踏入故事。`
              : '认识一下自己，开始心动之旅'}
          </p>
          {displayName.trim() && (
            <p className="create-role-subtitle">本局将以「{displayName.trim()}」的昵称进入剧情</p>
          )}
        </header>

        <form onSubmit={handleSubmit} className="create-role-form">
          {/* 性别 */}
          <section className="create-role-section">
            <label className="create-role-label">性别</label>
            <div className="create-role-gender">
              <button
                type="button"
                className={`create-role-gender-btn ${gender === 'male' ? 'create-role-gender-btn-active' : ''}`}
                onClick={() => setGender('male')}
              >
                男
              </button>
              <button
                type="button"
                className={`create-role-gender-btn ${gender === 'female' ? 'create-role-gender-btn-active' : ''}`}
                onClick={() => setGender('female')}
              >
                女
              </button>
            </div>
            {errors.gender && <span className="create-role-error">{errors.gender}</span>}
          </section>

          {/* 年龄 */}
          <section className="create-role-section">
            <label className="create-role-label">
              年龄 <span className="create-role-age-value">{age} 岁</span>
            </label>
            <input
              type="range"
              min={AGE_MIN}
              max={AGE_MAX}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="create-role-slider"
            />
            {errors.age && <span className="create-role-error">{errors.age}</span>}
          </section>

          {/* 职业 */}
          <section className="create-role-section">
            <label className="create-role-label">职业</label>
            <div className="create-role-job-grid">
              {config.jobs.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  className={`create-role-job-btn ${job === j.id ? 'create-role-job-btn-active' : ''}`}
                  onClick={() => setJob(j.id)}
                >
                  {j.label}
                </button>
              ))}
            </div>
            {errors.job && <span className="create-role-error">{errors.job}</span>}
          </section>

          {/* MBTI */}
          <section className="create-role-section">
            <label className="create-role-label">MBTI 人格</label>
            <div className="create-role-mbti-grid">
              {config.mbti.map((m) => {
                const avatarSrc = getMbtiAvatar(gender, m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`create-role-mbti-card ${mbti === m.id ? 'create-role-mbti-card-active' : ''}`}
                    onClick={() => setMbti(m.id)}
                    style={
                      mbti === m.id
                        ? { borderColor: MBTI_COLORS[m.id], boxShadow: `0 0 0 2px ${MBTI_COLORS[m.id]}40` }
                        : undefined
                    }
                  >
                    <div
                      className="create-role-mbti-card-inner"
                      style={{ backgroundColor: `${MBTI_COLORS[m.id]}20` }}
                    >
                      {avatarSrc ? (
                        <img src={avatarSrc} alt={m.label} className="create-role-mbti-avatar" />
                      ) : (
                        <span className="create-role-mbti-placeholder">请先选择性别</span>
                      )}
                    </div>
                    <span className="create-role-mbti-label">{m.label}</span>
                    <span className="create-role-mbti-tagline">{m.tagline}</span>
                  </button>
                );
              })}
            </div>
            {errors.mbti && <span className="create-role-error">{errors.mbti}</span>}
          </section>

          {/* 一句话介绍 */}
          <section className="create-role-section">
            <label className="create-role-label">
              一句话介绍 <span className="create-role-desc-count">{description.length}/{DESC_MAX_LEN}</span>
            </label>
            <div className="create-role-desc-row">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX_LEN))}
                placeholder="例如：理性派工程师，喜欢安静思考"
                className="create-role-input"
                maxLength={DESC_MAX_LEN}
              />
              <button type="button" className="create-role-gen-btn" onClick={generateDescription}>
                根据职业+MBTI 生成
              </button>
            </div>
            {errors.description && <span className="create-role-error">{errors.description}</span>}
          </section>

          {/* 底部按钮 */}
          <footer className="create-role-footer">
            <button type="button" className="create-role-btn create-role-btn-secondary" onClick={handleRandom}>
              随机填充
            </button>
            <button type="submit" className="create-role-btn create-role-btn-primary">
              确认创建
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default CreateRole;
