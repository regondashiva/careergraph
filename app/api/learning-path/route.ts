import { NextRequest, NextResponse } from 'next/server';
import { getLearningPath } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId') || 'candidate-001';
    const targetJobId = searchParams.get('targetJobId') || 'job-001';

    const learningPath = await getLearningPath(candidateId, targetJobId);
    if (!learningPath) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Job or learning path not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: learningPath });
  } catch (error: any) {
    console.error('API Error /api/learning-path:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Unable to calculate learning prerequisite path graph.',
          details: error.message,
        },
      },
      { status: 503 }
    );
  }
}
