import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Brain, MessageCircle, Sparkles,
  Trophy, Users, Vote, Wifi, WifiOff, Zap, Send
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import type { AppDispatch, RootState } from '../store';
import { addCommentary, setConnectionStatus, updateScore, type CommentaryEntry, type ScoreData } from '../store/slices/matchSlice';
import { ballsFromOver, ballsRemaining, overProgress, phaseForOver } from '../lib/cricket';
import Panel from '../components/ui/Panel';
import { BallChip, LiveDot } from '../components/ui/Atoms';

const API = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '';
const cfgWs = import.meta.env.VITE_WS_URL as string | undefined;
const WS_URL = cfgWs ? (cfgWs.endsWith('/ws/match') ? cfgWs : `${cfgWs.replace(/\/$/, '')}/ws/match`)
  : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/match`;

const FALLBACK: ScoreData = {
  teamA: 'CSK', teamB: 'SRH', competition: 'TATA IPL', matchFormat: 'IPL', maxOvers: 20,
  phase: 'Middle overs', inningsStatus: 'live', teamAScore: '142/3', teamBScore: '0/0',
  currentOver: '14.4', runRate: '9.6', target: null,
  batsmen: [
    { name: 'MS Dhoni', runs: 28, balls: 12, fours: 2, sixes: 3, strikeRate: 233.33, onStrike: true },
    { name: 'R Jadeja', runs: 14, balls: 8, fours: 1, sixes: 1, strikeRate: 175, onStrike: false },
  ],
  bowlers: [{ name: 'P Cummins', overs: '2.4', maidens: 0, runs: 32, wickets: 1, economy: 12, isBowling: true }],
  recentBalls: ['1', '4', '6', 'W', '1', '6'],
  winProbability: { teamA: 72, teamB: 28 },
};

const fallbackComm: CommentaryEntry[] = [
  { id: 'f1', over: '14.4', text: 'Stream ready. Live updates will take over when socket connects.', type: 'milestone', timestamp: Date.now() },
];

const TABS = ['Scorecard', 'Commentary', 'AI Analysis', 'Polls', 'Fan Chat'];

const fanChat = [['Ankit', 'This chase is pure theatre now.'], ['Maya', 'SRH need yorkers or this is gone.'], ['Rohit', 'Next over prediction: 12 runs.']];

type AiInsight = { title: string; text: string; color?: string; type?: string; confidence?: number };
type SockMsg = { type: string; data: any };

export default function LiveMatch() {
  const dispatch = useDispatch<AppDispatch>();
  const { matchId: _matchId = 'live' } = useParams();
  const { score, commentary, isConnected } = useSelector((s: RootState) => s.match);
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [insightClass, setInsightClass] = useState('');
  const [lastBall, setLastBall] = useState<string | null>(null);
  const [tab, setTab] = useState('Scorecard');
  const [poll, setPoll] = useState<string | null>(null);
  const [chat, setChat] = useState(fanChat);
  const [draft, setDraft] = useState('');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetch(`${API}/api/live-match`).then(r => r.json()).then((d: ScoreData) => dispatch(updateScore(d)))
      .catch(() => { dispatch(updateScore(FALLBACK)); fallbackComm.forEach(e => dispatch(addCommentary(e))); });
  }, [dispatch]);

  useEffect(() => {
    let sock: WebSocket;
    try { sock = new WebSocket(WS_URL); } catch { dispatch(setConnectionStatus(false)); return; }
    sock.onopen = () => dispatch(setConnectionStatus(true));
    sock.onclose = () => dispatch(setConnectionStatus(false));
    sock.onerror = () => dispatch(setConnectionStatus(false));
    sock.onmessage = (ev) => {
      const m = JSON.parse(ev.data) as SockMsg;
      if (m.type === 'SCORE_UPDATE') dispatch(updateScore(m.data));
      if (m.type === 'COMMENTARY') dispatch(addCommentary(m.data));
      if (m.type === 'AI_INSIGHT') {
        setInsight(m.data);
        setInsightClass('animate-slide-up');
        setTimeout(() => setInsightClass(''), 300);
      }
      if (m.type === 'BALL_RESULT') setLastBall(m.data.outcome);
      if (m.type === 'NEW_CHAT') setChat(p => [[m.data.user, m.data.text], ...p].slice(0, 8));
    };
    ws.current = sock;
    return () => { ws.current = null; sock?.close(); };
  }, [dispatch]);

  const send = (p: Record<string, unknown>) => { if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(p)); };
  const submitChat = () => { const t = draft.trim(); if (!t) return; setChat(p => [['You', t], ...p].slice(0, 8)); send({ type: 'CHAT_MESSAGE', user: 'You', text: t }); setDraft(''); };

  const d = score ?? FALLBACK;
  const rem = ballsRemaining(d.currentOver, d.maxOvers ?? 20);
  const phase = d.phase ?? phaseForOver(Math.floor(ballsFromOver(d.currentOver) / 6), d.maxOvers ?? 20);
  const done = d.inningsStatus === 'complete' || rem === 0;
  const striker = d.batsmen.find(b => b.onStrike) ?? d.batsmen[0];
  const bowler = d.bowlers.find(b => b.isBowling) ?? d.bowlers[0];
  const comms = commentary.length ? commentary : fallbackComm;
  const winA = Math.max(0, Math.min(100, d.winProbability.teamA));

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-3 sm:px-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`badge-live ${done ? 'badge-live-cyan' : isConnected ? 'badge-live-green' : 'badge-live-red'}`}>
            <LiveDot /> {done ? 'Complete' : isConnected ? 'Live' : 'Connecting'}
          </span>
          <h1 className="text-lg font-extrabold font-[Outfit]">{d.teamA} vs {d.teamB}</h1>
          <span className="text-xs text-slate-500">{d.competition} • {phase}</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? <Wifi className="h-4 w-4 text-emerald-400" /> : <WifiOff className="h-4 w-4 text-red-400" />}
          <span className="text-xs text-slate-500">{isConnected ? 'Connected' : 'Standby'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel p-2 flex gap-1 overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              tab === t ? 'bg-cyan-500/12 text-cyan-300 border border-cyan-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border border-transparent'
            }`}>{t}</button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-3 flex-1">
        <div className="flex flex-col gap-3">
          {/* Video / Score Display */}
          <div className="panel panel-accent overflow-hidden">
            <div className="relative bg-gradient-to-br from-[#0a1e3d] via-[#0d1628] to-[#1a0a2e] p-6 min-h-[220px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 chart-grid opacity-30" />
              <AnimatePresence>
                {lastBall && (
                  <motion.div key={lastBall} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="absolute right-4 bottom-4 h-14 w-14 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl font-black">
                    {lastBall}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative z-10 text-center">
                <div className="text-sm text-slate-400 mb-1">{d.teamA}</div>
                <div className="score-big text-5xl md:text-6xl text-white">{d.teamAScore}</div>
                <div className="text-sm text-slate-400 mt-2">{d.currentOver} ov • RR {d.runRate} • {rem} balls left</div>
              </div>
              <div className="w-full max-w-md mt-4 relative z-10">
                <div className="progress-track h-2">
                  <motion.div className="progress-fill bg-gradient-to-r from-cyan-500 to-emerald-400"
                    initial={{ width: 0 }} animate={{ width: `${overProgress(d.currentOver, d.maxOvers ?? 20)}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-slate-600 mt-1 font-mono">
                  <span>0.0</span><span>{d.currentOver}</span><span>{d.maxOvers}.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { l: 'Phase', v: phase, c: 'text-cyan-300' },
              { l: 'Overs', v: d.currentOver, c: done ? 'text-yellow-300' : 'text-emerald-300' },
              { l: 'Target', v: d.target ? String(d.target) : 'TBD', c: 'text-white' },
              { l: 'Format', v: d.matchFormat ?? 'IPL', c: 'text-purple-300' },
            ].map(s => (
              <div key={s.l} className="panel p-3">
                <div className="stat-label">{s.l}</div>
                <div className={`stat-value text-xl mt-1 ${s.c}`}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* On Field */}
          <Panel icon={<Users className="h-4 w-4" />} title="On Field">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {d.batsmen.map(b => (
                <div key={b.name} className="p-3 rounded-lg bg-[rgba(10,20,38,0.5)] border border-[rgba(56,189,248,0.06)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{b.name}</span>
                    {b.onStrike && <span className="text-[9px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">●</span>}
                  </div>
                  <div className="stat-value text-xl mt-1">{b.runs}<span className="text-sm text-slate-500">({b.balls})</span></div>
                  <div className="text-[10px] text-slate-500 font-mono">SR {b.strikeRate} • {b.fours}×4 {b.sixes}×6</div>
                </div>
              ))}
              {bowler && (
                <div className="p-3 rounded-lg bg-[rgba(10,20,38,0.5)] border border-[rgba(56,189,248,0.06)]">
                  <span className="text-xs font-bold">{bowler.name}</span>
                  <div className="stat-value text-xl mt-1">{bowler.wickets}/{bowler.runs}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{bowler.overs} ov • Econ {bowler.economy}</div>
                </div>
              )}
            </div>
          </Panel>

          {/* Recent Balls */}
          <Panel icon={<Zap className="h-4 w-4" />} title="Recent Balls">
            <div className="flex flex-wrap gap-2">
              {d.recentBalls.map((b, i) => <BallChip key={i} ball={b} />)}
            </div>
          </Panel>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-3">
          {/* Win Probability */}
          <Panel icon={<BarChart3 className="h-4 w-4" />} title="Win Probability">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1"><span>{d.teamA}</span><span className="font-bold text-emerald-300">{winA}%</span></div>
                <div className="progress-track"><div className="progress-fill bg-emerald-400" style={{ width: `${winA}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span>{d.teamB}</span><span className="font-bold text-cyan-300">{100 - winA}%</span></div>
                <div className="progress-track"><div className="progress-fill bg-cyan-400" style={{ width: `${100 - winA}%` }} /></div>
              </div>
            </div>
          </Panel>

          {/* AI Insight */}
          <Panel icon={<Brain className="h-4 w-4" />} title="AI Insight" accent className={insightClass}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold">{insight?.title ?? (done ? 'Innings complete' : `${striker.name} matchup`)}</span>
              {insight?.confidence !== undefined && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {insight.confidence}% confidence
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {insight?.text ?? `${striker.name} on strike with ${rem} balls left. Watch the next transition.`}
            </p>
          </Panel>

          {/* Live Poll */}
          <Panel icon={<Vote className="h-4 w-4" />} title="Live Poll">
            <div className="text-xs font-semibold text-slate-300 mb-2">Next ball outcome?</div>
            {[['Boundary', 46], ['Single/Two', 34], ['Wicket', 20]].map(([l, v]) => (
              <button key={l as string} onClick={() => { setPoll(l as string); send({ type: 'PREDICTION', prediction: l }); }}
                className={`w-full rounded-lg border p-2.5 mb-1.5 last:mb-0 text-left transition-all ${
                  poll === l ? 'border-cyan-300/40 bg-cyan-300/8' : 'border-[rgba(56,189,248,0.08)] bg-[rgba(15,32,53,0.4)] hover:bg-white/[0.03]'
                }`}>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1"><span>{l}</span><span>{v}%</span></div>
                <div className="progress-track h-1"><div className="progress-fill bg-cyan-400" style={{ width: `${v}%` }} /></div>
              </button>
            ))}
          </Panel>

          {/* Fan Chat */}
          <Panel icon={<MessageCircle className="h-4 w-4" />} title="Fan Chat">
            <div className="flex gap-1.5 mb-3">
              <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitChat()}
                placeholder="Send a reaction..." className="min-w-0 flex-1 rounded-lg border border-[rgba(56,189,248,0.1)] bg-[rgba(10,20,38,0.6)] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/30" />
              <button onClick={submitChat} className="ctrl-btn ctrl-btn-primary px-3"><Send className="h-3 w-3" /></button>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {chat.map(([n, t], i) => (
                <div key={`${n}-${i}`} className="p-2 rounded-lg bg-[rgba(10,20,38,0.4)] border border-[rgba(56,189,248,0.05)]">
                  <div className="text-[10px] font-bold text-cyan-300">{n}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t}</div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Commentary */}
          <Panel icon={<Sparkles className="h-4 w-4" />} title="Commentary">
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {comms.slice(0, 10).map(e => (
                <div key={e.id} className="border-b border-[rgba(56,189,248,0.05)] pb-2 last:border-b-0">
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-600 mb-0.5">
                    <Trophy className="h-2.5 w-2.5" /><span>{e.over} ov</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{e.text}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
