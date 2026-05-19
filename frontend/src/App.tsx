import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

const Home = lazy(() => import('./pages/Home'));
const LiveMatch = lazy(() => import('./pages/LiveMatch'));
const PredictAnalyzer = lazy(() => import('./pages/PredictAnalyzer'));
const Leaderboards = lazy(() => import('./pages/Leaderboards'));
const Rewards = lazy(() => import('./pages/Rewards'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
        <span className="text-xs text-slate-500 font-mono">Loading...</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="match/:matchId" element={<LiveMatch />} />
            <Route path="predict" element={<PredictAnalyzer />} />
            <Route path="leaderboards" element={<Leaderboards />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
