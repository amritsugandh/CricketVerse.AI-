import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type PredictionOutcome = 'dot' | 'single' | 'double' | 'triple' | 'four' | 'six' | 'wicket' | 'wide' | 'no-ball';

export interface Prediction {
  id: string;
  outcome: PredictionOutcome;
  xpWagered: number;
  timestamp: number;
  result: 'pending' | 'correct' | 'incorrect';
  actualOutcome?: PredictionOutcome;
}

export interface PredictionStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  totalXpEarned: number;
  totalXpLost: number;
}

export interface OverAnalysis {
  overNumber: number;
  runs: number;
  wickets: number;
  extras: number;
  runRate: number;
  predictedRuns: number;
  actualRuns: number;
  momentumShift: number; // -100 to 100
}

interface PredictionState {
  predictions: Prediction[];
  stats: PredictionStats;
  overAnalysis: OverAnalysis[];
  currentXp: number;
  isLocked: boolean; // When prediction is locked for current ball
  aiSuggestion: PredictionOutcome | null;
  aiConfidence: number; // 0-100
  liveProbabilities: Record<PredictionOutcome, number>;
}

const initialState: PredictionState = {
  predictions: [],
  stats: {
    totalPredictions: 0,
    correctPredictions: 0,
    accuracy: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalXpEarned: 0,
    totalXpLost: 0,
  },
  overAnalysis: [],
  currentXp: 500,
  isLocked: false,
  aiSuggestion: null,
  aiConfidence: 0,
  liveProbabilities: {
    'dot': 35,
    'single': 28,
    'double': 8,
    'triple': 1,
    'four': 14,
    'six': 6,
    'wicket': 4,
    'wide': 2,
    'no-ball': 2,
  },
};

export const predictionSlice = createSlice({
  name: 'prediction',
  initialState,
  reducers: {
    addPrediction: (state, action: PayloadAction<Prediction>) => {
      state.predictions.unshift(action.payload);
      state.stats.totalPredictions += 1;
      state.isLocked = true;
    },
    resolvePrediction: (state, action: PayloadAction<{ id: string; actualOutcome: PredictionOutcome }>) => {
      const pred = state.predictions.find(p => p.id === action.payload.id);
      if (pred) {
        pred.actualOutcome = action.payload.actualOutcome;
        const isCorrect = pred.outcome === action.payload.actualOutcome;
        pred.result = isCorrect ? 'correct' : 'incorrect';

        if (isCorrect) {
          state.stats.correctPredictions += 1;
          state.stats.currentStreak += 1;
          const earned = pred.xpWagered * 2;
          state.stats.totalXpEarned += earned;
          state.currentXp += earned;
          if (state.stats.currentStreak > state.stats.bestStreak) {
            state.stats.bestStreak = state.stats.currentStreak;
          }
        } else {
          state.stats.currentStreak = 0;
          state.stats.totalXpLost += pred.xpWagered;
          state.currentXp -= pred.xpWagered;
        }

        state.stats.accuracy = state.stats.totalPredictions > 0
          ? Math.round((state.stats.correctPredictions / state.stats.totalPredictions) * 100)
          : 0;
      }
      state.isLocked = false;
    },
    updateAiSuggestion: (state, action: PayloadAction<{ outcome: PredictionOutcome; confidence: number }>) => {
      state.aiSuggestion = action.payload.outcome;
      state.aiConfidence = action.payload.confidence;
    },
    updateLiveProbabilities: (state, action: PayloadAction<Record<PredictionOutcome, number>>) => {
      state.liveProbabilities = action.payload;
    },
    addOverAnalysis: (state, action: PayloadAction<OverAnalysis>) => {
      state.overAnalysis.push(action.payload);
    },
    unlockPrediction: (state) => {
      state.isLocked = false;
    },
    resetPredictions: () => initialState,
  },
});

export const {
  addPrediction,
  resolvePrediction,
  updateAiSuggestion,
  updateLiveProbabilities,
  addOverAnalysis,
  unlockPrediction,
  resetPredictions,
} = predictionSlice.actions;
export default predictionSlice.reducer;
