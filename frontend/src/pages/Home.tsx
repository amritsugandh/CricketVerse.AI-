import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Activity, Brain, Flame, Radio, Sparkles,
  Target, Trophy, Users, Zap, ArrowRight, TrendingUp,
  Globe, Star, ChevronRight, Play
} from 'lucide-react';
import ScoreboardWidget from '../components/ui/ScoreboardWidget';
import TournamentBlock from '../components/ui/TournamentBlock';

// ── Hero stats ──
const HERO_STATS = [
  { label: 'Active Fans',     value: '142K',  icon: Users,     color: 'text-cyan-400' },
  { label: 'Live Matches',    value: '6',     icon: Radio,     color: 'text-emerald-400' },
  { label: 'Predictions/hr', value: '28.4K', icon: Target,    color: 'text-purple-400' },
  { label: 'XP Rewarded',    value: '3.2M',  icon: Zap,       color: 'text-yellow-400' },
];

// ── Quick action cards ──
const QUICK_ACTIONS = [
  {
    to: '/match/live',
    label: 'Live Match Hub',
    sub: 'RR vs LSG • Match 64 • IPL 2026',
    icon: Radio,
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    border: 'border-cyan-500/25',
    iconColor: 'text-cyan-400',
    badge: 'LIVE',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  {
    to: '/predict',
    label: 'Predict & Earn',
    sub: 'AI-powered ball predictions',
    icon: Brain,
    gradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
    border: 'border-purple-500/25',
    iconColor: 'text-purple-400',
    badge: 'HOT',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  {
    to: '/leaderboards',
    label: 'Leaderboards',
    sub: 'Global prediction rankings',
    icon: Trophy,
    gradient: 'from-yellow-500/15 via-amber-500/8 to-transparent',
    border: 'border-yellow-500/20',
    iconColor: 'text-yellow-400',
    badge: 'UPDATED',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    to: '/rewards',
    label: 'Rewards Store',
    sub: 'Redeem your XP for prizes',
    icon: Sparkles,
    gradient: 'from-emerald-500/15 via-teal-500/8 to-transparent',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    badge: 'NEW',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
];

// ── Featured matches — IPL 2026, 19 May 2026 ──
const FEATURED = [
  { teams: 'RR vs LSG', score: 'Match 64 • 7:30 PM IST', status: 'LIVE', format: 'IPL 2026 T20', prob: 55, venue: 'Sawai Mansingh Stadium, Jaipur' },
  { teams: 'BAN vs PAK', score: '1st Test • Day 3 Stumps', status: 'LIVE', format: 'Test Series 2026', prob: 48, venue: 'Shere Bangla Stadium, Dhaka' },
  { teams: 'RCB vs PBKS', score: 'RCB won by 23 runs', status: 'COMPLETE', format: 'IPL 2026 T20', prob: 100, venue: 'HPCA Stadium, Dharamsala' },
];

// ── Trending predictions — RR vs LSG context ──
const TRENDING = [
  { call: 'KL Rahul fifty this innings', user: 'CricMaster99', confidence: 78, votes: '2.1K', emoji: '🏏' },
  { call: 'Wicket in powerplay end',     user: 'SpinWizard',   confidence: 64, votes: '1.4K', emoji: '🔴' },
  { call: 'RR win by 20+ runs',          user: 'IPL_Junkie',   confidence: 57, votes: '980',  emoji: '🏆' },
];

// ── Recent activity ──
const ACTIVITY = [
  { user: 'BoundaryKing', text: 'earned 200 XP on FOUR prediction', time: '12s ago', emoji: '💚' },
  { user: 'DhoniFC',      text: 'reached #6 on leaderboard!',       time: '34s ago', emoji: '⬆️' },
  { user: 'SixHitter42',  text: 'predicted SIX correctly! 🎆',      time: '1m ago',  emoji: '🎯' },
  { user: 'GullyBoy',     text: 'unlocked "Sharp Eye" badge',        time: '2m ago',  emoji: '🏅' },
];

// ── Floating ticker items — 19 May 2026 ──
const TICKER = [
  '🏏 IPL 2026 Match 64 — RR vs LSG • 7:30 PM IST • Sawai Mansingh Stadium, Jaipur',
  '🎯 CricMaster99 predicted KL Rahul fifty correctly! +200 XP',
  '🔥 SpinWizard on 9-ball prediction streak',
  '📈 34K predictions placed in last hour — IPL 2026',
  '⚡ RR Win Probability: 55% at Jaipur',
  '🏆 RCB beat PBKS by 23 runs in Match 61 — May 17',
  '🎆 IPL_Junkie hit 74% accuracy milestone!',
  '📊 BAN vs PAK 1st Test — Bangladesh 413 & 7/0 at Stumps Day 3',
];

export default function Home() {
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTickerIdx(i => (i + 1) % TICKER.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-3 sm:px-4 flex flex-col gap-4 pb-20 md:pb-4">

      {/* ── Live Ticker ── */}
      <div className="panel px-4 py-2 flex items-center gap-3 overflow-hidden">
        <span className="badge-live badge-live-red shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse-live" />
          Live
        </span>
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={tickerIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-slate-300 font-medium"
            >
              {TICKER[tickerIdx]}
            </motion.span>
          </AnimatePresence>
        </div>
        <Globe className="h-3.5 w-3.5 text-slate-600 shrink-0" />
      </div>

      {/* ── Hero + Stats ── */}
      <div className="panel panel-accent relative overflow-hidden p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-purple-500/[0.04] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge-live badge-live-green">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PulsePlay Arena
              </span>
              <span className="text-[10px] text-slate-600 font-mono">IPL 2026 • Season 19 • Match 64 Today</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-[Outfit] mb-2 leading-tight">
              <span className="text-gradient-cyan">CricketVerse</span>{' '}
              <span className="text-white">AI</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-lg leading-relaxed mb-4">
              The ultimate real-time cricket engagement platform. Predict ball-by-ball outcomes,
              earn XP, climb leaderboards, and experience matches like never before.
            </p>
            <Link
              to="/match/live"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/25 to-blue-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-bold hover:from-cyan-500/35 hover:to-blue-500/30 transition-all"
            >
              <Play className="h-4 w-4" />
              Watch Live Match
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 md:w-auto w-full">
            {HERO_STATS.map(s => (
              <motion.div
                key={s.label}
                whileHover={{ scale: 1.03 }}
                className="panel p-3 text-center min-w-[100px]"
              >
                <s.icon className={`h-4 w-4 ${s.color} mx-auto mb-1`} />
                <div className={`text-xl font-black font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {QUICK_ACTIONS.map(action => (
          <motion.div key={action.to} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link
              to={action.to}
              className={`panel flex flex-col gap-3 p-4 border ${action.border} bg-gradient-to-br ${action.gradient} block transition-all hover:shadow-lg h-full`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg bg-white/[0.04]`}>
                  <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${action.badgeClass}`}>
                  {action.badge}
                </span>
              </div>
              <div>
                <div className="text-sm font-bold text-white">{action.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{action.sub}</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 mt-auto ml-auto" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── Featured Matches ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        <div className="flex flex-col gap-4">
          {/* Scoreboard Widget */}
          <ScoreboardWidget />

          {/* Tournament */}
          <TournamentBlock />

          {/* Live Matches */}
          <div className="panel">
            <div className="panel-header">
              <Activity className="icon h-4 w-4" />
              Featured Matches
            </div>
            <div className="panel-body space-y-2">
              {FEATURED.map(m => (
                <div
                  key={m.teams}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === 'LIVE'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : m.status === 'UPCOMING'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/20'
                    }`}>{m.status}</div>
                    <div>
                      <div className="text-sm font-bold text-white">{m.teams}</div>
                      <div className="text-[10px] text-slate-500">{m.score} • {m.format}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.status === 'LIVE' && (
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-slate-500">Win Prob</div>
                        <div className="text-sm font-bold text-cyan-300 font-mono">{m.prob}%</div>
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Predictions */}
          <div className="panel">
            <div className="panel-header">
              <TrendingUp className="icon h-4 w-4" />
              Trending Predictions
            </div>
            <div className="panel-body space-y-2">
              {TRENDING.map(t => (
                <div key={t.call} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-xl shrink-0">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{t.call}</div>
                    <div className="text-[10px] text-slate-500">by {t.user} • {t.votes} votes</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black font-mono text-emerald-300">{t.confidence}%</div>
                    <div className="text-[9px] text-slate-600">confidence</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="flex flex-col gap-4">

          {/* Live Activity */}
          <div className="panel">
            <div className="panel-header">
              <Star className="icon h-4 w-4" />
              Live Activity
            </div>
            <div className="panel-body space-y-2">
              <AnimatePresence mode="popLayout">
                {ACTIVITY.map((a, i) => (
                  <motion.div
                    key={`${a.user}-${i}`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02]"
                  >
                    <span className="text-base shrink-0">{a.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-cyan-300">{a.user}</span>
                      <span className="text-xs text-slate-400"> {a.text}</span>
                    </div>
                    <span className="text-[9px] text-slate-600 font-mono shrink-0">{a.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* XP Your Progress */}
          <div className="panel panel-accent p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/[0.04] rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-bold">Your Progress</span>
                </div>
                <span className="text-xs font-black font-mono text-yellow-300">500 XP</span>
              </div>
              <div className="progress-track h-2 mb-2">
                <div className="progress-fill bg-gradient-to-r from-yellow-400 to-amber-300" style={{ width: '4%' }} />
              </div>
              <div className="flex justify-between text-[9px] text-slate-600">
                <span>Rank #10</span>
                <span>Next: 6,800 XP to #9</span>
              </div>
              <Link
                to="/predict"
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition-all"
              >
                <Target className="h-3.5 w-3.5" />
                Start Predicting
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Flame Streak */}
          <div className="panel p-4 flex items-center gap-3 bg-gradient-to-r from-orange-500/8 to-amber-500/5 border-orange-500/15">
            <Flame className="h-8 w-8 text-orange-400 shrink-0" />
            <div>
              <div className="text-sm font-black text-orange-300">0 Ball Streak</div>
              <div className="text-[10px] text-slate-500">Make a prediction to start your streak!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
