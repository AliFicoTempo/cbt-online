'use client';

import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Question, Answer } from '@/types';
import { sounds } from '@/lib/audio';

interface QuestionCardProps {
  question: Question;
  answers: Answer[];
  currentIndex: number;
  totalQuestions: number;
  selectedAnswerId?: string;
  onSelectAnswer: (answerId: string) => void;
  onNext: () => void;
  isLast: boolean;
  submitting?: boolean;
}

export default function QuestionCard({
  question,
  answers,
  currentIndex,
  totalQuestions,
  selectedAnswerId,
  onSelectAnswer,
  onNext,
  isLast,
  submitting = false,
}: QuestionCardProps) {
  const isAnswerSelected = Boolean(selectedAnswerId);

  const handlePick = (answerId: string) => {
    sounds.playSelect();
    onSelectAnswer(answerId);
  };

  const handleNextClick = () => {
    if (!isAnswerSelected || submitting) return;
    sounds.playPop();
    onNext();
  };

  return (
    <div className="w-full bg-white border-4 border-black p-4 md:p-6 shadow-[6px_6px_0px_#000]">
      {/* Label Jenis Soal & Nomor Urut */}
      <div className="flex items-center justify-between gap-2 mb-4 border-b-2 border-black pb-3">
        <span className="bg-[#FFE600] border-2 border-black px-2.5 py-1 text-xs font-black tracking-wider uppercase">
          Soal {currentIndex + 1} dari {totalQuestions}
        </span>
        <span className="bg-gray-100 border border-black px-2 py-0.5 text-[11px] font-bold uppercase text-gray-700">
          {question.question_type || 'Single Choice'}
        </span>
      </div>

      {/* Gambar Soal (Jika Ada / Image Based Question) */}
      {question.question_image_url && question.question_image_url.trim() !== '' && (
        <div className="mb-4 border-3 border-black bg-neutral-100 p-2 overflow-hidden flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.question_image_url}
            alt="Ilustrasi Pertanyaan"
            className="w-full max-h-72 object-contain"
            loading="lazy"
          />
        </div>
      )}

      {/* Teks Pertanyaan */}
      <h2 className="text-base md:text-lg font-black text-black leading-snug mb-6">
        {question.question_text}
      </h2>

      {/* Daftar Pilihan Jawaban */}
      <div className="space-y-3 mb-6">
        {answers.map((ans, idx) => {
          const isSelected = selectedAnswerId === ans.answer_id;
          const choiceLetter = String.fromCharCode(65 + idx); // A, B, C, D...

          return (
            <button
              key={ans.answer_id}
              type="button"
              onClick={() => handlePick(ans.answer_id)}
              className={`w-full text-left p-3.5 border-3 border-black transition-all flex items-start md:items-center gap-3 ${
                isSelected
                  ? 'bg-[#FFE600] translate-x-1.5 shadow-[3px_3px_0px_#000]'
                  : 'bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_#000]'
              }`}
            >
              {/* Badge Huruf / Centang */}
              <div
                className={`w-7 h-7 flex-shrink-0 border-2 border-black flex items-center justify-center font-black text-xs transition-colors ${
                  isSelected ? 'bg-black text-white' : 'bg-white text-black'
                }`}
              >
                {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : choiceLetter}
              </div>

              {/* Gambar Jawaban (Jika Ada / Image Based Answer) */}
              {ans.answer_image_url && ans.answer_image_url.trim() !== '' && (
                <div className="w-20 h-20 flex-shrink-0 border-2 border-black overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ans.answer_image_url}
                    alt={`Pilihan ${choiceLetter}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Teks Jawaban */}
              <div className="flex-1 font-bold text-sm text-black pt-0.5 md:pt-0">
                {ans.answer_text}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tombol Lanjut (Linier - Tidak Ada Tombol Back) */}
      <button
        type="button"
        onClick={handleNextClick}
        disabled={!isAnswerSelected || submitting}
        className={`w-full py-3.5 border-3 border-black font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 transition-all ${
          isAnswerSelected && !submitting
            ? 'bg-[#00F0FF] text-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer'
            : 'bg-neutral-200 text-neutral-400 border-neutral-400 shadow-none cursor-not-allowed'
        }`}
      >
        <span>
          {submitting
            ? 'Menyimpan Jawaban...'
            : isLast
            ? 'Kirim Seluruh Jawaban'
            : 'Jawab & Lanjut'}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}