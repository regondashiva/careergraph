'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCandidate } from '@/lib/context';
import { JobMatchResult } from '@/lib/types';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Briefcase,
  FolderGit2,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  GitMerge,
  ChevronRight,
  Building2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { selectedCandidateId, candidates } = useCandidate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({
    skillCount: 0,
    projectCount: 0,
    matchingJobCount: 0,
    skillGapCount: 0,
  });

  const [topMatches, setTopMatches] = useState<JobMatchResult[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);

  const safeCandidates = (candidates || []).filter((c): c is any => Boolean(c && c.id));
  const currentCandidate = safeCandidates.find((c) => c.id === selectedCandidateId) || {
    id: selectedCandidateId,
    name: 'Alex Johnson',
    headline: 'Full Stack & AI Engineer',
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Candidate Metrics
      const candRes = await fetch(`/api/candidates/${selectedCandidateId}`);
      const candJson = await candRes.json();

      if (!candJson.success) {
        throw new Error(candJson.error?.message || 'Failed to fetch candidate details');
      }

      // 2. Fetch Job Match Recommendations
      const matchRes = await fetch(`/api/match?candidateId=${selectedCandidateId}`);
      const matchJson = await matchRes.json();

      if (!matchJson.success) {
        throw new Error(matchJson.error?.message || 'Failed to calculate job recommendations');
      }

      const matches: JobMatchResult[] = matchJson.data || [];
      setTopMatches(matches.slice(0, 4));

      // 3. Fetch Skill Gap Summary
      const gapRes = await fetch(`/api/skill-gaps?candidateId=${selectedCandidateId}`);
      const gapJson = await gapRes.json();

      const gaps = gapJson.success ? gapJson.data : [];
      const missingSkillNames = gaps.map((g: any) => g.skill?.name || g.name).filter(Boolean);
      setMissingSkills(missingSkillNames.slice(0, 6));

      // 4. Fetch Multi-hop Project Evidence
      const evRes = await fetch(`/api/evidence?candidateId=${selectedCandidateId}`);
      const evJson = await evRes.json();
      const evidenceData = evJson.success ? evJson.data : [];
      setEvidenceList(evidenceData.slice(0, 3));

      // Update Metric Counters
      setMetrics({
        skillCount: candJson.data?.metrics?.skillCount || 0,
        projectCount: candJson.data?.metrics?.projectCount || 0,
        matchingJobCount: matches.length,
        skillGapCount: missingSkillNames.length,
      });
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Unable to connect to CognoDB graph service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedCandidateId]);

  if (loading) return <LoadingState message="Traversing graph database for candidate dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboardData} />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Welcome Hero Card */}
      <Card className="border-slate-800 bg-gradient-to-r from-slate-900 via-[#111827] to-[#0f172a] shadow-xl relative overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Badge variant="default" className="mb-3 gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>CognoDB Graph Recommendation Engine</span>
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">
                Welcome back, {currentCandidate.name}!
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Explore your connected career network across skills, projects, open positions at top tech companies, and targeted learning paths.
              </p>
            </div>
            <Link href="/graph">
              <Button size="lg" className="gap-2 shadow-md">
                <GitMerge className="w-4 h-4" />
                <span>Launch Graph Explorer</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Skills</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Brain className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100">{metrics.skillCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Verified in CognoDB</div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100">{metrics.projectCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Portfolio Evidence</div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Matching Jobs</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100">{metrics.matchingJobCount}</div>
            <div className="text-[11px] text-emerald-400 mt-1 font-medium">Graph Traversal</div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Skill Gaps</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100">{metrics.skillGapCount}</div>
            <div className="text-[11px] text-amber-400 mt-1 font-medium">Missing Requirements</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Top Job Matches & Skill Gap Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Job Matches Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Top Recommended Jobs</span>
            </h2>
            <Link href="/jobs" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {topMatches.map((m) => (
              <Card key={m.job.id} className="hover:border-slate-700">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-base text-slate-100">{m.job.title}</h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {m.job.employmentType}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {m.company?.name || 'Wexa AI'}
                      </span>
                      <span>•</span>
                      <span>{m.job.location}</span>
                    </div>

                    {/* Skills tags preview */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.matchedSkills.map((sk: string) => (
                        <Badge key={sk} variant="success" className="text-[10px] gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {sk}
                        </Badge>
                      ))}
                      {m.missingSkills.map((sk: string) => (
                        <Badge key={sk} variant="secondary" className="text-[10px] text-slate-400 gap-1">
                          <XCircle className="w-2.5 h-2.5 text-amber-400" />
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Match Score Badge & Button */}
                  <div className="flex sm:flex-col items-center justify-between sm:items-end gap-2 shrink-0">
                    <Badge
                      variant={m.matchPercentage >= 80 ? 'success' : m.matchPercentage >= 60 ? 'default' : 'warning'}
                      className="px-3 py-1 text-sm font-mono font-bold"
                    >
                      {m.matchPercentage}% Match
                    </Badge>

                    <Link href={`/jobs/${m.job.id}`}>
                      <Button variant="secondary" size="sm" className="gap-1">
                        <span>Analyze</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Skill Gap Summary Column */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Target Skill Gaps</span>
          </h2>

          <Card>
            <CardContent className="p-5 space-y-4">
              <CardDescription>
                Skills requested across open roles that you haven't connected yet:
              </CardDescription>

              <div className="space-y-2">
                {missingSkills.map((skillName) => (
                  <div
                    key={skillName}
                    className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>{skillName}</span>
                    </div>
                    <Link
                      href={`/learning?targetSkill=${encodeURIComponent(skillName)}`}
                      className="text-[11px] font-medium text-indigo-400 hover:underline"
                    >
                      Find Course →
                    </Link>
                  </div>
                ))}
              </div>

              <Link href="/skills" className="block w-full">
                <Button variant="secondary" className="w-full text-xs justify-center gap-2">
                  <span>View Detailed Skill Matrix</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Multi-Hop Project Evidence Highlight Section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-indigo-400" />
                <span>Multi-Hop Traversal: Candidate → Project → Skill → Job</span>
              </CardTitle>
              <CardDescription className="mt-1">
                3-hop graph proof demonstrating how your portfolio projects justify job requirements.
              </CardDescription>
            </div>
            <Link href="/graph" className="text-xs font-medium text-indigo-400 hover:underline shrink-0">
              Explore in Graph Visualizer →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {evidenceList.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-indigo-300">{item.jobTitle}</span>
                  <Badge variant="default" className="text-[10px] font-mono">
                    {item.matchedSkillsCount} Skills
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400">Demonstrated via:</div>
                  <div className="text-xs font-medium text-slate-200">
                    {(item.demonstratedProjects || ['AI Resume Screening']).join(', ')}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {(item.demonstratedSkills || []).map((sk: string) => (
                    <Badge key={sk} variant="secondary" className="text-[10px]">
                      ✓ {sk}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
