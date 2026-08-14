'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useCandidate } from '@/lib/context';
import { JobMatchResult } from '@/lib/types';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Search,
  Filter,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from 'lucide-react';

export default function JobsPage() {
  const { selectedCandidateId } = useCandidate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobMatchResult[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expFilter, setExpFilter] = useState<string>('All');
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/match?candidateId=${selectedCandidateId}`);
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to load job recommendations');
      }
      setJobs(json.data || []);
    } catch (err: any) {
      console.error('Job explorer fetch error:', err);
      setError(err.message || 'Unable to connect to CognoDB graph database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedCandidateId]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((item) => {
      const titleMatch =
        item.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.company?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.job.location.toLowerCase().includes(searchQuery.toLowerCase());

      const expMatch = expFilter === 'All' || item.job.experienceLevel === expFilter;
      const remoteMatch = !remoteOnly || item.job.remote;

      return titleMatch && expMatch && remoteMatch;
    });
  }, [jobs, searchQuery, expFilter, remoteOnly]);

  if (loading) return <LoadingState message="Calculating candidate graph job matches from CognoDB..." />;
  if (error) return <ErrorState message={error} onRetry={fetchJobs} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            <span>Graph Job Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Jobs dynamically matched against candidate graph skills and project portfolio evidence.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search title, company, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={expFilter}
                onChange={(e) => setExpFilter(e.target.value)}
                className="bg-slate-950/60 text-xs text-slate-200 font-medium px-3 py-2 rounded-lg border border-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Experience Levels</option>
                <option value="Entry">Entry Level</option>
                <option value="Mid">Mid Level</option>
                <option value="Senior">Senior Level</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span>Remote Only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Job Cards Grid */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          title="No jobs match your filters"
          description="Try adjusting search query or clearing experience level filters."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setExpFilter('All');
            setRemoteOnly(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((m) => (
            <Card key={m.job.id} className="flex flex-col justify-between group hover:border-slate-700">
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <Badge variant="default" className="text-[10px] font-mono">
                        {m.job.experienceLevel} Level
                      </Badge>
                      <h3 className="font-bold text-base text-slate-100 mt-1.5 group-hover:text-indigo-300 transition-colors">
                        {m.job.title}
                      </h3>
                    </div>

                    {/* Match score badge */}
                    <Badge
                      variant={m.matchPercentage >= 80 ? 'success' : m.matchPercentage >= 60 ? 'default' : 'warning'}
                      className="px-3 py-1 font-mono font-bold text-sm"
                    >
                      {m.matchPercentage}% Match
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mb-3">
                    <span className="flex items-center gap-1 font-medium text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {m.company?.name || 'Wexa AI'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {m.job.location} {m.job.remote && '(Remote)'}
                    </span>
                    <span>•</span>
                    <span>₹{(m.job.salaryMin / 100000).toFixed(1)}L - {(m.job.salaryMax / 100000).toFixed(1)}L</span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {m.job.description}
                  </p>

                  {/* Skill Match Tags */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-medium text-slate-400">Required Skills Graph Comparison:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.matchedSkills.map((sk: string) => (
                        <Badge key={sk} variant="success" className="text-[10px] gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {sk}
                        </Badge>
                      ))}
                      {m.missingSkills.map((sk) => (
                        <Badge key={sk} variant="secondary" className="text-[10px] text-slate-400 gap-1">
                          <XCircle className="w-3 h-3 text-amber-400" />
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {m.matchedCount} of {m.totalRequiredCount} required skills matched
                  </span>
                  <Link href={`/jobs/${m.job.id}`}>
                    <Button size="sm" className="gap-1.5">
                      <span>View Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
