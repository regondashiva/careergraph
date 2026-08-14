import { NextRequest, NextResponse } from 'next/server';
import { getSkillGapAnalysis, getTopMissingSkillsAcrossJobs } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId') || 'candidate-001';
    const jobId = searchParams.get('jobId');

    if (jobId) {
      const gapAnalysis = await getSkillGapAnalysis(candidateId, jobId);
      if (!gapAnalysis) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Job not found for gap analysis.' } },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: gapAnalysis });
    }

    const topMissing = await getTopMissingSkillsAcrossJobs(candidateId);
    return NextResponse.json({ success: true, data: topMissing });
  } catch (error: any) {
    console.error('API Error /api/skill-gaps:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Unable to analyze skill gaps from CognoDB.',
          details: error.message,
        },
      },
      { status: 503 }
    );
  }
}
