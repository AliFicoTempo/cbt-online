'use client';

import React, { useState } from 'react';
import { Participant, Question, Answer } from '@/types';
import { sounds } from '@/lib/audio';
import ParticipantTable from '@/components/admin/ParticipantTable';
import {
  RefreshCw,
  LogOut,
  Users,
  Database,
  Lock,
  UserCheck,
  AlertCircle,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';

export default function AdminPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'peserta' | 'bank_soal'>('peserta');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const [loadingParticipants, setLoadingParticipants] = useState<boolean>(false);
  const [syncingData, setSyncingData] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // 1. Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (username === 'alifico' && password === 'Vinolia13!') {
      sounds.playSuccess();
      setIsAuthenticated(true);
      // Auto fetch data awal saat admin berhasil login
      fetchParticipants();
      handleSyncData();
    } else {
      sounds.playPop();
      setLoginError('Username atau Password admin salah!');
    }
  };

  // 2. Fetch Data Peserta (db_peserta)
  const fetchParticipants = async () => {
    setLoadingParticipants(true);
    try {
      const res = await fetch('/api/participants', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setParticipants(json.data);
      }
    } catch {
      alert('Gagal mengambil data peserta dari Google Spreadsheet');
    } finally {
      setLoadingParticipants(false);
    }
  };

  // 3. Tombol "Sinkronisasi Data" (db_question & db_answer)
  const handleSyncData = async () => {
    sounds.playPop();
    setSyncingData(true);
    setSyncMessage('');

    try {
      const res = await fetch('/api/questions', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setQuestions(json.data.questions);
        setAnswers(json.data.answers);
        setSyncMessage(`Sinkronisasi Sukses: ${json.data.questions.length} Soal, ${json.data.answers.length} Pilihan`);
        sounds.playSuccess();
        setTimeout(() => setSyncMessage(''), 5000);
      } else {
        setSyncMessage('Gagal sinkronisasi data dari spreadsheet');
      }
    } catch {
      setSyncMessage('Terjadi kesalahan koneksi saat sinkronisasi');
    } finally {
      setSyncingData(false);
    }
  };

  // 4. Logout Handler
  const handleLogout = () => {
    sounds.playPop();
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  // Tampilan Login Jika Belum Terautentikasi
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFFDF0] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
          <div className="inline-block bg-[#FF6B8B] text-black border-2 border-black px-3 py-1 font-black text-xs uppercase mb-3">
            Admin Access Only
          </div>
          <h1 className="text-2xl font-black uppercase mb-1">Login Admin</h1>
          <p className="text-xs font-bold text-neutral-600 mb-5">
            Masuk untuk mengelola data peserta dan sinkronisasi ujian.
          </p>

          {loginError && (
            <div className="mb-4 bg-[#FF6B8B] border-2 border-black p-2.5 font-bold text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block font-black text-xs uppercase mb-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="alifico"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border-2 border-black p-2.5 font-bold text-sm outline-none focus:bg-yellow-50 focus:shadow-[2px_2px_0px_#000] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-black text-xs uppercase mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-black p-2.5 font-bold text-sm outline-none focus:bg-yellow-50 focus:shadow-[2px_2px_0px_#000] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#FFE600] text-black border-3 border-black py-3.5 font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              Masuk Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Tampilan Dashboard Admin (PC-First)
  return (
    <div className="min-h-screen bg-[#FFFDF0] text-black p-4 md:p-8 font-sans">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 bg-white border-4 border-black p-4 md:p-5 mb-6 shadow-[6px_6px_0px_#000]">
        <div className="flex items-center gap-3">
          <div className="bg-[#FFE600] border-2 border-black px-3 py-1.5 font-black text-sm uppercase">
            CBT Admin Portal
          </div>
          <span className="font-bold text-xs text-neutral-500 hidden md:inline">
            Mode Desktop Management
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tombol Sinkronisasi Data */}
          <button
            type="button"
            onClick={handleSyncData}
            disabled={syncingData}
            className="flex items-center gap-2 bg-[#00F0FF] text-black border-2 border-black px-3.5 py-1.5 font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingData ? 'animate-spin' : ''}`} />
            <span>{syncingData ? 'Sinkronisasi...' : 'Sinkronisasi Data'}</span>
          </button>

          {/* Notifikasi Sinkronisasi */}
          {syncMessage && (
            <span className="bg-[#52FFA8] border border-black px-2.5 py-1 text-xs font-black uppercase">
              {syncMessage}
            </span>
          )}

          {/* Tombol Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-[#FF6B8B] text-black border-2 border-black px-3.5 py-1.5 font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Konten Dashboard */}
      <main className="bg-white border-4 border-black p-5 md:p-6 shadow-[6px_6px_0px_#000]">
        {/* Navigasi Tab */}
        <div className="flex flex-wrap items-center gap-3 border-b-3 border-black pb-4 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('peserta')}
            className={`px-4 py-2 border-2 border-black font-black text-xs uppercase flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'peserta'
                ? 'bg-[#FFE600] shadow-[3px_3px_0px_#000]'
                : 'bg-neutral-100 hover:bg-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data Peserta (db_peserta)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank_soal')}
            className={`px-4 py-2 border-2 border-black font-black text-xs uppercase flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'bank_soal'
                ? 'bg-[#FFE600] shadow-[3px_3px_0px_#000]'
                : 'bg-neutral-100 hover:bg-neutral-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Preview Soal Terhubung ({questions.length})</span>
          </button>
        </div>

        {/* Tab 1: Tabel Peserta (db_peserta) */}
        {activeTab === 'peserta' && (
          <ParticipantTable
            participants={participants}
            loading={loadingParticipants}
            onRefresh={fetchParticipants}
          />
        )}

        {/* Tab 2: Preview Bank Soal yang Tersinkron dari Spreadsheet */}
        {activeTab === 'bank_soal' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#FFFDF0] border-2 border-black p-3">
              <span className="font-bold text-xs">
                Data pertanyaan dan jawaban ini diambil langsung dari sheet <b>db_question</b> dan <b>db_answer</b>.
              </span>
              <a
                href="https://docs.google.com/spreadsheets/d/1GpPO0buWeo0t7guojF0ocNzZiUU72kZ7NrIY5mLAwgQ/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#FFE600] border-2 border-black px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_#000]"
              >
                <span>Buka Google Spreadsheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {questions.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-black text-center font-bold text-neutral-500">
                Belum ada data soal yang tersinkron. Klik tombol &quot;Sinkronisasi Data&quot; di atas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.map((q, idx) => {
                  const qAnswers = answers.filter((a) => a.question_id === q.question_id);
                  return (
                    <div
                      key={q.question_id || idx}
                      className="border-3 border-black p-4 bg-neutral-50 shadow-[3px_3px_0px_#000]"
                    >
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-black">
                        <span className="font-black text-xs bg-black text-white px-2 py-0.5">
                          ID: {q.question_id}
                        </span>
                        <span className="font-bold text-[11px] bg-yellow-200 border border-black px-2 py-0.5">
                          {q.question_type}
                        </span>
                      </div>

                      {q.question_image_url && (
                        <div className="mb-2 border border-black bg-white p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={q.question_image_url}
                            alt="Media Soal"
                            className="w-full h-32 object-contain"
                          />
                        </div>
                      )}

                      <p className="font-bold text-xs mb-3">{q.question_text}</p>

                      <div className="space-y-1.5 border-t border-black pt-2">
                        {qAnswers.map((ans) => (
                          <div
                            key={ans.answer_id}
                            className={`p-1.5 border border-black text-xs font-semibold flex items-center justify-between ${
                              ans.is_true === 'TRUE' ? 'bg-[#52FFA8]' : 'bg-white'
                            }`}
                          >
                            <span>{ans.answer_text}</span>
                            {ans.is_true === 'TRUE' && (
                              <span className="font-black text-[10px] uppercase bg-black text-white px-1">
                                Benar
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}