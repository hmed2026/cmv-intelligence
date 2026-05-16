'use client';

import React from 'react';
import { Zap } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#080E1A]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center animate-pulse-glow">
          <Zap size={22} className="text-white" />
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
