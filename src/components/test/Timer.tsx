'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { formatSecondsToMMSS } from '@/lib/utils';

interface TimerProps {
  seconds: number;
}

function getTimerColor(seconds: number): string {
  const clampedSeconds = Math.min(3600, Math.max(0, seconds));
  const progress = clampedSeconds > 1800
    ? (3600 - clampedSeconds) / 1800
    : (1800 - clampedSeconds) / 1200;
  const start = clampedSeconds > 1800 ? [82, 255, 168] : [255, 230, 0];
  const end = clampedSeconds > 1800 ? [255, 230, 0] : [255, 107, 139];
  const color = start.map((value, index) =>
    Math.round(value + (end[index] - value) * Math.min(1, Math.max(0, progress)))
  );

  return `rgb(${color.join(', ')})`;
}

export default function Timer({ seconds }: TimerProps) {
  const isUrgent = seconds <= 600 && seconds > 0;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 border-3 border-black font-mono font-black text-sm md:text-base text-black shadow-[3px_3px_0px_#000] transition-colors duration-1000 ${
        isUrgent ? 'animate-pulse' : ''
      }`}
      style={{ backgroundColor: getTimerColor(seconds) }}
      role="timer"
      aria-live={isUrgent ? 'assertive' : 'off'}
    >
      <Clock className="w-4 h-4 md:w-5 md:h-5" />
      <span>{formatSecondsToMMSS(seconds)}</span>
    </div>
  );
}