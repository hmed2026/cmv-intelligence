'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080E1A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl font-black gradient-text mb-4">404</div>
        <h1 className="text-2xl font-bold text-[#F9FAFB] mb-3">Página não encontrada</h1>
        <p className="text-sm text-[#6B7280] mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-glow-blue"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1E40AF)' }}
        >
          <ArrowLeft size={16} />
          Voltar ao Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
