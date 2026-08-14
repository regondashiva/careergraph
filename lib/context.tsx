'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Candidate } from '@/lib/types';

interface CandidateContextType {
  selectedCandidateId: string;
  setSelectedCandidateId: (id: string) => void;
  candidates: Candidate[];
  loadingCandidates: boolean;
}

const CandidateContext = createContext<CandidateContextType>({
  selectedCandidateId: 'candidate-001',
  setSelectedCandidateId: () => {},
  candidates: [],
  loadingCandidates: false,
});

export const CandidateProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('candidate-001');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(true);

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const res = await fetch('/api/candidates');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setCandidates(json.data);
        }
      } catch (err) {
        console.error('Failed to load candidate list:', err);
      } finally {
        setLoadingCandidates(false);
      }
    }
    fetchCandidates();
  }, []);

  return (
    <CandidateContext.Provider
      value={{
        selectedCandidateId,
        setSelectedCandidateId,
        candidates,
        loadingCandidates,
      }}
    >
      {children}
    </CandidateContext.Provider>
  );
};

export const useCandidate = () => useContext(CandidateContext);
