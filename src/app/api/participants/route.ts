import { NextResponse } from 'next/server';
import { getParticipants, hasExistingParticipant, saveParticipant } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const participants = await getParticipants();
    return NextResponse.json(
      {
        success: true,
        data: participants,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Gagal memuat data peserta dari spreadsheet';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      user_id,
      nama_lengkap,
      tempat_lahir,
      tanggal_lahir,
      nik_ktp,
      alamat_lengkap,
      no_telp,
      email,
    } = body;

    // Validasi kelengkapan data di sisi server
    if (
      !user_id ||
      !nama_lengkap ||
      !tempat_lahir ||
      !tanggal_lahir ||
      !nik_ktp ||
      !alamat_lengkap ||
      !no_telp ||
      !email
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Semua field data diri wajib diisi!',
        },
        { status: 400 }
      );
    }

    const participant = {
      user_id: String(user_id).trim(),
      nama_lengkap: String(nama_lengkap).trim(),
      tempat_lahir: String(tempat_lahir).trim(),
      tanggal_lahir: String(tanggal_lahir).trim(),
      nik_ktp: String(nik_ktp).trim(),
      alamat_lengkap: String(alamat_lengkap).trim(),
      no_telp: String(no_telp).trim(),
      email: String(email).trim(),
      timestamp: new Date().toISOString(),
    };

    const duplicateField = await hasExistingParticipant(participant);
    if (duplicateField) {
      const duplicateMessages = {
        nik_ktp: 'NIK KTP sudah terdaftar.',
        no_telp: 'Nomor telepon sudah terdaftar.',
        email: 'Email sudah terdaftar.',
      };

      return NextResponse.json(
        {
          success: false,
          error: `${duplicateMessages[duplicateField]} Peserta tidak dapat mengikuti tes kembali.`,
          duplicateField,
        },
        { status: 409 }
      );
    }

    await saveParticipant(participant);

    return NextResponse.json(
      {
        success: true,
        message: 'Data peserta berhasil disimpan ke spreadsheet',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data peserta ke spreadsheet';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}