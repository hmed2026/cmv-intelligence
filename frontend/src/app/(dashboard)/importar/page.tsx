'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useQuery } from '@tanstack/react-query';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatNumber } from '@/lib/utils';
import { ImportHistory } from '@/types';

const ACCEPTED_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt', '.ofx'],
};

const MOCK_HISTORY: ImportHistory[] = [
  {
    id: '1', fileName: 'extrato_bradesco_mai2025.csv', fileType: 'CSV',
    status: 'COMPLETED', totalRows: 245, processedRows: 245,
    createdAt: '2025-05-14T10:30:00Z', completedAt: '2025-05-14T10:31:22Z',
  },
  {
    id: '2', fileName: 'notas_fiscais_abril.xlsx', fileType: 'XLSX',
    status: 'COMPLETED', totalRows: 128, processedRows: 128,
    createdAt: '2025-05-01T09:15:00Z', completedAt: '2025-05-01T09:15:45Z',
  },
  {
    id: '3', fileName: 'extrato_itau_abr2025.ofx', fileType: 'OFX',
    status: 'PROCESSING', totalRows: 312, processedRows: 180,
    createdAt: '2025-04-30T14:00:00Z',
  },
  {
    id: '4', fileName: 'relatorio_errado.txt', fileType: 'TXT',
    status: 'FAILED', totalRows: 0, processedRows: 0,
    createdAt: '2025-04-28T11:00:00Z',
    errors: ['Formato de arquivo não reconhecido'],
  },
];

function FileIcon({ type }: { type: string }) {
  if (type.includes('pdf')) return <FileText size={20} className="text-red-400" />;
  return <FileSpreadsheet size={20} className="text-emerald-400" />;
}

export default function ImportarPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { data: historyData, isLoading: historyLoading, refetch } = useQuery({
    queryKey: ['import-history'],
    queryFn: () => uploadApi.history(),
    placeholderData: { data: MOCK_HISTORY } as { data: ImportHistory[] },
  });

  const history = historyData?.data ?? MOCK_HISTORY;

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadError('');

    for (const file of files) {
      try {
        await uploadApi.upload(file, (progress) => {
          setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
        });
      } catch {
        setUploadError(`Erro ao enviar ${file.name}`);
      }
    }

    setUploading(false);
    setFiles([]);
    setUploadProgress({});
    refetch();
  };

  const statusIcon = (status: ImportHistory['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'FAILED': return <XCircle size={16} className="text-red-400" />;
      case 'PROCESSING': return <Loader2 size={16} className="text-yellow-400 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-[#F9FAFB]">Importar Dados</h2>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Importe extratos, planilhas e notas fiscais
        </p>
      </motion.div>

      {/* Dropzone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
            ${isDragActive
              ? 'border-blue-500/60 bg-blue-500/10'
              : 'border-white/10 bg-white/2 hover:border-blue-500/30 hover:bg-blue-500/5'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                isDragActive
                  ? 'bg-blue-500/20 animate-pulse-glow'
                  : 'bg-white/5'
              }`}
            >
              <Upload
                size={28}
                className={isDragActive ? 'text-blue-400' : 'text-[#4B5563]'}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F9FAFB]">
                {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                CSV, XLSX, XLS, PDF, OFX, TXT — máximo 50MB por arquivo
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#4B5563]">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">CSV</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">XLSX</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">OFX</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">PDF</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Selected Files */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#F9FAFB]">
                {files.length} arquivo(s) selecionado(s)
              </p>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiles([])}
                >
                  Limpar tudo
                </Button>
              )}
            </div>

            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5"
              >
                <FileIcon type={file.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#F9FAFB] truncate">{file.name}</p>
                  <p className="text-[10px] text-[#6B7280]">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  )}
                </div>
                {!uploading && (
                  <button
                    onClick={() => removeFile(i)}
                    className="p-1 rounded-lg text-[#6B7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}

            {uploadError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{uploadError}</p>
              </div>
            )}

            <Button
              variant="primary"
              fullWidth
              loading={uploading}
              icon={<Upload size={15} />}
              onClick={handleUpload}
            >
              {uploading ? 'Enviando...' : `Importar ${files.length} arquivo(s)`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import History */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-[#F9FAFB]">Histórico de Importações</h3>
        </div>

        {historyLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 skeleton rounded-xl" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Clock size={32} className="mx-auto text-[#4B5563] mb-3 animate-float" />
            <p className="text-sm text-[#6B7280]">Nenhuma importação ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors"
              >
                {statusIcon(item.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F9FAFB] truncate">
                    {item.fileName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#6B7280]">{item.fileType}</span>
                    <span className="text-[10px] text-[#4B5563]">•</span>
                    <span className="text-[10px] text-[#6B7280]">
                      {formatDate(item.createdAt, 'datetime')}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={item.status} />
                  {item.status !== 'FAILED' && (
                    <p className="text-[10px] text-[#6B7280] mt-1">
                      {formatNumber(item.processedRows)}/{formatNumber(item.totalRows)} linhas
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
