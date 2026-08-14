'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCandidate } from '@/lib/context';
import { LearningPathAnalysis, Job } from '@/lib/types';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import {
  GraduationCap,
  CheckCircle2,
  ExternalLink,
  GitBranch,
} from 'lucide-react';

export default function LearningPathPage() {
  const { selectedCandidateId, candidates } = useCandidate();
  const searchParams = useSearchParams();
  const targetJobParam = searchParams.get('targetJobId') || 'job-001';

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [learningPath, setLearningPath] = useState<LearningPathAnalysis | null>(null);
  const [targetJobId, setTargetJobId] = useState<string>(targetJobParam);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);

  const safeCandidates = (candidates || []).filter((c): c is any => Boolean(c && c.id));
  const currentCandidate = safeCandidates.find((c) => c.id === selectedCandidateId) || {
    id: selectedCandidateId,
    name: 'Alex Johnson',
  };

  const fetchLearningPath = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Job list for target selector
      const jobsRes = await fetch('/api/jobs');
      const jobsJson = await jobsRes.json();
      if (jobsJson.success) setAvailableJobs(jobsJson.data || []);

      // 2. Fetch Learning Path Traversal (Skill -> PREREQUISITE_OF -> Skill)
      const pathRes = await fetch(`/api/learning-path?candidateId=${selectedCandidateId}&targetJobId=${targetJobId}`);
      const pathJson = await pathRes.json();
      if (!pathJson.success) throw new Error(pathJson.error?.message || 'Failed to load learning path');
      setLearningPath(pathJson.data);
    } catch (err: any) {
      console.error('Learning path error:', err);
      setError(err.message || 'Unable to connect to CognoDB graph database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningPath();
  }, [selectedCandidateId, targetJobId]);

  if (loading) return <LoadingState message="Traversing skill prerequisite graph on CognoDB..." />;
  if (error || !learningPath) return <ErrorState message={error || 'Learning path not found'} onRetry={fetchLearningPath} />;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            <span>Prerequisite Learning Path</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Graph traversal mapping <code>Skill → PREREQUISITE_OF → Skill → Target Role</code>
          </p>
        </div>

        {/* Target Job Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Goal:</span>
          <select
            value={targetJobId}
            onChange={(e) => setTargetJobId(e.target.value)}
            className="bg-slate-900/80 text-xs font-semibold text-slate-100 px-3.5 py-2 rounded-lg border border-slate-800 focus:outline-none cursor-pointer"
          >
            {availableJobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.companyName || 'Wexa AI'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Goal Banner */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono text-indigo-400 uppercase font-semibold mb-1">
            Selected Career Target
          </div>
          <h2 className="text-xl font-bold text-slate-100">{learningPath.targetJob.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{learningPath.targetJob.description}</p>
        </div>

        <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800/60 text-center shrink-0">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Total Path Steps</div>
          <div className="text-xl font-bold font-mono text-indigo-400">
            {learningPath.pathSteps.length} Steps
          </div>
        </div>
      </div>

      {/* STEP-BY-STEP PREREQUISITE GRAPH CHAIN */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-indigo-400" />
          <span>Prerequisite Progression Chain</span>
        </h2>

        <div className="space-y-4 relative">
          {learningPath.pathSteps.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4 group">
              {/* Connector line */}
              {idx < learningPath.pathSteps.length - 1 && (
                <div className="absolute left-4 top-9 bottom-0 w-0.5 bg-slate-800 group-hover:bg-slate-700 transition-colors" />
              )}

              {/* Step Icon Badge */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border z-10 ${
                  step.status === 'possessed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : step.status === 'target'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {step.status === 'possessed' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span>{step.stepIndex}</span>
                )}
              </div>

              {/* Step Details Box */}
              <div className="flex-1 p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {step.skill.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-100 mt-1">{step.skill.name}</h3>
                  </div>

                  <span
                    className={`text-[11px] font-medium px-2.5 py-0.5 rounded-lg border ${
                      step.status === 'possessed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : step.status === 'target'
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {step.status === 'possessed'
                      ? 'Already Possessed ✓'
                      : step.status === 'target'
                      ? 'Target Required Skill'
                      : 'Missing Prerequisite'}
                  </span>
                </div>

                <p className="text-xs text-slate-400">{step.skill.description}</p>

                {/* Recommended Courses for this step */}
                {step.recommendedCourses && step.recommendedCourses.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="text-[11px] font-medium text-slate-400">
                      Recommended Course to Master This Skill:
                    </div>
                    {step.recommendedCourses.map((crs) => (
                      <div
                        key={crs.id}
                        className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-indigo-300">{crs.title}</div>
                          <div className="text-[10px] text-slate-400">
                            {crs.platform} • {crs.durationHours} Hours
                          </div>
                        </div>
                        <a
                          href={crs.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-medium text-xs transition-all flex items-center gap-1 border border-indigo-500/30"
                        >
                          <span>Explore</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
