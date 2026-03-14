import type { Candidate, MBTI } from '../types';

export interface GameConfigFull {
  names: { male: string[]; female: string[] };
  jobs: { id: string; label: string }[];
  mbti: { id: MBTI; label: string; tagline: string }[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickNames(pool: string[], count: number): string[] {
  if (pool.length === 0) return Array(count).fill('神秘嘉宾');
  if (pool.length >= count) return shuffle(pool).slice(0, count);
  const result: string[] = [];
  for (let i = 0; i < count; i++) result.push(pool[i % pool.length]);
  return shuffle(result);
}

const AGE_MIN = 25;
const AGE_MAX = 35;

/**
 * 根据玩家性别与 gameConfig 随机生成 5 位异性候选人
 */
export function generateCandidates(
  config: GameConfigFull,
  playerGender: 'male' | 'female'
): Candidate[] {
  const namePool = playerGender === 'male' ? config.names.female : config.names.male;
  const names = pickNames(namePool, 5);
  const jobs = config.jobs;
  const mbtiList = config.mbti;

  return names.map((name, index) => {
    const age = AGE_MIN + Math.floor(Math.random() * (AGE_MAX - AGE_MIN + 1));
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const mbtiItem = mbtiList[Math.floor(Math.random() * mbtiList.length)];
    const tagline = `${name}，${age}岁，${job.label}，${mbtiItem.tagline}`;
    return {
      id: `c${index + 1}_${Date.now()}`,
      name,
      age,
      job: job.id,
      mbti: mbtiItem.id,
      tagline,
    };
  });
}

export function getJobLabel(config: GameConfigFull, jobId: string): string {
  return config.jobs.find((j) => j.id === jobId)?.label ?? jobId;
}
