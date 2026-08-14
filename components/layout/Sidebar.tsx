'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Layers,
  Network,
  GraduationCap,
  Sparkles,
  GitGraph,
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Job Explorer', href: '/jobs', icon: Briefcase },
  { name: 'Skill Analysis', href: '/skills', icon: Layers },
  { name: 'Graph Explorer', href: '/graph', icon: Network },
  { name: 'Learning Paths', href: '/learning', icon: GraduationCap },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0e1422] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-indigo-400">
          <GitGraph className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-1.5">
            CareerGraph
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Bolt
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">CognoDB Engine</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Graph Discovery
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Info */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#090d16]/60">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <div className="text-slate-300 font-medium text-[11px]">Graph Database</div>
            <div className="text-slate-500 text-[10px]">openCypher Enabled</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
