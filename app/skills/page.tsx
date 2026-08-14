'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCandidate } from '@/lib/context';
import { CandidateSkillItem, Skill } from '@/lib/types';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import {
  Layers,
  Brain,
  TrendingUp,
  Briefcase,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export default function SkillsPage() {
  const { selectedCandidateId, candidates } = useCandidate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [skillsList, setSkillsList] = useState<CandidateSkillItem[]>([]);
  const [topMissingSkills, setTopMissingSkills] = useState<{ skill: Skill; demandingJobsCount: number; sampleJobTitles: string[] }[]>([]);

  const safeCandidates = (candidates || []).filter((c): c is any => Boolean(c && c.id));
  const currentCandidate = safeCandidates.find((c) => c.id === selectedCandidateId) || {
    id: selectedCandidateId,
    name: 'Alex Johnson',
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Candidate Profile & Skills
      const cRes = await fetch(`/api/candidates/${selectedCandidateId}`);
      const cJson = await cRes.json();
      if (!cJson.success) throw new Error(cJson.error?.message || 'Failed to load skills');
      setSkillsList(cJson.data.skills || []);

      // 2. Fetch Top Missing Skills Across All Market Jobs
      const gapRes = await fetch(`/api/skill-gaps?candidateId=${selectedCandidateId}`);
      const gapJson = await gapRes.json();
      if (gapJson.success) setTopMissingSkills(gapJson.data || []);
    } catch (err: any) {
      console.error('Skill page error:', err);
      setError(err.message || 'Unable to connect to CognoDB graph database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCandidateId]);

  if (loading) return <LoadingState message="Fetching candidate skill matrix from CognoDB..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-indigo-400" />
          <span>Skill Analysis & Inventory</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Graph representation of possessed skills vs market job demand in CognoDB.
        </p>
      </div>

      {/* Grid: Candidate Skill Inventory & Top Missing Market Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidate Possessed Skills */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>{currentCandidate.name}'s Verified Skills ({skillsList.length})</span>
            </h2>
            <span className="text-xs font-mono text-indigo-400">CognoDB Graph</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skillsList.map((item) => (
              <div
                key={item.skill.id}
                className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {item.skill.name}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {item.skill.category}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60 font-mono">
                  <span>Level: <span className="text-slate-200 font-semibold">{item.relationship.level}</span></span>
                  <span>{item.relationship.years} Yrs Exp</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Missing Market Skills Across Jobs */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Top Missing Market Skills Across Jobs</span>
            </h2>
            <span className="text-xs font-mono text-amber-400">High Demand</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Skills frequently required by active job roles that {currentCandidate.name} does not yet have connected:
          </p>

          <div className="space-y-3">
            {topMissingSkills.map((item) => (
              <div
                key={item.skill.id}
                className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-bold text-slate-100 text-sm">{item.skill.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                      {item.skill.category}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {item.demandingJobsCount} Jobs Request This
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Required by: {(item.sampleJobTitles || []).join(', ')}</span>
                </div>

                <div className="pt-1 flex justify-end">
                  <Link
                    href={`/learning?targetSkill=${encodeURIComponent(item.skill.name)}`}
                    className="text-xs font-medium text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Recommend Learning Courses</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
