import type { Candidate, EndingType, MBTI } from '../types';

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function pickUnique<T>(pool: T[], count: number): T[] {
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.max(0, Math.min(count, a.length)));
}

function scoreLabel(affection: number, alignment: number): string {
  const a = clamp01(affection / 100);
  const b = clamp01(alignment / 100);
  const warmth = a >= 0.8 ? '很高' : a >= 0.6 ? '偏高' : a >= 0.45 ? '一般' : '偏低';
  const fit = b >= 0.75 ? '很强' : b >= 0.6 ? '不错' : b >= 0.45 ? '一般' : '偏弱';
  return `好感度${warmth}，贴合度${fit}`;
}

function mbtiCue(mbti?: MBTI): string {
  if (!mbti) return 'TA';
  switch (mbti) {
    case 'ENFJ':
      return '热情又会照顾氛围的 TA';
    case 'INTJ':
      return '冷静、有边界感的 TA';
    case 'INFJ':
      return '温柔却有原则的 TA';
    case 'ENTJ':
      return '强势但目标明确的 TA';
    default:
      return 'TA';
  }
}

export function generateMockAIComment(
  endingType: EndingType,
  affection: number,
  alignment: number,
  opponent?: Pick<Candidate, 'name' | 'mbti'> | null
): string {
  const name = opponent?.name ?? '对方';
  const cue = mbtiCue(opponent?.mbti);
  const score = scoreLabel(affection, alignment);

  const common = [
    `数据侧画像：${score}（好感 ${Math.round(affection)}/100 · 贴合 ${Math.round(alignment)}/100）。`,
    `你在关系里呈现的核心优势，是“愿意看见对方，也愿意表达自己”。`,
    `建议你把“我需要什么”说得更具体一些，关系会更轻松。`,
    `别急着给这段相遇下结论，把它当作一次自我校准也很有价值。`,
  ];

  const byType: Record<EndingType, string[]> = {
    success: [
      `你和「${name}」的互动节奏自然，情绪互相接住，属于“越走越顺”的组合。`,
      `你们的差异刚好形成互补：你不必过度迎合，${cue} 也愿意为你停下来沟通。`,
      `如果把期待说清楚、把边界说温柔，这段关系很容易从心动走向稳定。`,
      `下一步建议：安排一次更具体的共同计划（旅行/运动/学习），让默契落到生活里。`,
    ],
    surface: [
      `你成功让「${name}」感到被照顾，但这份“顺利”里夹着一些自我消耗。`,
      `关系看起来和谐，真实的你却有点憋着——久了会把热情磨平。`,
      `建议把“我也想被理解”的需求提上日程，别只做气氛担当。`,
      `下一次试着在关键点上更直接：不解释太多，只表达你的偏好与底线。`,
    ],
    friend: [
      `你和「${name}」在价值观层面很合拍，但情感火花还差一点点触发条件。`,
      `这段关系更像“高质量同频”，不一定要勉强变成恋爱。`,
      `如果你想再试一次，可以制造一点更具张力的互动：直球赞美、轻微冒险、共同任务。`,
      `也可能，你真正想要的不是同类，而是能拉你出舒适区的人。`,
    ],
    fail: [
      `你和「${name}」的相处成本偏高，越努力越容易走向误解或疲惫。`,
      `这不是谁对谁错，更像是节奏与需求不匹配：你想要的回应方式，${cue} 给不出来（或反过来）。`,
      `建议你把“不可妥协项”整理成 2～3 条，下次更快识别不适配，节省情绪成本。`,
      `把这次当作一次筛选：你已经更清楚自己想要怎样的关系了。`,
    ],
  };

  const pool = [...byType[endingType], ...common];
  const lineCount = 2 + Math.floor(Math.random() * 3); // 2~4
  const lines = pickUnique(pool, lineCount);

  return lines.join('\n');
}

