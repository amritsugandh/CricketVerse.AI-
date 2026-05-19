import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import matchReducer from './slices/matchSlice';
import predictionReducer from './slices/predictionSlice';
import scoreboardReducer from './slices/scoreboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    match: matchReducer,
    prediction: predictionReducer,
    scoreboard: scoreboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
