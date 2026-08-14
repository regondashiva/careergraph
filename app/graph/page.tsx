'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useCandidate } from '@/lib/context';
import { GraphData } from '@/lib/types';
import InteractiveGraph from '@/components/graph/InteractiveGraph';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { Network, Code } from 'lucide-react';

export default function GraphExplorerPage() {
  const { selectedCandidateId } = useCandidate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [centerId, setCenterId] = useState<string>(selectedCandidateId);
  const [entityType, setEntityType] = useState<'Candidate' | 'Job' | 'Skill' | 'Company' | 'All'>('Candidate');

  const fetchGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/graph?centerId=${centerId}&entityType=${entityType}`);
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to fetch graph data');
      }
      setGraphData(json.data || { nodes: [], edges: [] });
    } catch (err: any) {
      console.error('Graph fetch error:', err);
      setError(err.message || 'Unable to query CognoDB graph');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCenterId(selectedCandidateId);
    setEntityType('Candidate');
  }, [selectedCandidateId]);

  useEffect(() => {
    fetchGraph();
  }, [centerId, entityType]);

  if (loading) return <LoadingState message="Querying CognoDB openCypher graph neighborhood..." />;
  if (error) return <ErrorState message={error} onRetry={fetchGraph} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Network className="w-6 h-6 text-indigo-400" />
            <span>Interactive Graph Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing direct nodes & multi-hop directional relationships powered by CognoDB openCypher.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as any)}
            className="bg-slate-900/80 text-xs font-semibold text-slate-200 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="Candidate">Candidate Subgraph</option>
            <option value="Job">Job Requirements Subgraph</option>
            <option value="Skill">Skill Neighborhood Subgraph</option>
            <option value="All">Complete Graph Sample</option>
          </select>
        </div>
      </div>

      {/* Main Interactive Canvas Visualizer */}
      <InteractiveGraph data={graphData} />

      {/* Query Details Box */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-xs flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-400" />
            <span>Executed openCypher Traversal Query</span>
          </h3>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {graphData.queryMetadata?.hopCount || 3}-Hop Traversal
          </span>
        </div>

        <pre className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {graphData.queryMetadata?.cypherQuery || `MATCH path = (c:Candidate {id: '${centerId}'})-[*1..3]-(m)\nRETURN nodes(path), relationships(path);`}
        </pre>

        <p className="text-xs text-slate-400">
          {graphData.queryMetadata?.description || 'Sub-graph showing candidate skills, projects, and target job connections.'}
        </p>
      </div>
    </div>
  );
}
