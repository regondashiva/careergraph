import { NextRequest, NextResponse } from 'next/server';
import { getJobRecommendations } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId') || 'candidate-001';

    const matches = await getJobRecommendations(candidateId);
    return NextResponse.json({ success: true, data: matches });
  } catch (error: any) {
    console.error('API Error /api/match:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Unable to calculate graph match scores.',
          details: error.message,
        },
      },
      { status: 503 }
    );
  }
}
