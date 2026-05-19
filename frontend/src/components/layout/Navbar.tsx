import { Link, useLocation } from 'react-router-dom';
import { Activity, Flame, BarChart3, Trophy, Zap, User, Radio, Sparkles, Gamepad2 } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Arena', icon: Activity },
  { to: '/match/live', label: 'Live', icon: Flame, pulse: true },
  { to: '/predict', label: 'Predict', icon: BarChart3 },
  { to: '/leaderboards', label: 'Ranks', icon: Trophy },
  { to: '/rewards', label: 'Rewards', icon: Sparkles },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <>
      {/* Desktop Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-[rgba(56,189,248,0.08)] bg-[rgba(10,22,40,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4">
          {/* Left: Brand + Live Room */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
                <Gamepad2 className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="text-base font-extrabold font-[Outfit] text-gradient-cyan hidden sm:inline">
                CricketVerse AI
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-2 ml-2">
              <span className="badge-live badge-live-red">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse-live" />
                Live Room
              </span>
              <span className="badge-live badge-live-cyan">
                <Radio className="h-3 w-3" />
                PulsePlay Arena
              </span>
            </div>
          </div>

          {/* Center: Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon, pulse }) => {
              const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
              return (
                <Link
                  key={to + label}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${pulse && isActive ? 'animate-pulse-live' : ''}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: XP + Profile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(15,32,53,0.7)] border border-[rgba(56,189,248,0.1)]">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-bold font-mono text-yellow-300">500 XP</span>
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors border border-white/[0.06]">
              <User className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[rgba(56,189,248,0.08)] bg-[rgba(10,22,40,0.95)] backdrop-blur-xl md:hidden">
        {navLinks.map(({ to, label, icon: Icon, pulse }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={label}
              to={to}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${
                isActive ? 'text-cyan-300 bg-cyan-500/8' : 'text-slate-500'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${pulse && isActive ? 'animate-pulse-live' : ''}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
