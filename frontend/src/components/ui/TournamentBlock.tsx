import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '';

interface Tournament {
  seriesId: string;
  name: string;
  startDate: string;
  endDate: string;
  format: 'T20' | 'ODI' | 'Test' | 'T10' | 'Other';
  teams: string[];
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

function formatDate(iso: string): string {
  if (!iso || iso === 'unknown') return 'TBD';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'TBD';
  }
}

function FormatBadge({ format }: { format: Tournament['format'] }) {
  if (format === 'T20') return <span className="badge-live badge-live-cyan text-[9px] py-0.5 px-1.5">T20</span>;
  if (format === 'ODI') return <span className="badge-live badge-live-green text-[9px] py-0.5 px-1.5">ODI</span>;
  if (format === 'Test') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">Test</span>;
  if (format === 'T10') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">T10</span>;
  return <span className="badge-live text-[9px] py-0.5 px-1.5">{format}</span>;
}

function SkeletonCard() {
  return <div className="flex-shrink-0 w-[220px] h-[140px] rounded-xl bg-slate-700/30 animate-pulse border border-white/5" />;
}

function TournamentCard({ t }: { t: Tournament }) {
  const isOngoing = t.status === 'Ongoing';
  return (
    <div className="flex-shrink-0 w-[220px] panel border-[rgba(56,189,248,0.12)] rounded-xl p-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-white leading-tight line-clamp-2">{t.name}</span>
        <FormatBadge format={t.format} />
      </div>

      {/* Dates */}
      <div className="text-[10px] text-slate-500 font-mono mb-2">
        {formatDate(t.startDate)} → {formatDate(t.endDate)}
      </div>

      {/* Teams */}
      {t.teams.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {t.teams.slice(0, 4).map(team => (
            <span key={team} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/8">
              {team}
            </span>
          ))}
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-1.5">
        {isOngoing && <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse-live" />}
        <span className={`text-[10px] font-bold ${
          isOngoing ? 'text-red-300' :
          t.status === 'Completed' ? 'text-slate-500' :
          'text-emerald-300'
        }`}>{t.status}</span>
      </div>
    </div>
  );
}

export default function TournamentBlock() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/tournaments/upcoming`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setTournaments(d.tournaments ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className="panel mb-3">
      <div className="panel-header">
        <span className="icon"><Trophy className="h-4 w-4" /></span>
        <span className="flex-1">Upcoming Tournaments</span>
        <span className="text-[10px] text-slate-500 font-mono">Cricket Calendar</span>
      </div>
      <div className="panel-body">
        {loading ? (
          <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar pb-1">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm">Could not load tournaments</p>
        ) : tournaments.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No upcoming tournaments</p>
        ) : (
          <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar pb-1">
            {tournaments.map(t => <TournamentCard key={t.seriesId} t={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
