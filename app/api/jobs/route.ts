import { NextResponse } from 'next/server';
import { getAllJobs } from '@/lib/queries';

export async function GET() {
  try {
    const jobs = await getAllJobs();
    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    console.error('API Error /api/jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Unable to fetch jobs from CognoDB.',
          details: error.message,
        },
      },
      { status: 503 }
    );
  }
}
