export type MatchFormat = 'IPL' | 'TEST';

export const MATCH_FORMATS: Record<MatchFormat, { label: string; maxOvers: number; phases: string[] }> = {
  IPL: {
    label: 'IPL T20',
    maxOvers: 20,
    phases: ['Powerplay', 'Middle overs', 'Death overs'],
  },
  TEST: {
    label: 'Test mode',
    maxOvers: 50,
    phases: ['New ball', 'Settle', 'Final session'],
  },
};

export function ballsFromOver(over: string | number): number {
  const value = String(over);
  const [overs = '0', balls = '0'] = value.split('.');
  return Number(overs) * 6 + Number(balls);
}

export function overProgress(over: string | number, maxOvers: number): number {
  const played = ballsFromOver(over);
  return Math.min(100, Math.round((played / (maxOvers * 6)) * 100));
}

export function ballsRemaining(over: string | number, maxOvers: number): number {
  return Math.max(0, maxOvers * 6 - ballsFromOver(over));
}

export function phaseForOver(over: number, maxOvers: number): string {
  if (maxOvers <= 20) {
    if (over < 6) return 'Powerplay';
    if (over >= 16) return 'Death overs';
    return 'Middle overs';
  }

  if (over < 10) return 'New ball';
  if (over >= maxOvers - 10) return 'Final session';
  return 'Settle';
}
