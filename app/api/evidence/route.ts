import { NextRequest, NextResponse } from 'next/server';
import { getProjectEvidenceForJob, getMultiHopProjectMatches } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId') || 'candidate-001';
    const jobId = searchParams.get('jobId');

    if (jobId) {
      const evidence = await getProjectEvidenceForJob(candidateId, jobId);
      return NextResponse.json({ success: true, data: evidence });
    }

    const multiHop = await getMultiHopProjectMatches(candidateId);
    return NextResponse.json({ success: true, data: multiHop });
  } catch (error: any) {
    console.error('API Error /api/evidence:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Unable to retrieve project evidence multi-hop graph traversal.',
          details: error.message,
        },
      },
      { status: 503 }
    );
  }
}
