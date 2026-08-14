import { NextRequest, NextResponse } from 'next/server';
import { getJobById } from '@/lib/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobData = await getJobById(id);

    if (!jobData) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: `Job with ID '${id}' not found.` },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: jobData });
  } catch (error: any) {
    console.error('API Error /api/jobs/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Failed to fetch job details from CognoDB.',
          details: error.message,
        },
      },
      { status: 503 }
    );
  }
}
