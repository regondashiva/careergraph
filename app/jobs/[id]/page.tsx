'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useCandidate } from '@/lib/context';
import { Job, Company, Skill, ProjectEvidence, SkillGapAnalysis } from '@/lib/types';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import {
  Briefcase,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  FolderGit2,
  GraduationCap,
  ArrowLeft,
  Sparkles,
  GitMerge,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const { selectedCandidateId, candidates } = useCandidate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [jobDetail, setJobDetail] = useState<{ job: Job; company: Company | null; requiredSkills: any[] } | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [projectEvidence, setProjectEvidence] = useState<ProjectEvidence[]>([]);

  const safeCandidates = (candidates || []).filter((c): c is any => Boolean(c && c.id));
  const currentCandidate = safeCandidates.find((c) => c.id === selectedCandidateId) || {
    id: selectedCandidateId,
    name: 'Alex Johnson',
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Job Base Info
      const jRes = await fetch(`/api/jobs/${jobId}`);
      const jJson = await jRes.json();
      if (!jJson.success) throw new Error(jJson.error?.message || 'Job not found');
      setJobDetail(jJson.data);

      // 2. Fetch Skill Gap Analysis
      const gapRes = await fetch(`/api/skill-gaps?candidateId=${selectedCandidateId}&jobId=${jobId}`);
      const gapJson = await gapRes.json();
      if (gapJson.success) setGapAnalysis(gapJson.data);

      // 3. Fetch Multi-Hop Project Evidence (Candidate -> BUILT -> Project -> USES_SKILL -> Skill <- REQUIRES - Job)
      const evRes = await fetch(`/api/evidence?candidateId=${selectedCandidateId}&jobId=${jobId}`);
      const evJson = await evRes.json();
      if (evJson.success) setProjectEvidence(evJson.data || []);
    } catch (err: any) {
      console.error('Error loading job detail page:', err);
      setError(err.message || 'Unable to retrieve graph job matching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [jobId, selectedCandidateId]);

  if (loading) return <LoadingState message="Performing multi-hop graph match query on CognoDB..." />;
  if (error || !jobDetail) return <ErrorState message={error || 'Job not found'} onRetry={loadData} />;

  const { job, company } = jobDetail;
  const matchPct = gapAnalysis?.matchPercentage || 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans">
      {/* Back Navigation */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Job Explorer</span>
      </Link>

      {/* Main Header Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {job.employmentType} • {job.experienceLevel} Level
            </span>
            {job.remote && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Remote Eligible
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">{job.title}</h1>

          <div className="text-xs text-slate-300 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <Building2 className="w-4 h-4 text-slate-400" />
              {company?.name || 'Wexa AI'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-4 h-4 text-slate-400" />
              {job.location}
            </span>
            <span>•</span>
            <span className="font-mono text-emerald-400 font-bold">
              ₹{(job.salaryMin / 100000).toFixed(1)}L - {(job.salaryMax / 100000).toFixed(1)}L / year
            </span>
          </div>
        </div>

        {/* Match Percentage Score Box */}
        <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center shrink-0 min-w-[180px]">
          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">
            Match Score
          </div>
          <div
            className={`text-4xl font-bold font-mono ${
              matchPct >= 80 ? 'text-emerald-400' : matchPct >= 60 ? 'text-indigo-400' : 'text-amber-400'
            }`}
          >
            {matchPct}%
          </div>
          <div className="text-xs font-medium text-slate-300 mt-1">
            {matchPct >= 80 ? 'Excellent Fit' : matchPct >= 60 ? 'Strong Potential' : 'Gap Action Plan Needed'}
          </div>
        </div>
      </div>

      {/* Grid: Matching Skills & Missing Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matching Skills Card */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Matching Graph Skills ({gapAnalysis?.matchedSkills.length || 0})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Skills connected to {currentCandidate.name} that satisfy role requirements:
          </p>

          <div className="space-y-2">
            {gapAnalysis?.matchedSkills.map((sk) => (
              <div
                key={sk.id}
                className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{sk.name}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {sk.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Skills Card */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-amber-400" />
            <span>Missing Target Skills ({gapAnalysis?.missingSkills.length || 0})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Skill nodes required by job but not currently linked to candidate profile:
          </p>

          <div className="space-y-2">
            {gapAnalysis?.missingSkills.map((item) => (
              <div
                key={item.skill.id}
                className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 font-medium text-amber-300">
                    <span>⚠</span>
                    <span>{item.skill.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Importance: <span className="text-amber-400 font-medium">{item.importance}</span>
                  </div>
                </div>
                <Link
                  href={`/learning?targetJobId=${jobId}`}
                  className="text-[11px] font-medium text-indigo-400 hover:underline"
                >
                  View Course →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY YOU'RE A MATCH: Multi-Hop Project Evidence */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Graph Proof Traversal</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-indigo-400" />
            <span>Why You're a Match: Project Portfolio Evidence</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing the 3-hop traversal: <code>Candidate → BUILT → Project → USES_SKILL → Skill ← REQUIRES - Job</code>
          </p>
        </div>

        {projectEvidence.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/60">
            No projects linked to candidate demonstrating skills for this job.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {projectEvidence.map((ev) => (
              <div
                key={ev.project.id}
                className="p-5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-slate-400" />
                    <span>{ev.project.name}</span>
                  </h3>
                  <a
                    href={ev.project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Code</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{ev.project.description}</p>

                {/* Graph Chain representation */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 text-[11px] font-mono space-y-1.5">
                  <div className="text-slate-400">Demonstrates required job skills:</div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ev.demonstratedSkills.map((sk) => (
                      <span
                        key={sk.id}
                        className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium"
                      >
                        {ev.project.name} → {sk.name} → {job.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECOMMENDED LEARNING: Courses for Missing Skills */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-400" />
          <span>Recommended Courses to Close Skill Gaps</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gapAnalysis?.missingSkills.map((gapItem) =>
            gapItem.teachingCourses.map((course) => (
              <div
                key={course.id}
                className="p-5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {course.platform}
                    </span>
                    <span className="text-xs text-slate-400">{course.durationHours} Hours</span>
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm">{course.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-amber-400 font-medium">
                    Teaches Missing Skill: {gapItem.skill.name}
                  </span>
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Enroll</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
