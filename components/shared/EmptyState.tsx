'use client';

import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = 'No graph items found',
  description = 'Try selecting another candidate, clearing filters, or exploring different career nodes.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 my-6">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400">
        <SearchX className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
