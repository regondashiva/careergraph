'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCandidate } from '@/lib/context';
import { Database, ChevronDown, Check, UserCheck } from 'lucide-react';

export default function TopNav() {
  const { selectedCandidateId, setSelectedCandidateId, candidates } = useCandidate();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const safeCandidates = (candidates || []).filter((c): c is any => Boolean(c && c.id));

  const currentCandidate = safeCandidates.find((c) => c.id === selectedCandidateId) || {
    id: 'candidate-001',
    name: 'Alex Johnson',
    headline: 'Full Stack & AI Engineer',
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-[#0e1422] border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Database Connection Status Pill */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800/80 rounded-lg text-xs font-mono text-slate-300">
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">CognoDB Bolt:</span>
          <span className="text-emerald-400 font-semibold">Online</span>
        </div>
      </div>

      {/* Custom Candidate Profile Selector Dropdown */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:inline">
          Active Candidate:
        </span>

        <div className="relative" ref={dropdownRef}>
          {/* Profile Trigger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 transition-all cursor-pointer shadow-sm group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
              {currentCandidate.name ? currentCandidate.name[0] : 'A'}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 leading-tight">
                <span>{currentCandidate.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
              <div className="text-[11px] font-medium text-slate-300 leading-tight mt-0.5 max-w-[180px] truncate">
                {currentCandidate.headline}
              </div>
            </div>
          </button>

          {/* Custom Styled Glassmorphism Menu Popup */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                <span>Switch Candidate Profile</span>
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              </div>

              <div className="space-y-1 max-h-72 overflow-y-auto">
                {safeCandidates.map((c) => {
                  const isSelected = c.id === selectedCandidateId;

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCandidateId(c.id);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/15 text-indigo-200 font-semibold border border-indigo-500/30'
                          : 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                        }`}>
                          {c.name ? c.name[0] : 'C'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-100 truncate">{c.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{c.headline}</div>
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
