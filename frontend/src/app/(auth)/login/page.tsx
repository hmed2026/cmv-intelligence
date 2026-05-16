'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';

interface LoginForm {
  email: string;
  password: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setServerError('');
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(
        e.response?.data?.message || 'Credenciais inválidas. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setValue('email', 'admin@cmv.com');
    setValue('password', 'Demo@123');
  };

  return (
    <div className="min-h-screen bg-[#080E1A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/8 blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-800/6 blur-3xl animate-float"
          style={{ animationDelay: '1.5s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-900/4 blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Brand */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-glow-blue mb-5 mx-auto">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#F9FAFB] mb-1">
            CMV Intelligence
          </h1>
          <p className="text-sm text-[#6B7280]">
            Gestão financeira de alta performance
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={itemVariants}
          className="gradient-border overflow-hidden"
        >
          <div className="bg-[#0D1526]/90 backdrop-blur-2xl rounded-2xl p-7 shadow-glass">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#F9FAFB]">Bem-vindo de volta</h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Entre com suas credenciais para acessar o painel
              </p>
            </div>

            {serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2"
              >
                <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-400">{serverError}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                prefixIcon={<Mail size={15} />}
                error={errors.email?.message}
                autoComplete="email"
                {...register('email', {
                  required: 'E-mail é obrigatório',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'E-mail inválido',
                  },
                })}
              />

              <Input
                label="Senha"
                placeholder="••••••••"
                prefixIcon={<Lock size={15} />}
                showPasswordToggle
                error={errors.password?.message}
                autoComplete="current-password"
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'Mínimo 6 caracteres',
                  },
                })}
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                  boxShadow: '0 0 30px rgba(59,130,246,0.25)',
                }}
              >
                <span className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Entrar
                      <ArrowRight size={16} />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Demo hint */}
            <div className="mt-5 p-3 rounded-xl bg-blue-500/6 border border-blue-500/15">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-0.5">
                    Acesso Demo
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    admin@cmv.com &bull; Demo@123
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg transition-colors hover:bg-blue-500/10"
                >
                  Preencher
                </button>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-[#6B7280]">
              Não tem conta?{' '}
              <Link
                href="/register"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Criar conta gratuita
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-center text-[10px] text-[#4B5563] mt-6"
        >
          © 2025 CMV Intelligence. Todos os direitos reservados.
        </motion.p>
      </motion.div>
    </div>
  );
}
