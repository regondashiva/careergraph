import { NextRequest, NextResponse } from 'next/server';
import { getGraphDataForEntity } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const centerId = searchParams.get('centerId') || 'candidate-001';
    const entityType = (searchParams.get('entityType') as any) || 'Candidate';

    const graphData = await getGraphDataForEntity(centerId, entityType);
    return NextResponse.json({ success: true, data: graphData });
  } catch (error: any) {
    console.error('API Error /api/graph:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Unable to retrieve visual graph subgraph from CognoDB.',
          details: error.message,
        },
      },
      { status: 503 }
    );
  }
}
