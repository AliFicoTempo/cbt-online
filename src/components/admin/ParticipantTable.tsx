'use client';

import React from 'react';
import { RefreshCw, Download, FileText } from 'lucide-react';
import { Participant } from '@/types';
import { sounds } from '@/lib/audio';

interface ParticipantTableProps {
  participants: Participant[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ParticipantTable({
  participants,
  loading,
  onRefresh,
}: ParticipantTableProps) {
  const handleUpdateClick = () => {
    sounds.playPop();
    onRefresh();
  };

  return (
    <div className="w-full">
      {/* Header Tabel & Tombol Update */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-black text-sm uppercase bg-[#FFE600] border-2 border-black px-2.5 py-1">
            Data Peserta
          </span>
          <span className="text-xs font-bold text-neutral-600">
            Total: {participants.length} Peserta
          </span>
        </div>

        {/* Tombol Update (Refresh Data dari Spreadsheet) */}
        <button
          type="button"
          onClick={handleUpdateClick}
          disabled={loading}
          className="flex items-center gap-2 bg-[#52FFA8] text-black border-2 border-black px-4 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Memperbarui...' : 'Update'}</span>
        </button>
      </div>

      {/* Kontainer Tabel Responsif */}
      <div className="overflow-x-auto border-3 border-black shadow-[4px_4px_0px_#000] bg-white">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-[#FFFDF0] border-b-3 border-black text-black">
              <th className="p-3 border-r-2 border-black font-black uppercase">User ID</th>
              <th className="p-3 border-r-2 border-black font-black uppercase">Nama Lengkap</th>
              <th className="p-3 border-r-2 border-black font-black uppercase">NIK KTP</th>
              <th className="p-3 border-r-2 border-black font-black uppercase">Tempat / Tgl Lahir</th>
              <th className="p-3 border-r-2 border-black font-black uppercase">No. Telp</th>
              <th className="p-3 border-r-2 border-black font-black uppercase">Email</th>
              {/* 3 Kolom Khusus */}
              <th className="p-3 border-r-2 border-black font-black uppercase bg-[#FFE600] text-center">
                final_score
              </th>
              <th className="p-3 border-r-2 border-black font-black uppercase bg-[#00F0FF] text-center">
                status_test
              </th>
              <th className="p-3 font-black uppercase bg-[#FF6B8B] text-center">
                result_pdf
              </th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center font-bold text-neutral-500">
                  {loading
                    ? 'Sedang mengambil data terbaru dari Google Spreadsheet...'
                    : 'Belum ada data peserta yang terdaftar.'}
                </td>
              </tr>
            ) : (
              participants.map((p) => {
                const hasScore = p.final_score && p.final_score !== '-';
                const hasStatus = p.status_test && p.status_test !== '-';
                const hasPdf = p.result_pdf && p.result_pdf !== '-';

                return (
                  <tr
                    key={p.user_id}
                    className="border-b border-black hover:bg-yellow-50/50 transition-colors"
                  >
                    <td className="p-3 border-r-2 border-black font-mono font-black text-neutral-800">
                      {p.user_id}
                    </td>
                    <td className="p-3 border-r-2 border-black font-bold text-black">
                      {p.nama_lengkap}
                    </td>
                    <td className="p-3 border-r-2 border-black font-mono text-neutral-700">
                      {p.nik_ktp}
                    </td>
                    <td className="p-3 border-r-2 border-black text-neutral-700">
                      {p.tempat_lahir}, {p.tanggal_lahir}
                    </td>
                    <td className="p-3 border-r-2 border-black font-mono text-neutral-700">
                      {p.no_telp}
                    </td>
                    <td className="p-3 border-r-2 border-black text-neutral-700">
                      {p.email}
                    </td>

                    {/* Kolom 1: final_score */}
                    <td className="p-3 border-r-2 border-black text-center font-mono font-black text-sm">
                      {hasScore ? (
                        <span className="inline-block bg-[#FFE600] border-2 border-black px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                          {p.final_score}
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-bold">-</span>
                      )}
                    </td>

                    {/* Kolom 2: status_test */}
                    <td className="p-3 border-r-2 border-black text-center text-xs font-black">
                      {hasStatus ? (
                        p.status_test.toLowerCase() === 'lulus' ? (
                          <span className="inline-block bg-[#52FFA8] text-black border-2 border-black px-2.5 py-0.5 shadow-[1px_1px_0px_#000]">
                            LULUS
                          </span>
                        ) : p.status_test.toLowerCase() === 'tidak lulus' ? (
                          <span className="inline-block bg-[#FF6B8B] text-black border-2 border-black px-2.5 py-0.5 shadow-[1px_1px_0px_#000]">
                            TIDAK LULUS
                          </span>
                        ) : (
                          <span className="inline-block bg-neutral-100 border-2 border-black px-2 py-0.5">
                            {p.status_test}
                          </span>
                        )
                      ) : (
                        <span className="text-neutral-400 font-bold">-</span>
                      )}
                    </td>

                    {/* Kolom 3: result_pdf */}
                    <td className="p-3 text-center">
                      {hasPdf ? (
                        <a
                          href={p.result_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#00F0FF] text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-cyan-300 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      ) : (
                        <span className="text-neutral-400 font-bold">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}