import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// === Proper Type Definitions ===
export interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  onStrike: boolean;
}

export interface Bowler {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  isBowling: boolean;
}

export interface ScoreData {
  teamA: string;
  teamB: string;
  competition?: string;
  matchFormat?: 'IPL' | 'TEST';
  maxOvers?: number;
  phase?: string;
  inningsStatus?: 'live' | 'complete';
  teamAScore: string;
  teamBScore: string;
  currentOver: string;
  runRate: string;
  target: number | null;
  batsmen: Batsman[];
  bowlers: Bowler[];
  recentBalls: string[];
  winProbability: { teamA: number; teamB: number };
}

export interface CommentaryEntry {
  id: string;
  over: string;
  text: string;
  type: 'normal' | 'boundary' | 'wicket' | 'milestone';
  timestamp: number;
}

export interface MomentumPoint {
  over: number;
  teamAMomentum: number;
  teamBMomentum: number;
}

interface MatchState {
  currentMatchId: string | null;
  isConnected: boolean;
  score: ScoreData | null;
  commentary: CommentaryEntry[];
  momentum: MomentumPoint[];
}

const initialState: MatchState = {
  currentMatchId: null,
  isConnected: false,
  score: null,
  commentary: [],
  momentum: [],
};

export const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setMatchData: (state, action: PayloadAction<Partial<MatchState>>) => {
      return { ...state, ...action.payload };
    },
    updateScore: (state, action: PayloadAction<ScoreData>) => {
      state.score = action.payload;
    },
    addCommentary: (state, action: PayloadAction<CommentaryEntry>) => {
      state.commentary.unshift(action.payload);
      // Keep last 50 commentary entries
      if (state.commentary.length > 50) {
        state.commentary = state.commentary.slice(0, 50);
      }
    },
    addMomentumPoint: (state, action: PayloadAction<MomentumPoint>) => {
      state.momentum.push(action.payload);
    },
    resetMatch: () => initialState,
  },
});

export const {
  setConnectionStatus,
  setMatchData,
  updateScore,
  addCommentary,
  addMomentumPoint,
  resetMatch,
} = matchSlice.actions;
export default matchSlice.reducer;
