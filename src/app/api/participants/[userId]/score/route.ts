import { NextResponse } from 'next/server';
import { getParticipantFinalScore } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const final_score = await getParticipantFinalScore(decodeURIComponent(userId));

    return NextResponse.json(
      { success: true, data: { final_score } },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Gagal memuat nilai peserta';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
