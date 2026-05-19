import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-amber-400/60 mx-auto mb-4" />
        <h1 className="text-4xl font-extrabold font-[Outfit] text-gradient-cyan mb-2">404</h1>
        <p className="text-sm text-slate-500 mb-6">This page doesn't exist in the arena.</p>
        <Link to="/" className="ctrl-btn ctrl-btn-primary inline-flex">
          <Home className="h-4 w-4" /> Back to Arena
        </Link>
      </div>
    </div>
  );
}
