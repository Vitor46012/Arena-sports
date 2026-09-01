'use client';

import React, { useState } from 'react';

export interface InvoiceData {
  id: string;
  arenaName: string;
  cnpj: string;
  planName: string;
  monthlyAmount: number;
  clipsCount: number;
  s3StorageGb: number;
  s3Cost: number;
  totalAmount: number;
  dueDate: string;
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO';
  pixCode: string;
  referenceMonth: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  invoice: InvoiceData | null;
  onClose: () => void;
  onConfirmSettlement: (invoiceId: string) => void;
}

export default function InvoiceModal({
  isOpen,
  invoice,
  onClose,
  onConfirmSettlement,
}: InvoiceModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleCopyPix = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(invoice.pixCode).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSettle = () => {
    onConfirmSettlement(invoice.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <div>
              <h3 className="font-['Sora'] font-bold text-sm text-slate-100">
                Fatura #{invoice.id} • {invoice.referenceMonth}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">{invoice.arenaName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Financial Breakdown Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Plano Base ({invoice.planName}):</span>
              <span className="text-slate-200 font-semibold font-mono">
                {invoice.monthlyAmount.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">
                Custo Armazenamento S3 ({invoice.s3StorageGb} GB):
              </span>
              <span className="text-slate-200 font-semibold font-mono">
                {invoice.s3Cost.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total de Cortes de Lance:</span>
              <span className="text-orange-400 font-bold font-mono">
                {invoice.clipsCount} lances processados
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Valor Total da Fatura:
              </span>
              <span className="text-lg font-bold font-['Sora'] text-emerald-400 font-mono">
                {invoice.totalAmount.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>

          {/* PIX Copia e Cola Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-orange-500 text-[16px]">qr_code_2</span>
                Código PIX Copia e Cola (Banco Central do Brasil)
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Vencimento: {invoice.dueDate}</span>
            </div>
            <div className="relative">
              <textarea
                readOnly
                rows={3}
                value={invoice.pixCode}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 focus:outline-none resize-none selection:bg-orange-500 selection:text-white"
              />
            </div>
            <button
              type="button"
              id="btnCopyPix"
              onClick={handleCopyPix}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                copied
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Código PIX Copiado com Sucesso!' : 'Copiar Chave PIX'}</span>
            </button>
          </div>

          {/* Manual Settlement Notice */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-2.5 text-xs text-slate-400">
            <span className="material-symbols-outlined text-orange-500 text-[18px] shrink-0 mt-0.5">
              info
            </span>
            <p>
              Ao realizar a <strong className="text-slate-200">Baixa Manual</strong>, o status da
              fatura será alterado para <span className="text-emerald-400 font-semibold">PAGO</span> e a
              licença do Mini PC N100 da arena será renovada automaticamente por mais 30 dias.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btnConfirmSettlement"
            onClick={handleSettle}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Confirmar Baixa Manual PIX</span>
          </button>
        </div>
      </div>
    </div>
  );
}
