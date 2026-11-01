import { NextResponse } from 'next/server';
import { getParticipants, hasExistingParticipant, saveParticipant } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

function formatLocalTimestamp(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? '';

  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}:${part('second')}`;
}

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

    const nikKtp = String(nik_ktp).trim();
    const phoneNumber = String(no_telp).trim();
    const emailAddress = String(email).trim();
    const phoneDigits = phoneNumber.replace(/\D/g, '');

    if (!/^\d{1,16}$/.test(nikKtp)) {
      return NextResponse.json(
        { success: false, error: 'NIK KTP harus berupa maksimal 16 digit angka.' },
        { status: 400 }
      );
    }

    if (phoneDigits.length < 10 || phoneDigits.length > 13) {
      return NextResponse.json(
        { success: false, error: 'Nomor telepon harus terdiri dari 10 sampai 13 digit.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      return NextResponse.json(
        { success: false, error: 'Format email tidak valid.' },
        { status: 400 }
      );
    }

    const participant = {
      user_id: String(user_id).trim(),
      nama_lengkap: String(nama_lengkap).trim(),
      tempat_lahir: String(tempat_lahir).trim(),
      tanggal_lahir: String(tanggal_lahir).trim(),
      nik_ktp: nikKtp,
      alamat_lengkap: String(alamat_lengkap).trim(),
      no_telp: phoneNumber,
      email: emailAddress,
      timestamp: formatLocalTimestamp(new Date()),
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