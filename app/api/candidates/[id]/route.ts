import { NextRequest, NextResponse } from 'next/server';
import { getCandidateOverview, getCandidateSkills, getCandidateProjects } from '@/lib/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const overview = await getCandidateOverview(id);

    if (!overview) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: `Candidate with ID '${id}' not found.` },
        },
        { status: 404 }
      );
    }

    const skills = await getCandidateSkills(id);
    const projects = await getCandidateProjects(id);

    return NextResponse.json({
      success: true,
      data: {
        candidate: overview.candidate,
        metrics: {
          skillCount: overview.skillCount,
          projectCount: overview.projectCount,
          completedCourseCount: overview.completedCourseCount,
        },
        skills,
        projects,
      },
    });
  } catch (error: any) {
    console.error('API Error /api/candidates/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Failed to retrieve candidate profile from CognoDB.',
          details: error.message,
        },
      },
      { status: 503 }
    );
  }
}
