'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { formatSecondsToMMSS } from '@/lib/utils';

interface TimerProps {
  seconds: number;
}

export default function Timer({ seconds }: TimerProps) {
  const isUrgent = seconds < 300 && seconds > 0; // Kurang dari 5 menit

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 border-3 border-black font-mono font-black text-sm md:text-base transition-colors ${
        isUrgent
          ? 'bg-[#FF6B8B] text-black animate-pulse shadow-[3px_3px_0px_#000]'
          : 'bg-[#52FFA8] text-black shadow-[3px_3px_0px_#000]'
      }`}
    >
      <Clock className={`w-4 h-4 md:w-5 md:h-5 ${isUrgent ? 'animate-bounce' : ''}`} />
      <span>{formatSecondsToMMSS(seconds)}</span>
    </div>
  );
}