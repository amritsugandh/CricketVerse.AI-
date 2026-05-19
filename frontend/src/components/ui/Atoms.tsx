export function BallChip({ ball }: { ball: string }) {
  const cls =
    ball === 'W' ? 'ball-wicket' :
    ball === '6' ? 'ball-six' :
    ball === '4' ? 'ball-four' :
    ball === '2' || ball === '3' ? 'ball-two' :
    ball === '1' ? 'ball-single' :
    ball === '0' ? 'ball-dot' :
    ball === 'Wd' || ball === 'Nb' ? 'ball-wide' :
    'ball-pending';
  return <div className={`ball-chip ${cls}`}>{ball === '0' ? '•' : ball}</div>;
}

export function LiveDot({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const s = size === 'md' ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5';
  return <span className={`${s} rounded-full bg-red-400 animate-pulse-live`} />;
}

export function StatBox({ label, value, color = 'text-cyan-300' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <div className={`stat-value text-lg ${color}`}>{value}</div>
      <div className="stat-label mt-0.5">{label}</div>
    </div>
  );
}
