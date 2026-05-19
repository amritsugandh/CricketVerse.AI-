import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Radio, WifiOff } from 'lucide-react';
import { setMatches, setLoading, type LiveMatch } from '../../store/slices/scoreboardSlice';
import type { RootState } from '../../store';
import { LiveDot } from './Atoms';

const API = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '';

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[220px] h-[130px] rounded-xl bg-slate-700/30 animate-pulse border border-white/5" />
  );
}

function MatchCard({ match, prevScores }: { match: LiveMatch; prevScores: Record<string, string> }) {
  const navigate = useNavigate();
  const isComplete = match.inningsStatus === 'complete';
  const [popA, setPopA] = useState(false);
  const [popB, setPopB] = useState(false);

  useEffect(() => {
    const prevScore = prevScores[match.matchId + '_a'];
    if (prevScore && prevScore !== match.teamAScore) {
      setPopA(true);
      const t = setTimeout(() => setPopA(false), 400);
      return () => clearTimeout(t);
    }
  }, [match.teamAScore, prevScores, match.matchId]);

  useEffect(() => {
    const prevScore = prevScores[match.matchId + '_b'];
    if (prevScore && prevScore !== match.teamBScore) {
      setPopB(true);
      const t = setTimeout(() => setPopB(false), 400);
      return () => clearTimeout(t);
    }
  }, [match.teamBScore, prevScores, match.matchId]);

  return (
    <button
      onClick={() => navigate(`/match/${match.matchId}`)}
      className="flex-shrink-0 w-[220px] panel border-[rgba(56,189,248,0.12)] rounded-xl p-3 text-left hover:border-cyan-400/30 hover:bg-cyan-500/[0.04] transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">
          {match.competition ?? 'Live Cricket'}
        </span>
        {isComplete ? (
          <span className="badge-live badge-live-cyan text-[9px] py-0.5 px-1.5">Final</span>
        ) : (
          <span className="badge-live badge-live-red text-[9px] py-0.5 px-1.5">
            <LiveDot /> Live
          </span>
        )}
      </div>

      {/* Teams & Scores */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white truncate max-w-[80px]">{match.teamA}</span>
          <span
            className={`stat-value text-sm text-white ${popA ? 'animate-score-pop' : ''}`}
          >
            {match.teamAScore}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 truncate max-w-[80px]">{match.teamB}</span>
          <span
            className={`stat-value text-sm text-slate-400 ${popB ? 'animate-score-pop' : ''}`}
          >
            {match.teamBScore}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <span className="text-[10px] text-slate-500 font-mono">{match.currentOver} ov • RR {match.runRate}</span>
        <span className="badge-live badge-live-cyan text-[9px] py-0.5 px-1.5">
          {match.matchFormat === 'IPL' ? 'T20' : match.matchFormat ?? 'T20'}
        </span>
      </div>
    </button>
  );
}

export default function ScoreboardWidget() {
  const dispatch = useDispatch();
  const { matches, loading } = useSelector((s: RootState) => s.scoreboard);
  const [pollError, setPollError] = useState(false);
  const prevScoresRef = useRef<Record<string, string>>({});
  const matchesRef = useRef<LiveMatch[]>([]);

  // Sync ref with current matches state
  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  const fetchMatches = async (isInitial = false) => {
    if (isInitial) dispatch(setLoading(true));
    try {
      const res = await fetch(`${API}/api/matches/live`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: LiveMatch[] = data.matches ?? [];
      
      // Snapshot the actual PREVIOUS scores from the Ref!
      const snap: Record<string, string> = {};
      for (const m of matchesRef.current) {
        snap[m.matchId + '_a'] = m.teamAScore;
        snap[m.matchId + '_b'] = m.teamBScore;
      }
      prevScoresRef.current = snap;

      dispatch(setMatches(list));
      setPollError(false);
    } catch {
      if (isInitial) dispatch(setLoading(false));
      setPollError(true);
    }
  };

  useEffect(() => {
    fetchMatches(true);
    const iv = setInterval(() => fetchMatches(false), 15000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="panel mb-3">
      <div className="panel-header">
        <span className="icon"><Radio className="h-4 w-4" /></span>
        <span className="flex-1">Live Scoreboard</span>
        {pollError && (
          <span className="flex items-center gap-1 text-[10px] text-red-400">
            <WifiOff className="h-3 w-3" /> Sync error
          </span>
        )}
        <span className="text-[10px] text-slate-500 font-mono">Updates every 15s</span>
      </div>
      <div className="panel-body">
        {loading ? (
          <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar pb-1">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : matches.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No live matches right now</p>
        ) : (
          <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar pb-1">
            {matches.map(m => (
              <MatchCard key={m.matchId} match={m} prevScores={prevScoresRef.current} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
