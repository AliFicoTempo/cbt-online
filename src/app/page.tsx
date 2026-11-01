'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Question, Answer } from '@/types';
import { sounds } from '@/lib/audio';
import Timer from '@/components/test/Timer';
import QuestionCard from '@/components/test/QuestionCard';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Home,
} from 'lucide-react';

const TEST_DURATION_SECONDS = 3600;
const LEAVE_PENALTY_SECONDS = 600;
const PROGRESS_STORAGE_KEY = 'cbt-participant-progress';

interface ParticipantForm {
  user_id: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  nik_ktp: string;
  alamat_lengkap: string;
  no_telp: string;
  email: string;
}

interface StoredProgress {
  version: 1;
  step: 'register' | 'description' | 'test';
  form: ParticipantForm;
  questions: Question[];
  answers: Answer[];
  currentIndex: number;
  selectedAnswers: Record<string, string>;
  deadline: number | null;
  violations: number;
  hiddenDuringTest: boolean;
}

export default function ParticipantPage() {
  const [step, setStep] = useState<'register' | 'description' | 'test' | 'finished'>('register');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Data Soal & Jawaban dari Spreadsheet
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const [timeLeft, setTimeLeft] = useState<number>(TEST_DURATION_SECONDS);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [violations, setViolations] = useState<number>(0);
  const [hiddenDuringTest, setHiddenDuringTest] = useState<boolean>(false);
  const [restoreReady, setRestoreReady] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const stepRef = useRef(step);
  const hiddenDuringTestRef = useRef(false);
  const submittingRef = useRef(false);
  const formRef = useRef<ParticipantForm | null>(null);
  const selectedAnswersRef = useRef(selectedAnswers);
  const progressRef = useRef<StoredProgress | null>(null);
  const autoSubmitRef = useRef<() => void>(() => {});

  // Form Data Diri Peserta
  const [form, setForm] = useState({
    user_id: '',
    nama_lengkap: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    nik_ktp: '',
    alamat_lengkap: '',
    no_telp: '+62',
    email: '',
  });

  stepRef.current = step;
  deadlineRef.current = deadline;
  hiddenDuringTestRef.current = hiddenDuringTest;
  formRef.current = form;
  selectedAnswersRef.current = selectedAnswers;
  progressRef.current = step === 'finished' ? null : {
    version: 1,
    step,
    form,
    questions,
    answers,
    currentIndex,
    selectedAnswers,
    deadline,
    violations,
    hiddenDuringTest,
  };

  // Restore an unfinished registration or test after a reload in the same tab.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PROGRESS_STORAGE_KEY);
      if (saved) {
        const progress = JSON.parse(saved) as StoredProgress;
        const validForm =
          progress.form &&
          ['user_id', 'nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'nik_ktp', 'alamat_lengkap', 'no_telp', 'email']
            .every((key) => typeof progress.form[key as keyof ParticipantForm] === 'string');
        const validStep = ['register', 'description', 'test'].includes(progress.step);
        const validTestState = progress.step === 'register' || (
          Array.isArray(progress.questions) &&
          progress.questions.length > 0 &&
          Array.isArray(progress.answers)
        );

        if (progress.version === 1 && validForm && validStep && validTestState) {
          setForm(progress.form);
          setQuestions(progress.questions || []);
          setAnswers(progress.answers || []);
          setCurrentIndex(progress.currentIndex || 0);
          setSelectedAnswers(progress.selectedAnswers || {});
          setViolations(progress.violations || 0);
          setHiddenDuringTest(Boolean(progress.hiddenDuringTest));
          if (progress.step === 'test' && Number.isFinite(progress.deadline)) {
            setDeadline(progress.deadline);
            setTimeLeft(Math.max(0, Math.ceil((progress.deadline - Date.now()) / 1000)));
          }
          setStep(progress.step);
        } else {
          sessionStorage.removeItem(PROGRESS_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Gagal memulihkan progres peserta:', error);
      setErrorMessage('Progres sebelumnya tidak dapat dipulihkan. Silakan lanjutkan atau isi ulang data.');
    } finally {
      setRestoreReady(true);
    }
  }, []);

  useEffect(() => {
    if (!restoreReady) return;
    if (step === 'finished') {
      try {
        sessionStorage.removeItem(PROGRESS_STORAGE_KEY);
      } catch (error) {
        console.error('Gagal menghapus progres peserta:', error);
      }
      return;
    }

    const hasFormData = Object.entries(form).some(([key, value]) => key !== 'no_telp' || value !== '+62');
    if (!hasFormData && step === 'register') {
      try {
        sessionStorage.removeItem(PROGRESS_STORAGE_KEY);
      } catch (error) {
        console.error('Gagal menghapus progres peserta:', error);
      }
      return;
    }

    try {
      sessionStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressRef.current));
    } catch (error) {
      console.error('Gagal menyimpan progres peserta:', error);
      setErrorMessage('Progres tidak dapat disimpan di browser ini. Jangan muat ulang halaman.');
    }
  }, [
    restoreReady,
    step,
    form,
    questions,
    answers,
    currentIndex,
    selectedAnswers,
    deadline,
    violations,
    hiddenDuringTest,
  ]);

  useEffect(() => {
    const hasFormData = Object.entries(form).some(([key, value]) => key !== 'no_telp' || value !== '+62');
    if (!hasFormData && step === 'register') return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      try {
        if (progressRef.current) {
          sessionStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressRef.current));
        }
      } catch (error) {
        console.error('Gagal menyimpan progres sebelum halaman ditinggalkan:', error);
      }
    };

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [form, step]);

  const applyLeavePenalty = () => {
    hiddenDuringTestRef.current = false;
    setHiddenDuringTest(false);
    setViolations((count) => count + 1);

    const currentDeadline = deadlineRef.current;
    if (currentDeadline === null) return;

    const nextDeadline = currentDeadline - LEAVE_PENALTY_SECONDS * 1000;
    deadlineRef.current = nextDeadline;
    setDeadline(nextDeadline);
    const remaining = Math.max(0, Math.ceil((nextDeadline - Date.now()) / 1000));
    setTimeLeft(remaining);
    if (remaining === 0) autoSubmitRef.current();
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (stepRef.current !== 'test') return;

      if (document.visibilityState === 'hidden') {
        hiddenDuringTestRef.current = true;
        setHiddenDuringTest(true);
      } else if (hiddenDuringTestRef.current) {
        applyLeavePenalty();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (
      restoreReady &&
      stepRef.current === 'test' &&
      hiddenDuringTestRef.current &&
      document.visibilityState === 'visible'
    ) {
      applyLeavePenalty();
    }
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [restoreReady]);

  // Ambil Data Soal & Pilihan Jawaban dari Google Sheets
  const fetchQuestionsFromSheets = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/questions', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data.questions) && json.data.questions.length > 0) {
        setQuestions(json.data.questions);
        setAnswers(json.data.answers);
        return true;
      } else {
        setErrorMessage('Daftar pertanyaan belum tersedia di Google Spreadsheet.');
        return false;
      }
    } catch {
      setErrorMessage('Gagal menghubungkan ke database soal Google Sheets.');
      return false;
    }
  };

  // Use an absolute deadline so background-tab timer throttling does not pause the exam.
  useEffect(() => {
    if (step !== 'test' || deadline === null) return;

    const updateTimeLeft = () => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current! - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        autoSubmitRef.current();
        return false;
      }
      return true;
    };

    if (updateTimeLeft()) {
      timerRef.current = setInterval(updateTimeLeft, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, deadline]);

  // Format otomatis tanggal lahir dd/mm/yyyy
  const handleDateChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setForm((prev) => ({ ...prev, tanggal_lahir: formatted }));
  };

  // Format otomatis nomor telepon diawali +62
  const handlePhoneChange = (val: string) => {
    if (!val.startsWith('+62')) {
      setForm((prev) => ({ ...prev, no_telp: '+62' }));
      return;
    }
    const cleanNumbers = '+62' + val.slice(3).replace(/\D/g, '');
    setForm((prev) => ({ ...prev, no_telp: cleanNumbers }));
  };

  // Submit Registrasi Peserta
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validasi NIK 16 Digit
    if (form.nik_ktp.trim().length !== 16 || !/^\d+$/.test(form.nik_ktp)) {
      setErrorMessage('NIK KTP wajib berupa 16 digit angka!');
      return;
    }

    // Validasi Tanggal Lahir (dd/mm/yyyy)
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(form.tanggal_lahir)) {
      setErrorMessage('Format tanggal lahir harus dd/mm/yyyy (contoh: 17/08/1995)');
      return;
    }

    // Validasi No Telp
    if (form.no_telp.trim().length < 10) {
      setErrorMessage('Nomor telepon tidak valid. Pastikan diawali kode negara +62');
      return;
    }

    sounds.playPop();
    setLoading(true);

    const generatedId = `USR-${Date.now().toString().slice(-6)}`;
    const newForm = { ...form, user_id: generatedId };

    try {
      // 1. Simpan peserta ke sheet db_peserta
      const saveRes = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });
      const saveJson = await saveRes.json();

      if (!saveJson.success) {
        throw new Error(saveJson.error || 'Gagal menyimpan data peserta.');
      }

      setForm(newForm);

      // 2. Ambil soal ujian terbaru langsung dari spreadsheet
      const fetchSuccess = await fetchQuestionsFromSheets();
      if (fetchSuccess) {
        setStep('description');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat mengirim data.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Masuk ke Halaman Tes
  const handleStartTest = () => {
    sounds.playSuccess();
    const newDeadline = Date.now() + TEST_DURATION_SECONDS * 1000;
    deadlineRef.current = newDeadline;
    setDeadline(newDeadline);
    setTimeLeft(TEST_DURATION_SECONDS);
    hiddenDuringTestRef.current = false;
    setHiddenDuringTest(false);
    setStep('test');
  };

  // Pilih Jawaban
  const handleSelectAnswer = (answerId: string) => {
    const currentQ = questions[currentIndex];
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.question_id]: answerId,
    }));
  };

  // Pindah ke Soal Berikutnya atau Selesai
  const handleNextQuestion = () => {
    const currentQ = questions[currentIndex];
    if (!selectedAnswers[currentQ.question_id]) {
      alert('Pertanyaan wajib dijawab sebelum melanjutkan!');
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinalSubmit();
    }
  };

  // Kirim Jawaban Akhir ke Sheet db_jawaban_peserta
  const handleFinalSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const answersArray = Object.entries(selectedAnswersRef.current).map(([qid, aid]) => ({
      question_id: qid,
      answer_id: aid,
    }));

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: formRef.current?.user_id,
          answers: answersArray,
        }),
      });

      const json = await res.json();
      if (json.success) {
        sounds.playSuccess();
        setStep('finished');
      } else {
        alert('Gagal mengirim lembar jawaban: ' + (json.error || 'Kesalahan sistem'));
      }
    } catch {
      alert('Koneksi terputus saat menyimpan lembar jawaban.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // Auto-submit bila waktu habis (3600 detik)
  const handleAutoSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const answersArray = Object.entries(selectedAnswersRef.current).map(([qid, aid]) => ({
      question_id: qid,
      answer_id: aid,
    }));

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: formRef.current?.user_id,
          answers: answersArray,
          auto_submit: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan jawaban otomatis.');
      }
      sounds.playSuccess();
      setStep('finished');
    } catch (error) {
      console.error('Gagal mengirim jawaban otomatis:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Gagal menyimpan jawaban otomatis.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  autoSubmitRef.current = handleAutoSubmit;

  return (
    <div className="min-h-screen bg-[#FFFDF0] text-black font-sans py-6 px-4 flex flex-col justify-center items-center">
      {/* ============================================================ */}
      {/* 1. REGISTER PAGE (MOBILE-FIRST)                             */}
      {/* ============================================================ */}
      {step === 'register' && (
        <div className="w-full max-w-md bg-white border-4 border-black p-5 md:p-6 shadow-[6px_6px_0px_#000]">
          <div className="inline-block bg-[#FFE600] border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-wider mb-2">
            Online Examination
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-1">Pendaftaran Peserta</h1>
          <p className="text-xs font-bold text-neutral-600 mb-5">
            Lengkapi identitas diri Anda dengan valid untuk memulai tes.
          </p>

          {errorMessage && (
            <div className="mb-4 bg-[#FF6B8B] border-2 border-black p-3 font-bold text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Nama Lengkap */}
            <div>
              <label className="flex items-center gap-1.5 font-black text-xs uppercase mb-1">
                <User className="w-3.5 h-3.5" /> Nama Lengkap *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Pratama"
                value={form.nama_lengkap}
                onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                className="w-full border-2 border-black p-2.5 font-bold text-sm outline-none focus:bg-yellow-50 focus:shadow-[2px_2px_0px_#000] transition-all"
              />
            </div>

            {/* Tempat & Tanggal Lahir */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="flex items-center gap-1.5 font-black text-xs uppercase mb-1">
                  <MapPin className="w-3.5 h-3.5" /> Tempat Lahir *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jakarta"
                  value={form.tempat_lahir}
                  onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })}
                  className="w-full border-2 border-black p-2.5 font-bold text-sm outline-none focus:bg-yellow-50 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-black text-xs uppercase mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Tgl Lahir *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="dd/mm/yyyy"
                  value={form.tanggal_lahir}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full border-2 border-black p-2.5 font-mono font-bold text-sm outline-none focus:bg-yellow-50 transition-all"
                />
              </div>
            </div>

            {/* NIK KTP (16 Digit) */}
            <div>
              <label className="flex items-center gap-1.5 font-black text-xs uppercase mb-1">
                <CreditCard className="w-3.5 h-3.5" /> NIK KTP (Wajib 16 Digit) *
              </label>
              <input
                type="text"
                required
                maxLength={16}
                placeholder="3201012345678901"
                value={form.nik_ktp}
                onChange={(e) => setForm({ ...form, nik_ktp: e.target.value.replace(/\D/g, '') })}
                className="w-full border-2 border-black p-2.5 font-mono font-bold text-sm outline-none focus:bg-yellow-50 transition-all"
              />
            </div>

            {/* Alamat Lengkap */}
            <div>
              <label className="flex items-center gap-1.5 font-black text-xs uppercase mb-1">
                <Home className="w-3.5 h-3.5" /> Alamat Lengkap *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Jl. Merdeka No. 45, RT 01 / RW 02"
                value={form.alamat_lengkap}
                onChange={(e) => setForm({ ...form, alamat_lengkap: e.target.value })}
                className="w-full border-2 border-black p-2.5 font-bold text-sm outline-none resize-none focus:bg-yellow-50 transition-all"
              />
            </div>

            {/* No Telp (+62) */}
            <div>
              <label className="flex items-center gap-1.5 font-black text-xs uppercase mb-1">
                <Phone className="w-3.5 h-3.5" /> No. Telp (Kode Negara +62) *
              </label>
              <input
                type="text"
                required
                value={form.no_telp}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full border-2 border-black p-2.5 font-mono font-bold text-sm outline-none focus:bg-yellow-50 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-1.5 font-black text-xs uppercase mb-1">
                <Mail className="w-3.5 h-3.5" /> Email *
              </label>
              <input
                type="email"
                required
                placeholder="peserta@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border-2 border-black p-2.5 font-bold text-sm outline-none focus:bg-yellow-50 transition-all"
              />
            </div>

            {/* Tombol Ajukan Test */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-[#52FFA8] text-black border-3 border-black py-3.5 font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan & Memuat Soal...' : 'Ajukan Test'}
            </button>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. DESCRIPTION PAGE                                          */}
      {/* ============================================================ */}
      {step === 'description' && (
        <div className="w-full max-w-md bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000]">
          <div className="inline-block bg-[#00F0FF] border-2 border-black px-3 py-1 font-black text-xs uppercase mb-3">
            Aturan & Prosedur Test
          </div>

          <h2 className="text-base font-black text-neutral-600 uppercase">Selamat Datang,</h2>
          <h1 className="text-2xl font-black text-black uppercase mb-5 leading-tight">
            {form.nama_lengkap}
          </h1>

          <div className="space-y-3 bg-[#FFFDF0] border-3 border-black p-4 mb-6 text-sm font-bold">
            <div className="flex items-start gap-2.5">
              <Clock className="w-5 h-5 flex-shrink-0 text-black mt-0.5" />
              <span>Test akan berlangsung selama 60 menit.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#FF6B8B] mt-0.5" />
              <span>
                Pertanyaan yang sudah dijawab tidak bisa direvisi (Tidak ada tombol back/previous).
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-black mt-0.5" />
              <span>Setiap pertanyaan wajib dijawab untuk melanjutkan ke soal berikutnya.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#FF6B8B] mt-0.5" />
              <span>
                Jika halaman ujian ditinggalkan lalu dibuka kembali, waktu akan dikurangi 10 menit setiap kali.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartTest}
            className="w-full bg-[#FFE600] text-black border-3 border-black py-4 font-black text-base uppercase tracking-wider shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Mulai</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TEST PAGE                                                 */}
      {/* ============================================================ */}
      {step === 'test' && questions.length > 0 && (
        <div className="w-full max-w-lg">
          {errorMessage && (
            <div className="mb-4 bg-[#FF6B8B] border-2 border-black p-3 font-bold text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {violations > 0 && (
            <div className="mb-4 bg-[#FFE600] border-2 border-black p-3 font-black text-xs">
              Peringatan meninggalkan ujian: {violations} kali. Penalti 10 menit telah diterapkan setiap kali.
            </div>
          )}
          {/* Sticky Header: Timer & Status */}
          <div className="sticky top-3 z-30 flex items-center justify-between bg-white border-3 border-black p-3 mb-4 shadow-[4px_4px_0px_#000]">
            <div className="font-mono font-black text-xs bg-black text-white px-2.5 py-1 uppercase">
              SOAL {currentIndex + 1} / {questions.length}
            </div>
            <Timer seconds={timeLeft} />
          </div>

          {/* Kartu Soal */}
          <QuestionCard
            question={questions[currentIndex]}
            answers={answers.filter((a) => a.question_id === questions[currentIndex].question_id)}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            selectedAnswerId={selectedAnswers[questions[currentIndex].question_id]}
            onSelectAnswer={handleSelectAnswer}
            onNext={handleNextQuestion}
            isLast={currentIndex === questions.length - 1}
            submitting={submitting}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. FINISHED PAGE                                             */}
      {/* ============================================================ */}
      {step === 'finished' && (
        <div className="w-full max-w-md bg-white border-4 border-black p-6 md:p-8 text-center shadow-[6px_6px_0px_#000]">
          <div className="w-16 h-16 bg-[#52FFA8] border-3 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_#000]">
            <CheckCircle2 className="w-10 h-10 text-black stroke-[2.5]" />
          </div>

          <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Test Selesai!</h1>
          <p className="text-xs md:text-sm font-bold text-neutral-700 leading-relaxed mb-6">
            Ujian telah ditutup. Jawaban yang berhasil dikirim tersimpan di Google Spreadsheet.
            Penilaian akan diolah langsung oleh panitia/admin.
          </p>

          <div className="bg-[#FFFDF0] border-2 border-black p-3.5 font-mono text-xs font-black uppercase flex items-center justify-between mb-4">
            <span className="text-neutral-500">ID Peserta:</span>
            <span className="bg-yellow-200 border border-black px-2 py-0.5">{form.user_id}</span>
          </div>

          <div className="bg-[#FFFDF0] border-2 border-black p-3.5 font-mono text-xs font-black uppercase flex items-center justify-between">
            <span className="text-neutral-500">Total Soal Terjawab:</span>
            <span className="bg-[#52FFA8] border border-black px-2 py-0.5">
              {Object.keys(selectedAnswers).length} / {questions.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}