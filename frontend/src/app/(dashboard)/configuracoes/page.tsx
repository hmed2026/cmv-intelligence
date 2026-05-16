'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Save,
  Mail,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'perfil' | 'senha' | 'notificacoes' | 'aparencia';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'perfil', label: 'Perfil', icon: <User size={15} /> },
  { id: 'senha', label: 'Senha', icon: <Lock size={15} /> },
  { id: 'notificacoes', label: 'Notificações', icon: <Bell size={15} /> },
  { id: 'aparencia', label: 'Aparência', icon: <Palette size={15} /> },
];

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('perfil');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-[800px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-[#F9FAFB]">Configurações</h2>
        <p className="text-xs text-[#6B7280] mt-0.5">Gerencie sua conta e preferências</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-5"
      >
        {/* Sidebar Tabs */}
        <div className="md:w-44 glass-card p-2 h-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === tab.id
                  ? 'nav-active'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-blue-400' : 'text-[#6B7280]'}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 glass-card p-6">
          {activeTab === 'perfil' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#F9FAFB] mb-5">Informações do Perfil</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F9FAFB]">{user?.name}</p>
                  <p className="text-xs text-[#6B7280]">{user?.role}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Alterar foto
                  </Button>
                </div>
              </div>
              <Input label="Nome completo" defaultValue={user?.name} prefixIcon={<User size={15} />} />
              <Input label="E-mail" type="email" defaultValue={user?.email} prefixIcon={<Mail size={15} />} />
              <Input label="Telefone" placeholder="(00) 00000-0000" prefixIcon={<Phone size={15} />} />
              <Button variant="primary" icon={<Save size={14} />} loading={saving} onClick={handleSave}>
                Salvar Alterações
              </Button>
            </div>
          )}

          {activeTab === 'senha' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#F9FAFB] mb-5">Alterar Senha</h3>
              <Input label="Senha atual" showPasswordToggle placeholder="••••••••" prefixIcon={<Lock size={15} />} />
              <Input label="Nova senha" showPasswordToggle placeholder="Mínimo 8 caracteres" prefixIcon={<Lock size={15} />} />
              <Input label="Confirmar nova senha" showPasswordToggle placeholder="Repita a nova senha" prefixIcon={<Lock size={15} />} />
              <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/15">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={13} className="text-blue-400" />
                  <p className="text-xs font-semibold text-blue-400">Dica de segurança</p>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Use pelo menos 8 caracteres, incluindo letras maiúsculas, números e símbolos.
                </p>
              </div>
              <Button variant="primary" icon={<Save size={14} />} loading={saving} onClick={handleSave}>
                Atualizar Senha
              </Button>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#F9FAFB] mb-5">Notificações</h3>
              {[
                { label: 'Resumo diário por e-mail', desc: 'Receba um resumo financeiro todo dia às 8h' },
                { label: 'Alertas de CMV elevado', desc: 'Notificar quando o CMV ultrapassar a meta' },
                { label: 'Importação concluída', desc: 'Alertar quando uma importação for processada' },
                { label: 'Relatório semanal', desc: 'Relatório resumido toda segunda-feira' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5"
                >
                  <div>
                    <p className="text-sm font-medium text-[#F9FAFB]">{item.label}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    className="relative w-10 h-5 rounded-full bg-blue-500 transition-all flex items-center"
                  >
                    <span className="absolute right-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'aparencia' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#F9FAFB] mb-5">Aparência</h3>
              <div>
                <p className="text-sm text-[#9CA3AF] mb-3">Tema</p>
                <div className="grid grid-cols-3 gap-3">
                  {['Dark (padrão)', 'Dark Blue', 'Dark Purple'].map((theme, i) => (
                    <button
                      key={i}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        i === 0
                          ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                          : 'border-white/10 bg-white/3 text-[#9CA3AF] hover:border-white/20'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-[#9CA3AF] mb-3">Densidade</p>
                <div className="grid grid-cols-3 gap-3">
                  {['Compacto', 'Normal', 'Espaçoso'].map((density, i) => (
                    <button
                      key={i}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        i === 1
                          ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                          : 'border-white/10 bg-white/3 text-[#9CA3AF] hover:border-white/20'
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
