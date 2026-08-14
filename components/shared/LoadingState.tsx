'use client';

import React from 'react';

export default function LoadingState({ message = 'Loading graph data from CognoDB...' }: { message?: string }) {
  return (
    <div className="p-8 space-y-6 animate-pulse max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800" />
        <div className="space-y-2">
          <div className="h-5 w-48 bg-slate-800 rounded" />
          <div className="h-3 w-32 bg-slate-800/60 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 space-y-3">
            <div className="h-4 w-20 bg-slate-800 rounded" />
            <div className="h-8 w-14 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      <div className="h-64 rounded-2xl bg-slate-900/80 border border-slate-800/80 p-6" />

      <div className="text-center text-xs text-slate-500 font-mono pt-4">{message}</div>
    </div>
  );
}
