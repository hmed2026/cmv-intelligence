'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Zap,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const passwordRequirements = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Número ou símbolo', test: (p: string) => /[\d\W]/.test(p) },
];

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [watchedPassword, setWatchedPassword] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setServerError('');
    try {
      await registerUser(data.name, data.email, data.password);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(
        e.response?.data?.message || 'Erro ao criar conta. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080E1A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-blue-600/6 blur-3xl animate-float" />
        <div
          className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full bg-purple-800/5 blur-3xl animate-float"
          style={{ animationDelay: '1s' }}
        />
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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Brand */}
        <motion.div variants={itemVariants} className="text-center mb-7">
          <Link href="/login" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-glow-blue mb-4 mx-auto">
            <Zap size={22} className="text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-[#F9FAFB] mb-1">Criar conta</h1>
          <p className="text-sm text-[#6B7280]">
            Comece sua jornada financeira inteligente
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div variants={itemVariants} className="gradient-border overflow-hidden">
          <div className="bg-[#0D1526]/90 backdrop-blur-2xl rounded-2xl p-7 shadow-glass">
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
                label="Nome completo"
                type="text"
                placeholder="Seu nome"
                prefixIcon={<User size={15} />}
                error={errors.name?.message}
                autoComplete="name"
                {...register('name', {
                  required: 'Nome é obrigatório',
                  minLength: { value: 2, message: 'Nome muito curto' },
                })}
              />

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

              <div>
                <Input
                  label="Senha"
                  placeholder="Mínimo 8 caracteres"
                  prefixIcon={<Lock size={15} />}
                  showPasswordToggle
                  error={errors.password?.message}
                  autoComplete="new-password"
                  {...register('password', {
                    required: 'Senha é obrigatória',
                    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                    onChange: (e) => setWatchedPassword(e.target.value),
                  })}
                />

                {/* Password requirements */}
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 space-y-1"
                  >
                    {passwordRequirements.map((req) => {
                      const ok = req.test(password);
                      return (
                        <div key={req.label} className="flex items-center gap-1.5">
                          <div
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${
                              ok ? 'bg-emerald-500/20' : 'bg-white/5'
                            }`}
                          >
                            {ok && <Check size={8} className="text-emerald-400" />}
                          </div>
                          <span
                            className={`text-[10px] transition-colors ${
                              ok ? 'text-emerald-400' : 'text-[#4B5563]'
                            }`}
                          >
                            {req.label}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </div>

              <Input
                label="Confirmar senha"
                placeholder="Repita a senha"
                prefixIcon={<Lock size={15} />}
                showPasswordToggle
                error={errors.confirmPassword?.message}
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Confirmação é obrigatória',
                  validate: (val) =>
                    val === watch('password') || 'As senhas não correspondem',
                })}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mt-2"
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
                      Criar Conta
                      <ArrowRight size={16} />
                    </>
                  )}
                </span>
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-[#6B7280]">
              Já tem conta?{' '}
              <Link
                href="/login"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Entrar agora
              </Link>
            </p>

            <p className="mt-4 text-center text-[10px] text-[#4B5563]">
              Ao criar uma conta, você concorda com os{' '}
              <span className="text-[#6B7280] hover:text-blue-400 cursor-pointer transition-colors">
                Termos de Uso
              </span>{' '}
              e{' '}
              <span className="text-[#6B7280] hover:text-blue-400 cursor-pointer transition-colors">
                Política de Privacidade
              </span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
