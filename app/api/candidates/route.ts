import { NextResponse } from 'next/server';
import { getCandidates } from '@/lib/queries';

export async function GET() {
  try {
    const candidates = await getCandidates();
    return NextResponse.json({ success: true, data: candidates });
  } catch (error: any) {
    console.error('API Error /api/candidates:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Unable to connect to CognoDB graph database.',
          details: error.message,
        },
      },
      { status: 503 }
    );
  }
}
