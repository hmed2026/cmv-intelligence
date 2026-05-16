'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Hash,
  Check,
} from 'lucide-react';
import { companyApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Company } from '@/types';
import { getInitials } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const MOCK_COMPANIES: Company[] = [
  {
    id: '1', name: 'Empresa Principal Ltda', cnpj: '12.345.678/0001-99',
    primaryColor: '#3B82F6', secondaryColor: '#1E40AF',
    email: 'contato@empresa.com', phone: '(11) 9999-8888',
    address: 'Rua das Flores, 123 — São Paulo/SP',
  },
  {
    id: '2', name: 'Filial Sul S/A', cnpj: '98.765.432/0001-11',
    primaryColor: '#10B981', secondaryColor: '#047857',
    email: 'sul@empresa.com', phone: '(51) 9888-7777',
    address: 'Av. Porto Alegre, 456 — Porto Alegre/RS',
  },
];

export default function EmpresasPage() {
  const { company: activeCompany, selectCompany } = useAuth();
  const [addModal, setAddModal] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyApi.list(),
    placeholderData: { data: MOCK_COMPANIES } as { data: Company[] },
  });

  const companies = data?.data ?? MOCK_COMPANIES;

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Empresas</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Gerencie as empresas cadastradas
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setAddModal(true)}
        >
          Nova Empresa
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card glass-card-hover p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${company.primaryColor}, ${company.secondaryColor})`,
                      boxShadow: `0 0 20px ${company.primaryColor}30`,
                    }}
                  >
                    {getInitials(company.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#F9FAFB]">{company.name}</h3>
                      {activeCompany?.id === company.id && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                          <Check size={9} />
                          Ativa
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">{company.cnpj}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {activeCompany?.id !== company.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectCompany(company)}
                    >
                      Ativar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditCompany(company)}
                  >
                    <Edit2 size={14} />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {company.email && (
                  <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                    <Mail size={12} className="text-[#6B7280] shrink-0" />
                    <span className="truncate">{company.email}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                    <Phone size={12} className="text-[#6B7280] shrink-0" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                    <MapPin size={12} className="text-[#6B7280] shrink-0" />
                    <span className="truncate">{company.address}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Nova Empresa"
        description="Adicione uma nova empresa ao sistema"
        size="md"
      >
        <div className="space-y-4 mt-2">
          <Input label="Nome da Empresa" placeholder="Ex: Minha Empresa Ltda" prefixIcon={<Building2 size={15} />} />
          <Input label="CNPJ" placeholder="00.000.000/0001-00" prefixIcon={<Hash size={15} />} />
          <Input label="E-mail" type="email" placeholder="contato@empresa.com" prefixIcon={<Mail size={15} />} />
          <Input label="Telefone" placeholder="(00) 00000-0000" prefixIcon={<Phone size={15} />} />
          <Input label="Endereço" placeholder="Rua, número, cidade/estado" prefixIcon={<MapPin size={15} />} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setAddModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" fullWidth>
              Salvar Empresa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        isOpen={!!editCompany}
        onClose={() => setEditCompany(null)}
        title="Editar Empresa"
        size="md"
      >
        {editCompany && (
          <div className="space-y-4 mt-2">
            <Input label="Nome da Empresa" defaultValue={editCompany.name} prefixIcon={<Building2 size={15} />} />
            <Input label="CNPJ" defaultValue={editCompany.cnpj} prefixIcon={<Hash size={15} />} />
            <Input label="E-mail" type="email" defaultValue={editCompany.email} prefixIcon={<Mail size={15} />} />
            <Input label="Telefone" defaultValue={editCompany.phone} prefixIcon={<Phone size={15} />} />
            <Input label="Endereço" defaultValue={editCompany.address} prefixIcon={<MapPin size={15} />} />
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" fullWidth onClick={() => setEditCompany(null)}>
                Cancelar
              </Button>
              <Button variant="primary" fullWidth>
                Salvar Alterações
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
