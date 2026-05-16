'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DollarSign, Tag, Calendar, FileText, CreditCard, Bot } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { transactionApi } from '@/lib/api';
import { Transaction, TransactionType } from '@/types';

interface TransactionForm {
  date: string;
  description: string;
  amount: string;
  type: TransactionType;
  category: string;
  bankAccount: string;
  notes: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

const TYPE_OPTIONS = [
  { value: 'REVENUE', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'CMV', label: 'CMV — Custo da Mercadoria' },
  { value: 'TAX', label: 'Imposto / Taxa' },
  { value: 'WITHDRAWAL', label: 'Retirada dos Sócios' },
  { value: 'TRANSFER', label: 'Transferência' },
];

const CATEGORY_BY_TYPE: Record<TransactionType, string[]> = {
  REVENUE: ['Vendas', 'Serviços', 'Comissões', 'Juros Recebidos', 'Outros'],
  EXPENSE: ['Pessoal', 'Aluguel', 'Marketing', 'Utilidades', 'Tecnologia', 'Transporte', 'Outros'],
  CMV: ['Matéria-Prima', 'Mercadoria', 'Insumos', 'Embalagem', 'Outros'],
  TAX: ['IRPJ', 'CSLL', 'PIS', 'COFINS', 'ISS', 'ICMS', 'DAS', 'INSS', 'FGTS', 'Outros'],
  WITHDRAWAL: ['Pró-Labore', 'Distribuição de Lucros', 'Outros'],
  TRANSFER: ['Entre Contas', 'Aplicação', 'Resgate', 'Outros'],
};

export function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isEditing = !!transaction;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransactionForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'REVENUE',
      description: '',
      amount: '',
      category: '',
      bankAccount: '',
      notes: '',
    },
  });

  const selectedType = watch('type') as TransactionType;
  const categories = CATEGORY_BY_TYPE[selectedType] ?? [];

  useEffect(() => {
    if (transaction) {
      reset({
        date: transaction.date.split('T')[0],
        description: transaction.description,
        amount: String(transaction.amount),
        type: transaction.type,
        category: transaction.category ?? '',
        bankAccount: transaction.bankAccount ?? '',
        notes: transaction.notes ?? '',
      });
    } else {
      reset({
        date: new Date().toISOString().split('T')[0],
        type: 'REVENUE',
        description: '',
        amount: '',
        category: '',
        bankAccount: '',
        notes: '',
      });
    }
  }, [transaction, reset, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Transaction>) => transactionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      toast.success('Transação criada', 'Lançamento registrado com sucesso.');
      onClose();
    },
    onError: () => toast.error('Erro ao criar', 'Verifique os dados e tente novamente.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) =>
      transactionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      toast.success('Transação atualizada', 'Alterações salvas com sucesso.');
      onClose();
    },
    onError: () => toast.error('Erro ao atualizar', 'Não foi possível salvar as alterações.'),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (formData: TransactionForm) => {
    const payload: Partial<Transaction> = {
      date: formData.date,
      description: formData.description,
      amount: parseFloat(formData.amount.replace(',', '.')),
      type: formData.type,
      category: formData.category || undefined,
      bankAccount: formData.bankAccount || undefined,
      notes: formData.notes || undefined,
      source: 'MANUAL',
    };

    if (isEditing && transaction) {
      updateMutation.mutate({ id: transaction.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const typeColors: Record<TransactionType, string> = {
    REVENUE: '#10B981',
    EXPENSE: '#EF4444',
    CMV: '#F97316',
    TAX: '#F59E0B',
    WITHDRAWAL: '#8B5CF6',
    TRANSFER: '#6B7280',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Transação' : 'Nova Transação'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
        {/* Type selector */}
        <div>
          <label className="text-xs font-medium text-[#9CA3AF] mb-2 block">
            Tipo de Movimentação
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.slice(0, 6).map((opt) => {
              const isSelected = selectedType === opt.value;
              const color = typeColors[opt.value as TransactionType];
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setValue('type', opt.value as TransactionType);
                    setValue('category', '');
                  }}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all border"
                  style={{
                    backgroundColor: isSelected ? `${color}18` : 'rgba(255,255,255,0.03)',
                    borderColor: isSelected ? `${color}50` : 'rgba(255,255,255,0.08)',
                    color: isSelected ? color : '#9CA3AF',
                  }}
                >
                  {opt.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Description + Amount row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Descrição"
            placeholder="Ex: Venda Produto A"
            prefixIcon={<FileText size={14} />}
            error={errors.description?.message}
            {...register('description', { required: 'Descrição obrigatória' })}
          />
          <Input
            label="Valor (R$)"
            placeholder="0,00"
            prefixIcon={<DollarSign size={14} />}
            error={errors.amount?.message}
            {...register('amount', {
              required: 'Valor obrigatório',
              validate: (v) =>
                !isNaN(parseFloat(v.replace(',', '.'))) || 'Valor inválido',
            })}
          />
        </div>

        {/* Date + Category row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data"
            type="date"
            prefixIcon={<Calendar size={14} />}
            error={errors.date?.message}
            {...register('date', { required: 'Data obrigatória' })}
          />
          <div>
            <label className="text-xs font-medium text-[#9CA3AF] mb-1.5 block">Categoria</label>
            <Select
              options={[
                { value: '', label: 'Selecione a categoria' },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
              {...register('category')}
            />
          </div>
        </div>

        {/* Bank account + Notes row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Conta Bancária (opcional)"
            placeholder="Ex: Banco do Brasil"
            prefixIcon={<CreditCard size={14} />}
            {...register('bankAccount')}
          />
          <Input
            label="Observações (opcional)"
            placeholder="Notas adicionais"
            prefixIcon={<Tag size={14} />}
            {...register('notes')}
          />
        </div>

        {/* AI hint */}
        {!isEditing && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/8 border border-blue-500/15">
            <Bot size={14} className="text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-[#6B7280] leading-relaxed">
              A IA classificará automaticamente transações importadas. Para lançamentos manuais,
              selecione o tipo e categoria acima.
            </p>
          </div>
        )}

        {/* Error message */}
        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-xs text-red-400 text-center">
            Erro ao salvar transação. Tente novamente.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" fullWidth type="submit" loading={isLoading}>
            {isEditing ? 'Salvar Alterações' : 'Criar Transação'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
