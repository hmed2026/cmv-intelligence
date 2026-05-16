'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoggedIn, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#080E1A]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center animate-pulse-glow">
            <span className="text-white font-bold text-xl">C</span>
          </div>
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
