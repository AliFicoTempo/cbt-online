import { NextResponse } from 'next/server';
import { saveParticipantAnswers } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, answers } = body;

    if (!user_id || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data jawaban tidak valid atau kosong!',
        },
        { status: 400 }
      );
    }

    await saveParticipantAnswers(user_id, answers);

    return NextResponse.json(
      {
        success: true,
        message: 'Jawaban peserta berhasil disimpan ke spreadsheet',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan jawaban peserta ke spreadsheet';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}