import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a1628] text-slate-200 relative">
      {/* Ambient grid background */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
      {/* Ambient glow spots */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[300px] bg-purple-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <Navbar />
      <main className="flex-1 relative z-10 pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
