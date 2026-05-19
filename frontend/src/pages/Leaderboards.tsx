import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, ChevronUp, ChevronDown, Flame, Zap, Crown,
  Activity, TrendingUp, Target, Brain, Users, Radio,
  ArrowRight, BarChart3, Sparkles, Timer
} from 'lucide-react';
import Panel from '../components/ui/Panel';

// ── Types ──
interface Player {
  rank: number;
  name: string;
  xp: number;
  streak: number;
  acc: number;
  change: number;
  medal: string;
  avatar: string;
  predictions: number;
  isYou?: boolean;
  trend: 'up' | 'down' | 'same';
}

// ── Initial Data ──
const INITIAL_PLAYERS: Player[] = [
  { rank: 1, name: 'CricMaster99',  xp: 12840, streak: 12, acc: 78, change: 0,   medal: '🥇', avatar: 'C', predictions: 184, trend: 'same' },
  { rank: 2, name: 'IPL_Junkie',    xp: 11610, streak: 9,  acc: 74, change: 2,   medal: '🥈', avatar: 'I', predictions: 162, trend: 'up' },
  { rank: 3, name: 'SpinWizard',    xp: 10450, streak: 8,  acc: 71, change: -1,  medal: '🥉', avatar: 'S', predictions: 149, trend: 'down' },
  { rank: 4, name: 'BoundaryKing',  xp: 9280,  streak: 6,  acc: 69, change: 1,   medal: '',   avatar: 'B', predictions: 137, trend: 'up' },
  { rank: 5, name: 'SixHitter42',   xp: 8900,  streak: 5,  acc: 67, change: -2,  medal: '',   avatar: 'S', predictions: 121, trend: 'down' },
  { rank: 6, name: 'DhoniFC',       xp: 8100,  streak: 4,  acc: 65, change: 3,   medal: '',   avatar: 'D', predictions: 115, trend: 'up' },
  { rank: 7, name: 'PaceAttack',    xp: 7600,  streak: 3,  acc: 63, change: 0,   medal: '',   avatar: 'P', predictions: 109, trend: 'same' },
  { rank: 8, name: 'CoverDrive',    xp: 7200,  streak: 2,  acc: 61, change: -1,  medal: '',   avatar: 'C', predictions: 98,  trend: 'down' },
  { rank: 9, name: 'GullyBoy',      xp: 6800,  streak: 1,  acc: 58, change: 2,   medal: '',   avatar: 'G', predictions: 91,  trend: 'up' },
  { rank: 10, name: 'You',          xp: 500,   streak: 0,  acc: 0,  change: 15,  medal: '',   avatar: 'Y', predictions: 3,   isYou: true, trend: 'up' },
];

// ── Live Stats ──
const LIVE_STATS = [
  { label: 'Active Predictors', value: '2,847', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { label: 'Predictions Today', value: '41.2K', icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { label: 'Avg Accuracy',      value: '63.4%', icon: Brain,  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'XP Distributed',   value: '892K',  icon: Zap,    color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
];

// ── Momentum events feed ──
const MOMENTUM_EVENTS = [
  { user: 'CricMaster99', action: 'called a SIX! 🎆 +100 XP',        type: 'six' },
  { user: 'IPL_Junkie',   action: 'predicted WICKET correctly 🎯',     type: 'wicket' },
  { user: 'SpinWizard',   action: 'hit a 5-ball streak! 🔥',           type: 'streak' },
  { user: 'BoundaryKing', action: 'predicted DOT BALL +20 XP',         type: 'dot' },
  { user: 'DhoniFC',      action: 'climbed 3 ranks to #6! ⬆️',         type: 'rank' },
  { user: 'SixHitter42',  action: 'called BOUNDARY correctly 🎯 +80',  type: 'four' },
  { user: 'GullyBoy',     action: 'prediction accuracy hit 70%! 📈',   type: 'milestone' },
  { user: 'You',          action: 'made first prediction! Welcome 🎉',  type: 'welcome' },
];

function eventColor(type: string) {
  switch (type) {
    case 'six': return 'border-l-purple-500 bg-purple-500/5';
    case 'wicket': return 'border-l-red-500 bg-red-500/5';
    case 'streak': return 'border-l-orange-500 bg-orange-500/5';
    case 'rank': return 'border-l-cyan-500 bg-cyan-500/5';
    case 'four': return 'border-l-emerald-500 bg-emerald-500/5';
    case 'milestone': return 'border-l-yellow-500 bg-yellow-500/5';
    default: return 'border-l-blue-500 bg-blue-500/5';
  }
}

function rankBadgeClass(rank: number) {
  if (rank === 1) return 'lb-rank-crown text-yellow-400';
  if (rank === 2) return 'lb-rank-silver text-slate-300';
  if (rank === 3) return 'lb-rank-bronze text-amber-600';
  return 'bg-white/[0.03] border border-white/[0.06] text-slate-500';
}

export default function Leaderboards() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [eventFeed, setEventFeed] = useState(MOMENTUM_EVENTS.slice(0, 4));
  const [matchStats, setMatchStats] = useState<any[]>([
    { label: 'Dot Ball Calls', pct: 38, color: 'bg-slate-400', correct: 24 },
    { label: 'Boundary Calls', pct: 28, color: 'bg-emerald-400', correct: 72 },
    { label: 'Wicket Calls', pct: 14, color: 'bg-red-400', correct: 41 },
    { label: 'Six Calls', pct: 11, color: 'bg-purple-400', correct: 65 },
    { label: 'Single/Double', pct: 9, color: 'bg-cyan-400', correct: 58 },
  ]);
  const [aiTrends, setAiTrends] = useState<any[]>([
    { title: 'Trending: Boundary Predictions', desc: '72% of top predictors are calling boundaries in the death overs. Power hitters at crease suggest aggressive batting phase ahead.', color: 'emerald' },
    { title: 'Wicket Probability Window', desc: 'AI models detect a 34% chance of a wicket in the next 2 overs based on bowler matchups and current run rate pressure.', color: 'purple' }
  ]);
  const [tab, setTab] = useState<'global' | 'weekly' | 'friends'>('global');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [pulsing, setPulsing] = useState(false);

  // Connect to live leaderboard backend
  useEffect(() => {
    const cfgWs = import.meta.env.VITE_WS_URL as string | undefined;
    let wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/leaderboard`;
    if (cfgWs) {
      if (cfgWs.includes('/ws/match')) {
        wsUrl = cfgWs.replace('/ws/match', '/ws/leaderboard');
      } else if (cfgWs.endsWith('/ws/leaderboard')) {
        wsUrl = cfgWs;
      } else {
        wsUrl = `${cfgWs.replace(/\/$/, '')}/ws/leaderboard`;
      }
    }

    let sock: WebSocket;
    try {
      sock = new WebSocket(wsUrl);
    } catch {
      return;
    }

    sock.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m.type === 'LEADERBOARD_UPDATE') {
          setPulsing(true);
          setTimeout(() => setPulsing(false), 600);
          setPlayers(m.data.players);
          setEventFeed(m.data.eventFeed);
          if (m.data.matchStats) setMatchStats(m.data.matchStats);
          if (m.data.aiTrends) setAiTrends(m.data.aiTrends);
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Failed to parse leaderboard update', err);
      }
    };

    return () => {
      sock.close();
    };
  }, []);

  const topThree = players.slice(0, 3);
  const maxXp = players[0]?.xp ?? 1;

  return (
    <motion.div
      className="mx-auto max-w-[1400px] px-3 py-4 sm:px-4 pb-20 md:pb-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/20">
            <Trophy className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold font-[Outfit]">Global Leaderboards</h1>
            <p className="text-xs text-slate-500">Real-time prediction rankings • Updated live</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`lb-live-badge transition-all duration-300 ${pulsing ? 'opacity-50' : 'opacity-100'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          <span className="text-[10px] text-slate-600 font-mono">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* ── Live Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {LIVE_STATS.map(s => (
          <motion.div
            key={s.label}
            className="panel p-3 flex items-center gap-3"
            whileHover={{ scale: 1.01 }}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <div className={`text-base font-black font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">

        {/* ── Left: Leaderboard ── */}
        <div className="flex flex-col gap-4">

          {/* Tab Switcher */}
          <div className="panel p-1.5 flex gap-1">
            {(['global', 'weekly', 'friends'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-all ${
                  tab === t
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-2">
            {topThree.map((p, i) => (
              <motion.div
                key={p.name}
                layout
                className={`panel panel-accent p-4 text-center relative overflow-hidden ${
                  i === 0 ? 'ring-1 ring-yellow-500/25 shadow-[0_0_30px_rgba(245,158,11,0.08)]' : ''
                }`}
              >
                {i === 0 && (
                  <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />
                )}
                <div className="text-2xl mb-1">{p.medal}</div>
                <motion.div
                  className="lb-avatar mx-auto mb-2 h-12 w-12 text-base font-black"
                  animate={pulsing && i === 0 ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  {p.avatar}
                </motion.div>
                <div className="text-xs font-bold text-white truncate">{p.name}</div>
                <motion.div
                  className="stat-value text-lg text-gradient-gold mt-1"
                  key={p.xp}
                  initial={{ scale: 1.1, color: '#22d3ee' }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {p.xp.toLocaleString()}
                </motion.div>
                <div className="text-[9px] text-slate-500 mt-0.5">XP • {p.streak}🔥 • {p.acc}%</div>
                <div className="xp-bar-track">
                  <motion.div
                    className="xp-bar-fill"
                    animate={{ width: `${(p.xp / maxXp) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Full Rankings Table */}
          <Panel icon={<Crown className="h-4 w-4" />} title="Global Rankings">
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {players.map(p => (
                  <motion.div
                    key={p.name}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`lb-item ${p.isYou ? 'bg-cyan-500/[0.06] border border-cyan-500/15 ring-1 ring-cyan-500/10' : ''}`}
                  >
                    {/* Rank Badge */}
                    <div className={`lb-rank flex items-center justify-center h-7 w-7 rounded-lg text-xs font-black ${rankBadgeClass(p.rank)}`}>
                      {p.rank}
                    </div>

                    {/* Avatar */}
                    <div className="lb-avatar text-xs font-black shrink-0">
                      {p.medal || p.avatar}
                    </div>

                    {/* Name + XP bar */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${p.isYou ? 'text-cyan-200' : 'text-white/80'}`}>
                        {p.name} {p.isYou && <span className="text-[9px] text-cyan-400 ml-1">(You)</span>}
                      </div>
                      <div className="xp-bar-track" style={{ marginTop: 3 }}>
                        <motion.div
                          className="xp-bar-fill"
                          animate={{ width: `${(p.xp / maxXp) * 100}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* XP Value */}
                    <motion.div
                      key={p.xp}
                      className="text-[11px] font-black font-mono text-white/70 w-16 text-right"
                      animate={pulsing ? { color: ['#94a3b8', '#22d3ee', '#94a3b8'] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {p.xp.toLocaleString()}
                    </motion.div>

                    {/* Accuracy */}
                    <div className="text-[10px] text-slate-500 font-mono hidden sm:block w-9 text-right">{p.acc}%</div>

                    {/* Streak */}
                    <div className="flex items-center gap-0.5 text-[10px] w-8 justify-end">
                      <Flame className="h-3 w-3 text-orange-400" />
                      <span className="font-bold text-orange-300 font-mono">{p.streak}</span>
                    </div>

                    {/* Trend */}
                    <div className="w-6 text-center">
                      {p.trend === 'up' && <ChevronUp className="h-3.5 w-3.5 text-emerald-400 inline" />}
                      {p.trend === 'down' && <ChevronDown className="h-3.5 w-3.5 text-red-400 inline" />}
                      {p.trend === 'same' && <span className="text-[8px] text-slate-600">—</span>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Panel>
        </div>

        {/* ── Right: Real-Time Analysis ── */}
        <div className="flex flex-col gap-4">

          {/* Section Header */}
          <div className="panel panel-accent p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-extrabold font-[Outfit] text-gradient-cyan">Real-Time Analysis</span>
                <span className="lb-live-badge ml-auto">
                  <Radio className="h-2.5 w-2.5" />
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Leaderboard updates every 5 seconds during active matches</p>
            </div>
          </div>

          {/* Live Momentum Feed */}
          <Panel icon={<Sparkles className="h-4 w-4" />} title="Momentum Feed">
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {eventFeed.map((ev, i) => (
                  <motion.div
                    key={`${ev.user}-${ev.action}-${i}`}
                    initial={{ opacity: 0, y: -12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35 }}
                    className={`border-l-2 pl-3 py-2 pr-2 rounded-r-lg text-xs ${eventColor(ev.type)}`}
                  >
                    <span className="font-bold text-white/80">{ev.user}</span>
                    <span className="text-slate-400"> {ev.action}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Panel>

          {/* Match Analysis Stats */}
          <Panel icon={<BarChart3 className="h-4 w-4" />} title="Match Prediction Stats">
            <div className="space-y-3">
              {matchStats.map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-bold font-mono text-slate-300">{item.pct}% · {item.correct}% acc</span>
                  </div>
                  <div className="progress-track h-1.5">
                    <motion.div
                      className={`progress-fill ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct * 2.5}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* AI Trend Analysis */}
          <Panel icon={<Brain className="h-4 w-4" />} title="AI Trend Analysis" accent>
            <div className="space-y-3">
              {aiTrends.map((item, idx) => (
                <div key={item.title} className={`p-3 rounded-xl bg-gradient-to-r ${
                  item.color === 'emerald'
                    ? 'from-emerald-500/10 to-blue-500/5 border-emerald-500/15'
                    : 'from-purple-500/10 to-blue-500/5 border-purple-500/15'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {idx === 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <Target className="h-3.5 w-3.5 text-red-400" />}
                    <span className={`text-xs font-bold ${item.color === 'emerald' ? 'text-emerald-300' : 'text-purple-300'}`}>{item.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          {/* Refresh Timer */}
          <div className="panel p-3 flex items-center gap-3">
            <Timer className="h-4 w-4 text-slate-500 shrink-0" />
            <div className="flex-1">
              <div className="text-[10px] text-slate-500">Next update in</div>
              <CountdownTimer />
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
          </div>

        </div>
      </div>
    </motion.div>
  );
}

// ── Countdown Timer Component ──
function CountdownTimer() {
  const [seconds, setSeconds] = useState(5);
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(s => s <= 1 ? 5 : s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-black font-mono text-cyan-300">{seconds}s</span>
      <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden ml-2">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
          animate={{ width: `${(seconds / 5) * 100}%` }}
          transition={{ duration: 0.9 }}
        />
      </div>
    </div>
  );
}
