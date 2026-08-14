'use client';

import React from 'react';
import { Database, AlertTriangle, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Unable to connect to CareerGraph',
  message = 'The CognoDB graph database service is currently unreachable via Bolt protocol or credentials require configuration.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-2xl backdrop-blur-xl text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-slate-100 mb-2">{title}</h2>
      <p className="text-sm text-slate-300 mb-6 leading-relaxed">{message}</p>

      <div className="bg-slate-950/80 p-4 rounded-xl text-left border border-slate-800 text-xs font-mono mb-6 space-y-2 text-slate-300">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2 font-semibold">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" /> CognoDB Environment Diagnostic
          </span>
          <span className="text-amber-400 text-[10px] uppercase font-bold">Action Required</span>
        </div>
        <div>
          <span className="text-slate-400">URI:</span> <span className="text-indigo-300">bolt://localhost:7687</span>
        </div>
        <div>
          <span className="text-slate-400">Username:</span> <span className="text-indigo-300">cognodb</span>
        </div>
        <div className="pt-2 text-emerald-400 text-[11px]">
          💡 Run seed command: <code className="bg-slate-900 px-2 py-0.5 rounded text-amber-300">npm run seed</code>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all glow-primary cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}
