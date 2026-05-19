import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ScoreData } from './matchSlice';

export type LiveMatch = ScoreData & { matchId: string };

interface ScoreboardState {
  matches: LiveMatch[];
  loading: boolean;
  lastUpdated: number;
}

const initialState: ScoreboardState = {
  matches: [],
  loading: true,
  lastUpdated: 0,
};

export const scoreboardSlice = createSlice({
  name: 'scoreboard',
  initialState,
  reducers: {
    setMatches: (state, action: PayloadAction<LiveMatch[]>) => {
      state.matches = action.payload;
      state.loading = false;
      state.lastUpdated = Date.now();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setMatches, setLoading } = scoreboardSlice.actions;
export default scoreboardSlice.reducer;
