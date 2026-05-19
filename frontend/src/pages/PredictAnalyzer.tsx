import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Brain, TrendingUp, Zap, Trophy, Flame, 
  BarChart3, CheckCircle, XCircle, Clock,
  Sparkles, Activity
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  addPrediction,
  resolvePrediction,
  updateAiSuggestion,
  updateLiveProbabilities,
  addOverAnalysis,
  type PredictionOutcome,
} from '../store/slices/predictionSlice';
import { ballsFromOver } from '../lib/cricket';

// ── Outcome config ──
const OUTCOMES: { id: PredictionOutcome; label: string; emoji: string; color: string; bgColor: string }[] = [
  { id: 'dot',    label: 'Dot Ball',  emoji: '⚪', color: 'text-gray-400',   bgColor: 'bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/20' },
  { id: 'single', label: 'Single',    emoji: '1️⃣',  color: 'text-blue-400',   bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20' },
  { id: 'double', label: 'Double',    emoji: '2️⃣',  color: 'text-cyan-400',   bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20' },
  { id: 'four',   label: 'Boundary',  emoji: '4️⃣',  color: 'text-emerald-400',bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20' },
  { id: 'six',    label: 'Six!',      emoji: '6️⃣',  color: 'text-purple-400', bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20' },
  { id: 'wicket', label: 'Wicket',    emoji: '🔴', color: 'text-red-400',    bgColor: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20' },
];

const XP_OPTIONS = [5, 10, 25, 50];

// ── Simulated match progression data ──
const SIMULATED_BALLS: PredictionOutcome[] = [
  'single', 'dot', 'four', 'single', 'dot', 'six',
  'single', 'wicket', 'dot', 'four', 'single', 'single',
  'six', 'dot', 'dot', 'single', 'four', 'dot',
  'single', 'six', 'wicket', 'dot', 'single', 'four',
];

// ── Helper: generate simulated AI probabilities ──
function generateProbabilities(phase: number): Record<PredictionOutcome, number> {
  // Varies based on match phase
  const isPowerplay = phase < 6;
  const isDeath = phase > 15;
  return {
    'dot':    isPowerplay ? 30 : isDeath ? 20 : 35,
    'single': isPowerplay ? 25 : isDeath ? 22 : 28,
    'double': 5 + Math.round(Math.random() * 5),
    'triple': 1,
    'four':   isPowerplay ? 18 : isDeath ? 16 : 14,
    'six':    isPowerplay ? 8 : isDeath ? 18 : 6,
    'wicket': isPowerplay ? 6 : isDeath ? 8 : 5,
    'wide':   3,
    'no-ball': 2,
  };
}

// ── Probability bar component ──
function ProbabilityBar({ label, value, color, max }: { label: string; value: number; color: string; max: number }) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs text-white/50 w-14 text-right shrink-0">{label}</span>
      <div className="flex-1 bg-white/[0.04] rounded-full h-2 overflow-hidden">
        <motion.div 
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="text-xs font-medium text-white/60 w-8 tabular-nums">{value}%</span>
    </div>
  );
}

export default function PredictAnalyzer() {
  const dispatch = useDispatch();
  const { predictions, stats, currentXp, isLocked, aiSuggestion, aiConfidence, liveProbabilities } = useSelector((state: RootState) => state.prediction);
  const liveScore = useSelector((state: RootState) => state.match.score);
  
  const [selectedOutcome, setSelectedOutcome] = useState<PredictionOutcome | null>(null);
  const [xpWager, setXpWager] = useState(10);
  const [ballIndex, setBallIndex] = useState(0);
  const [showResult, setShowResult] = useState<{ correct: boolean; outcome: PredictionOutcome } | null>(null);
  const fallbackOver = '12.4';
  const maxOvers = liveScore?.maxOvers ?? 20;
  const inningsComplete = liveScore?.inningsStatus === 'complete';
  const streamBalls = liveScore ? ballsFromOver(liveScore.currentOver) : ballsFromOver(fallbackOver) + ballIndex;
  const cappedBalls = Math.min(streamBalls, maxOvers * 6);
  const completedOvers = Math.floor(cappedBalls / 6);
  const ballInOver = cappedBalls % 6;
  const currentOverDisplay = liveScore?.currentOver ?? `${completedOvers}.${ballInOver}`;
  const nextBallLabel = inningsComplete
    ? 'Innings complete'
    : `Ball ${ballInOver + 1} of Over ${completedOvers + 1}`;
  const matchInfo = {
    teamA: liveScore?.teamA ?? 'CSK',
    teamB: liveScore?.teamB ?? 'SRH',
    teamAScore: liveScore?.teamAScore ?? '142/3',
    overDisplay: currentOverDisplay,
  };

  // Simulate AI suggestion changes
  useEffect(() => {
    const probs = generateProbabilities(completedOvers);
    dispatch(updateLiveProbabilities(probs));
    
    // Find highest probability outcome
    const entries = Object.entries(probs) as [PredictionOutcome, number][];
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    dispatch(updateAiSuggestion({ 
      outcome: sorted[0][0], 
      confidence: sorted[0][1] + Math.round(Math.random() * 15) 
    }));
  }, [ballIndex, completedOvers, dispatch]);

  // Handle prediction submission
  const submitPrediction = useCallback(() => {
    if (!selectedOutcome || isLocked || inningsComplete) return;

    const predId = `pred-${Date.now()}`;
    dispatch(addPrediction({
      id: predId,
      outcome: selectedOutcome,
      xpWagered: xpWager,
      timestamp: Date.now(),
      result: 'pending',
    }));

    // Simulate ball result after a delay
    setTimeout(() => {
      const actual = SIMULATED_BALLS[ballIndex % SIMULATED_BALLS.length];
      dispatch(resolvePrediction({ id: predId, actualOutcome: actual }));
      setShowResult({ correct: selectedOutcome === actual, outcome: actual });
      setBallIndex(prev => prev + 1);
      setSelectedOutcome(null);

      // Update over count
      const nextStreamBalls = liveScore ? cappedBalls : cappedBalls + 1;
      if (nextStreamBalls > 0 && nextStreamBalls % 6 === 0) {
        dispatch(addOverAnalysis({
          overNumber: Math.floor(nextStreamBalls / 6),
          runs: Math.round(Math.random() * 15 + 3),
          wickets: Math.random() > 0.7 ? 1 : 0,
          extras: Math.random() > 0.8 ? 1 : 0,
          runRate: 7.2 + Math.random() * 4,
          predictedRuns: 8,
          actualRuns: Math.round(Math.random() * 15 + 3),
          momentumShift: Math.round(Math.random() * 40 - 20),
        }));
      }

      // Clear result flash after 2s
      setTimeout(() => setShowResult(null), 2500);
    }, 1500);
  }, [selectedOutcome, isLocked, inningsComplete, xpWager, ballIndex, liveScore, cappedBalls, dispatch]);

  const maxProb = Math.max(...Object.values(liveProbabilities));

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 flex-1 flex flex-col gap-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            Live Predict Analyzer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered ball-by-ball prediction engine</p>
        </div>
        
        {/* Match & XP bar */}
        <div className="flex items-center gap-4">
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="text-xs text-white/50">Match</div>
            <div className="text-sm font-bold">{matchInfo.teamA} vs {matchInfo.teamB}</div>
            <div className="w-px h-5 bg-white/10" />
            <div className="text-sm font-mono text-emerald-400">{matchInfo.teamAScore}</div>
            <span className="text-xs text-white/40">({matchInfo.overDisplay} ov)</span>
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="font-bold text-sm tabular-nums">{currentXp} XP</span>
          </div>
        </div>
      </div>

      {/* Result Flash */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`glass-panel p-4 rounded-2xl flex items-center gap-4 border-l-4 ${
              showResult.correct 
                ? 'border-l-emerald-500 bg-emerald-500/5' 
                : 'border-l-red-500 bg-red-500/5'
            }`}
          >
            {showResult.correct ? (
              <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-6 w-6 text-red-400 shrink-0" />
            )}
            <div>
              <p className="text-sm font-bold">
                {showResult.correct ? '✅ Correct Prediction!' : '❌ Incorrect Prediction'}
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                Actual outcome: <span className="font-medium text-white/70">{showResult.outcome}</span>
                {showResult.correct ? ` — You earned ${xpWager * 2} XP!` : ` — You lost ${xpWager} XP`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        
        {/* Left Column: Prediction Panel */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Prediction Card */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/[0.04] rounded-full blur-3xl" />
            
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                Next Ball Prediction
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-white/40" />
                <span className="text-white/40">{nextBallLabel}</span>
              </div>
            </div>

            {/* Outcome Selection */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
              {OUTCOMES.map((outcome) => (
                <motion.button
                  key={outcome.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => !isLocked && !inningsComplete && setSelectedOutcome(outcome.id)}
                  disabled={isLocked || inningsComplete}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
                    selectedOutcome === outcome.id
                      ? `${outcome.bgColor} border-current ring-1 ring-current ${outcome.color} scale-105`
                      : `bg-white/[0.03] border-white/[0.06] hover:border-white/15 ${isLocked || inningsComplete ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`
                  }`}
                >
                  <span className="text-xl">{outcome.emoji}</span>
                  <span className="text-xs font-medium">{outcome.label}</span>
                </motion.button>
              ))}
            </div>

            {/* XP Wager */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-white/50 shrink-0">Wager XP:</span>
              <div className="flex gap-2">
                {XP_OPTIONS.map(xp => (
                  <button
                    key={xp}
                    onClick={() => setXpWager(xp)}
                    disabled={isLocked || inningsComplete || xp > currentXp}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      xpWager === xp 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08]'
                    } ${xp > currentXp ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    {xp}
                  </button>
                ))}
              </div>
              <span className="text-xs text-white/30 ml-auto">Win: {xpWager * 2} XP</span>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={!isLocked && selectedOutcome ? { scale: 1.01 } : {}}
              whileTap={!isLocked && selectedOutcome ? { scale: 0.98 } : {}}
              onClick={submitPrediction}
              disabled={!selectedOutcome || isLocked || inningsComplete}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                inningsComplete
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : isLocked
                  ? 'bg-white/5 text-white/30 cursor-wait'
                  : selectedOutcome
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              {inningsComplete ? (
                <>
                  <Trophy className="h-5 w-5" />
                  Innings Complete
                </>
              ) : isLocked ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ball in progress...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Lock Prediction ({xpWager} XP)
                </>
              )}
            </motion.button>
          </div>

          {/* AI Probability Analysis */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                AI Probability Analysis
              </h2>
              {aiSuggestion && (
                <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-lg">
                  <Brain className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs text-white/50">AI suggests:</span>
                  <span className="text-xs font-bold text-purple-400">{aiSuggestion}</span>
                  <span className="text-xs text-white/30">({aiConfidence}%)</span>
                </div>
              )}
            </div>
            <div className="space-y-2.5">
              {OUTCOMES.map(o => (
                <ProbabilityBar 
                  key={o.id}
                  label={o.label}
                  value={liveProbabilities[o.id] || 0}
                  color={`bg-gradient-to-r ${
                    o.id === 'wicket' ? 'from-red-500 to-red-400' :
                    o.id === 'six' ? 'from-purple-500 to-purple-400' :
                    o.id === 'four' ? 'from-emerald-500 to-emerald-400' :
                    'from-blue-500 to-cyan-400'
                  }`}
                  max={maxProb}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Stats & History */}
        <div className="flex flex-col gap-5">
          {/* Performance Overview */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Your Performance
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white tabular-nums">{stats.accuracy}%</div>
                <div className="text-xs text-white/40 mt-0.5">Accuracy</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white tabular-nums">{stats.totalPredictions}</div>
                <div className="text-xs text-white/40 mt-0.5">Total Calls</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-emerald-400 tabular-nums flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4" />
                  {stats.currentStreak}
                </div>
                <div className="text-xs text-white/40 mt-0.5">Streak</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-yellow-400 tabular-nums">{stats.bestStreak}</div>
                <div className="text-xs text-white/40 mt-0.5">Best Streak</div>
              </div>
            </div>
            
            {/* XP Breakdown */}
            <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">XP Earned</span>
                <span className="text-emerald-400 font-medium">+{stats.totalXpEarned}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">XP Lost</span>
                <span className="text-red-400 font-medium">-{stats.totalXpLost}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-white/60">Net XP</span>
                <span className={stats.totalXpEarned - stats.totalXpLost >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {stats.totalXpEarned - stats.totalXpLost >= 0 ? '+' : ''}{stats.totalXpEarned - stats.totalXpLost}
                </span>
              </div>
            </div>
          </div>

          {/* Prediction History */}
          <div className="glass-panel p-5 rounded-2xl flex-1 min-h-0 flex flex-col">
            <h3 className="text-base font-bold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              Prediction History
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {predictions.length === 0 && (
                <div className="text-center py-8">
                  <Target className="h-8 w-8 text-white/10 mx-auto mb-2" />
                  <p className="text-sm text-white/30">No predictions yet</p>
                  <p className="text-xs text-white/20 mt-1">Make your first call!</p>
                </div>
              )}
              {predictions.slice(0, 20).map((pred) => (
                <motion.div
                  key={pred.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    pred.result === 'correct' 
                      ? 'bg-emerald-500/5 border-emerald-500/15' 
                      : pred.result === 'incorrect'
                        ? 'bg-red-500/5 border-red-500/15'
                        : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {pred.result === 'correct' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : pred.result === 'incorrect' ? (
                      <XCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <Clock className="h-4 w-4 text-white/30 animate-spin" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{pred.outcome}</div>
                      {pred.actualOutcome && pred.result === 'incorrect' && (
                        <div className="text-xs text-white/30">Actual: {pred.actualOutcome}</div>
                      )}
                    </div>
                  </div>
                  <div className={`text-sm font-bold tabular-nums ${
                    pred.result === 'correct' ? 'text-emerald-400' : 
                    pred.result === 'incorrect' ? 'text-red-400' : 'text-white/30'
                  }`}>
                    {pred.result === 'correct' ? `+${pred.xpWagered * 2}` : 
                     pred.result === 'incorrect' ? `-${pred.xpWagered}` : 
                     `${pred.xpWagered}`} XP
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* AI Insight Card */}
          <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-bold">AI Insight</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Based on historical data, dot balls are {liveProbabilities.dot}% likely in this phase. 
              The current run rate suggests aggressive batting ahead — expect boundaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
