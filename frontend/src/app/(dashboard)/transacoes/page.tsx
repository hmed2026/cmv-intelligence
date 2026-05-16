'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  ArrowLeftRight,
  X,
} from 'lucide-react';
import { transactionApi } from '@/lib/api';
import { TransactionTable } from '@/components/tables/TransactionTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction, TransactionType, FilterParams } from '@/types';
import { formatCurrency, debounce } from '@/lib/utils';
import { TransactionModal } from '@/components/ui/TransactionModal';
import { useToast } from '@/components/ui/Toast';

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'REVENUE', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'CMV', label: 'CMV' },
  { value: 'TAX', label: 'Imposto' },
  { value: 'WITHDRAWAL', label: 'Retirada' },
  { value: 'TRANSFER', label: 'Transferência' },
];

const LIMIT_OPTIONS = [
  { value: '10', label: '10 por página' },
  { value: '25', label: '25 por página' },
  { value: '50', label: '50 por página' },
  { value: '100', label: '100 por página' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2025-05-15', description: 'Venda Produto A', amount: 12500, type: 'REVENUE', category: 'Vendas', source: 'MANUAL', aiClassified: false, createdAt: '2025-05-15' },
  { id: '2', date: '2025-05-14', description: 'Compra de insumos', amount: 4200, type: 'CMV', category: 'CMV / Estoque', source: 'IMPORT', aiClassified: true, aiConfidence: 0.94, createdAt: '2025-05-14' },
  { id: '3', date: '2025-05-14', description: 'Folha de pagamento', amount: 9800, type: 'EXPENSE', category: 'Pessoal', source: 'MANUAL', aiClassified: false, createdAt: '2025-05-14' },
  { id: '4', date: '2025-05-13', description: 'Venda Produto B', amount: 8750, type: 'REVENUE', category: 'Vendas', source: 'AI', aiClassified: true, aiConfidence: 0.88, createdAt: '2025-05-13' },
  { id: '5', date: '2025-05-13', description: 'DARF IRPJ', amount: 3100, type: 'TAX', category: 'Impostos', source: 'MANUAL', aiClassified: false, createdAt: '2025-05-13' },
  { id: '6', date: '2025-05-12', description: 'Aluguel comercial', amount: 6800, type: 'EXPENSE', category: 'Aluguel', source: 'IMPORT', aiClassified: true, aiConfidence: 0.99, createdAt: '2025-05-12' },
  { id: '7', date: '2025-05-11', description: 'Serviços consultoria', amount: 5200, type: 'REVENUE', category: 'Serviços', source: 'MANUAL', aiClassified: false, createdAt: '2025-05-11' },
  { id: '8', date: '2025-05-10', description: 'Google Ads', amount: 1800, type: 'EXPENSE', category: 'Marketing', source: 'IMPORT', aiClassified: true, aiConfidence: 0.92, createdAt: '2025-05-10' },
  { id: '9', date: '2025-05-09', description: 'Venda Produto C', amount: 15000, type: 'REVENUE', category: 'Vendas', source: 'MANUAL', aiClassified: false, createdAt: '2025-05-09' },
  { id: '10', date: '2025-05-08', description: 'Energia elétrica', amount: 920, type: 'EXPENSE', category: 'Utilidades', source: 'IMPORT', aiClassified: true, aiConfidence: 0.97, createdAt: '2025-05-08' },
];

export default function TransacoesPage() {
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    limit: 25,
  });
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<Transaction | null>(null);
  const [editModal, setEditModal] = useState<Transaction | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      toast.success('Transação excluída');
      setDeleteModal(null);
    },
    onError: () => toast.error('Erro ao excluir', 'Não foi possível excluir a transação.'),
  });

  const debouncedSearch = debounce((val: string) => {
    setFilters((prev) => ({ ...prev, search: val, page: 1 }));
  }, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionApi.list(filters),
    placeholderData: {
      data: {
        data: MOCK_TRANSACTIONS,
        total: MOCK_TRANSACTIONS.length,
        page: 1,
        limit: 25,
        totalPages: 1,
      },
    } as { data: { data: Transaction[]; total: number; page: number; limit: number; totalPages: number } },
  });

  const transactions = data?.data?.data ?? MOCK_TRANSACTIONS;
  const total = data?.data?.total ?? MOCK_TRANSACTIONS.length;
  const totalPages = data?.data?.totalPages ?? 1;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Transações</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {total.toLocaleString('pt-BR')} registros encontrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Download size={14} />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setCreateModal(true)}>
            Nova Transação
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 flex flex-wrap items-center gap-3"
      >
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar transações..."
            prefixIcon={<Search size={14} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debouncedSearch(e.target.value);
            }}
          />
        </div>
        <Select
          options={TYPE_OPTIONS}
          value={filters.type ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              type: (e.target.value as TransactionType) || undefined,
              page: 1,
            }))
          }
          containerClassName="min-w-[160px]"
        />
        <Input
          type="date"
          placeholder="Data início"
          value={filters.startDate ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, startDate: e.target.value, page: 1 }))
          }
          containerClassName="min-w-[140px]"
        />
        <Input
          type="date"
          placeholder="Data fim"
          value={filters.endDate ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, endDate: e.target.value, page: 1 }))
          }
          containerClassName="min-w-[140px]"
        />
        {(filters.type || filters.startDate || filters.endDate || search) && (
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={14} />}
            onClick={() => {
              setFilters({ page: 1, limit: filters.limit });
              setSearch('');
            }}
          >
            Limpar
          </Button>
        )}
      </motion.div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20"
        >
          <span className="text-sm text-blue-400">
            {selectedIds.length} selecionado(s)
          </span>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />}>
            Excluir selecionados
          </Button>
          <button
            onClick={() => setSelectedIds([])}
            className="ml-auto text-xs text-[#6B7280] hover:text-[#F9FAFB] transition-colors"
          >
            Cancelar seleção
          </button>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card overflow-hidden"
      >
        <TransactionTable
          transactions={transactions}
          loading={isLoading}
          onEdit={(t) => setEditModal(t)}
          onDelete={(t) => setDeleteModal(t)}
          onSelectionChange={setSelectedIds}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Select
                options={LIMIT_OPTIONS}
                value={String(filters.limit)}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))
                }
                containerClassName="w-36"
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={filters.page === 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
              >
                Anterior
              </Button>
              <span className="px-3 text-xs text-[#9CA3AF]">
                {filters.page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={filters.page === totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Excluir Transação"
        description={deleteModal ? `Tem certeza que deseja excluir "${deleteModal.description}"?` : ''}
        size="sm"
      >
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" fullWidth onClick={() => setDeleteModal(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            fullWidth
            loading={deleteMutation.isPending}
            onClick={() => deleteModal && deleteMutation.mutate(deleteModal.id)}
          >
            Excluir
          </Button>
        </div>
      </Modal>

      {/* Create Modal */}
      <TransactionModal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
      />

      {/* Edit Modal */}
      <TransactionModal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        transaction={editModal}
      />
    </div>
  );
}
