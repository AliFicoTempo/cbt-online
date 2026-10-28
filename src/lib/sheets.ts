import { google } from 'googleapis';
import { Question, Answer, Participant } from '@/types';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

function getAuthClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const key = rawKey.replace(/\\n/g, '\n');

  if (!email || !rawKey || !SPREADSHEET_ID) {
    throw new Error('Konfigurasi environment Google Sheets belum lengkap di .env.local');
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function getQuestionsAndAnswers(): Promise<{ questions: Question[]; answers: Answer[] }> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const [qRes, aRes] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'db_question!A2:D',
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'db_answer!A2:E',
    }),
  ]);

  const questions: Question[] = (qRes.data.values || []).map((row) => ({
    question_id: (row[0] || '').toString().trim(),
    question_type: (row[1] || 'Single Question Choice').toString().trim(),
    question_text: (row[2] || '').toString().trim(),
    question_image_url: (row[3] || '').toString().trim(),
  })).filter((q) => q.question_id !== '');

  const answers: Answer[] = (aRes.data.values || []).map((row) => ({
    question_id: (row[0] || '').toString().trim(),
    answer_id: (row[1] || '').toString().trim(),
    answer_text: (row[2] || '').toString().trim(),
    answer_image_url: (row[3] || '').toString().trim(),
    is_true: (row[4] || 'FALSE').toString().trim(),
  })).filter((a) => a.answer_id !== '');

  return { questions, answers };
}

export async function getParticipants(): Promise<Participant[]> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'db_peserta!A2:K',
  });

  return (res.data.values || []).map((row) => ({
    user_id: (row[0] || '').toString().trim(),
    nama_lengkap: (row[1] || '').toString().trim(),
    tempat_lahir: (row[2] || '').toString().trim(),
    tanggal_lahir: (row[3] || '').toString().trim(),
    nik_ktp: (row[4] || '').toString().trim(),
    alamat_lengkap: (row[5] || '').toString().trim(),
    no_telp: (row[6] || '').toString().trim(),
    email: (row[7] || '').toString().trim(),
    final_score: row[8] && row[8].toString().trim() !== '' ? row[8].toString().trim() : '-',
    status_test: row[9] && row[9].toString().trim() !== '' ? row[9].toString().trim() : '-',
    result_pdf: row[10] && row[10].toString().trim() !== '' ? row[10].toString().trim() : '-',
  })).filter((p) => p.user_id !== '');
}

export async function saveParticipant(data: {
  user_id: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  nik_ktp: string;
  alamat_lengkap: string;
  no_telp: string;
  email: string;
}): Promise<void> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'db_peserta!A:H',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        data.user_id,
        data.nama_lengkap,
        data.tempat_lahir,
        data.tanggal_lahir,
        data.nik_ktp,
        data.alamat_lengkap,
        data.no_telp,
        data.email,
      ]],
    },
  });
}

export async function saveParticipantAnswers(
  user_id: string,
  answers: { question_id: string; answer_id: string }[]
): Promise<void> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const rows = answers.map((a) => [user_id, a.question_id, a.answer_id]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'db_jawaban_peserta!A:C',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows,
    },
  });
}