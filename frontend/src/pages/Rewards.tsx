import { motion } from 'framer-motion';
import { Sparkles, Zap, Trophy, Target, Flame, Star, Crown } from 'lucide-react';
import Panel from '../components/ui/Panel';

const BADGES = [
  { icon: '🎯', name: 'First Prediction', desc: 'Make your first call', done: false },
  { icon: '🔥', name: 'Hot Streak 3', desc: '3 correct in a row', done: false },
  { icon: '💎', name: 'Diamond Eye', desc: '10 correct predictions', done: false },
  { icon: '🏏', name: 'Boundary Hunter', desc: 'Predict 5 fours/sixes', done: false },
  { icon: '⚡', name: 'Lightning Fast', desc: 'Predict within 2 seconds', done: false },
  { icon: '👑', name: 'Match King', desc: 'Top 10 in a match', done: false },
];

const MISSIONS = [
  { title: 'Daily Login', reward: 50, progress: 100, icon: '📅' },
  { title: 'Make 5 Predictions', reward: 100, progress: 0, icon: '🎯' },
  { title: 'Join a Watch Party', reward: 75, progress: 0, icon: '👥' },
  { title: 'Vote in 3 Polls', reward: 60, progress: 0, icon: '📊' },
  { title: 'React to 10 Balls', reward: 40, progress: 0, icon: '🔥' },
];

export default function Rewards() {
  return (
    <motion.div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold font-[Outfit]">Rewards & XP</h1>
          <p className="text-xs text-slate-500">Earn XP, unlock badges, complete missions</p>
        </div>
      </div>

      {/* XP Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { l: 'Total XP', v: '500', c: 'text-yellow-300', i: <Zap className="h-4 w-4 text-yellow-400" /> },
          { l: 'Level', v: '1', c: 'text-cyan-300', i: <Star className="h-4 w-4 text-cyan-400" /> },
          { l: 'Streak', v: '0', c: 'text-orange-300', i: <Flame className="h-4 w-4 text-orange-400" /> },
          { l: 'Badges', v: '0/6', c: 'text-purple-300', i: <Crown className="h-4 w-4 text-purple-400" /> },
        ].map(s => (
          <div key={s.l} className="panel p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">{s.i}</div>
            <div>
              <div className="stat-label">{s.l}</div>
              <div className={`stat-value text-xl ${s.c}`}>{s.v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Badges */}
        <Panel icon={<Trophy className="h-4 w-4" />} title="Badges">
          <div className="grid grid-cols-2 gap-2">
            {BADGES.map(b => (
              <div key={b.name} className={`p-3 rounded-lg border ${b.done ? 'bg-emerald-500/[0.06] border-emerald-500/15' : 'bg-[rgba(10,20,38,0.5)] border-[rgba(56,189,248,0.06)]'}`}>
                <div className="text-2xl mb-1">{b.icon}</div>
                <div className="text-xs font-bold text-white/80">{b.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{b.desc}</div>
                {b.done && <div className="text-[9px] text-emerald-300 font-bold mt-1">✓ Unlocked</div>}
              </div>
            ))}
          </div>
        </Panel>

        {/* Daily Missions */}
        <Panel icon={<Target className="h-4 w-4" />} title="Daily Missions">
          <div className="space-y-2">
            {MISSIONS.map(m => (
              <div key={m.title} className="p-3 rounded-lg bg-[rgba(10,20,38,0.5)] border border-[rgba(56,189,248,0.06)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold">{m.icon} {m.title}</span>
                  <span className="text-[10px] font-bold text-yellow-300 font-mono">+{m.reward} XP</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: `${m.progress}%` }} />
                </div>
                <div className="text-[9px] text-slate-500 mt-1 font-mono">{m.progress}% complete</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </motion.div>
  );
}
