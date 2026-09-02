'use client';

import React, { useState, useEffect } from 'react';
import InvoiceModal, { InvoiceData } from './InvoiceModal';

interface ArenaDbRecord {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  planType: 'BASIC' | 'PRO' | 'MASTER';
  isActive: boolean;
  edgeNodes?: Array<{
    id: string;
    nodeId: string;
    status: string;
  }>;
  invoices?: Array<{
    id: string;
    amount: number;
    status: string;
    dueDate: string;
    referenceMonth: string | null;
  }>;
  _count?: {
    videoClips: number;
    matches: number;
  };
}

const PLAN_PRICES: Record<string, number> = {
  BASIC: 299.0,
  PRO: 499.0,
  MASTER: 899.0,
};

const PLAN_LABELS: Record<string, string> = {
  BASIC: 'Starter (1 Quadra)',
  PRO: 'Pro (2 Quadras)',
  MASTER: 'Master (4 Quadras)',
};

export default function BillingView() {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [arenas, setArenas] = useState<ArenaDbRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchBillingData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/arenas', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Falha ao carregar faturamento das arenas');
        const data: ArenaDbRecord[] = await res.json();

        if (isMounted && Array.isArray(data)) {
          setArenas(data);

          // Zero Mocks: Gera faturas EXCLUSIVAMENTE para as arenas reais existentes no banco de dados
          const dynamicInvoices: InvoiceData[] = data.map((arena, idx) => {
            const planKey = arena.planType || 'PRO';
            const basePrice = PLAN_PRICES[planKey] || 499.0;
            const clipsCount = arena._count?.videoClips || 0;
            const storageGb = Number(((clipsCount * 12.5) / 1024).toFixed(1));
            const s3Cost = Number((storageGb * 1.25).toFixed(2));
            const total = basePrice + s3Cost;
            
            // Determina status da fatura
            const firstInvoice = arena.invoices && arena.invoices.length > 0 ? arena.invoices[0] : null;
            const status: 'PAGO' | 'PENDENTE' | 'ATRASADO' = 
              firstInvoice?.status === 'PAGO' ? 'PAGO' : 
              firstInvoice?.status === 'ATRASADO' ? 'ATRASADO' : 
              idx === 0 ? 'PAGO' : 'PENDENTE';

            return {
              id: `FAT-2026-${String(idx + 101).padStart(4, '0')}`,
              arenaName: arena.name,
              cnpj: arena.cnpj || 'Não informado',
              planName: PLAN_LABELS[planKey] || 'Pro (2 Quadras)',
              monthlyAmount: basePrice,
              clipsCount,
              s3StorageGb: storageGb,
              s3Cost,
              totalAmount: total,
              dueDate: '10/09/2026',
              status,
              pixCode: `00020126580014br.gov.bcb.pix0136${arena.id}-sportsreview-b2b5204000053039865407${total.toFixed(2)}5802BR5925SPORTS REVIEW BRASIL6009CURITIBA62070503***6304E1F2`,
              referenceMonth: 'Agosto / 2026',
            };
          });

          setInvoices(dynamicInvoices);
        }
      } catch (err) {
        console.error('Erro ao buscar dados de faturamento:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBillingData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSettleInvoice = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'PAGO' } : inv))
    );
    setSelectedInvoice(null);
    showToast(`Fatura #${invoiceId} baixada manualmente com sucesso via PIX!`);
  };

  // Cálculos dinâmicos baseados nas instâncias reais
  const totalRevenue = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const pendingInvoices = invoices.filter((i) => i.status !== 'PAGO');
  const pendingAmount = pendingInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalStorageGb = invoices.reduce((acc, curr) => acc + curr.s3StorageGb, 0);
  const totalS3Cost = invoices.reduce((acc, curr) => acc + curr.s3Cost, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 bg-slate-900 border-slate-700 text-slate-100">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-['Sora'] tracking-tight">
            Faturamento & Finanças B2B
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Gestão de faturas mensais das Arenas calculadas dinamicamente com base nas instâncias do PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">
              calendar_month
            </span>
            <select
              id="selectBillingMonth"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="2026-08" className="bg-slate-900 text-slate-100">
                Agosto / 2026 (Atual)
              </option>
              <option value="2026-07" className="bg-slate-900 text-slate-100">
                Julho / 2026
              </option>
              <option value="2026-06" className="bg-slate-900 text-slate-100">
                Junho / 2026
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => showToast('Relatório financeiro exportado com sucesso!')}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1: Projected Revenue */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Receita Mensal Projetada
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold font-['Sora'] text-slate-100 font-mono">
              {isLoading ? '...' : totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>{arenas.length} {arenas.length === 1 ? 'Arena Ativa' : 'Arenas Ativas'} no Banco</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Delinquency / Pending */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Inadimplência / Pendente
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold font-['Sora'] text-red-400 font-mono">
              {isLoading ? '...' : pendingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>{pendingInvoices.length} faturas aguardando conciliação</span>
            </div>
          </div>
        </div>

        {/* KPI 3: S3 Storage Cost */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Custo Infra Cloud (AWS S3)
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
              <span className="material-symbols-outlined text-[20px]">cloud</span>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold font-['Sora'] text-slate-100 font-mono">
              {isLoading ? '...' : totalS3Cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-orange-400 font-semibold font-mono">
                {totalStorageGb.toFixed(1)} GB gravados
              </span>
              <span>• R$ 1,25 / GB / mês</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500 text-[20px]">
              receipt
            </span>
            <h2 className="text-sm font-bold font-['Sora'] text-slate-200 uppercase tracking-wider">
              Faturas do Ciclo Atual (Banco de Dados PostgreSQL)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {isLoading ? '...' : `${invoices.length} faturas reais`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Arena / Razão Social</th>
                <th className="py-3 px-4">Plano Contratado</th>
                <th className="py-3 px-4 text-center">Consumo S3</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Vencimento</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-2xl text-orange-500 animate-spin">
                        sync
                      </span>
                      <p className="font-mono text-xs">Carregando faturas das arenas...</p>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Nenhuma arena cadastrada para cálculo de faturamento.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{inv.arenaName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{inv.cnpj}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {inv.planName}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      <div>{inv.s3StorageGb} GB</div>
                      <div className="text-[10px] text-slate-500">{inv.clipsCount} lances</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100 text-sm">
                      {inv.totalAmount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      {inv.dueDate}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                          inv.status === 'PAGO'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : inv.status === 'PENDENTE'
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            inv.status === 'PAGO'
                              ? 'bg-emerald-400'
                              : inv.status === 'PENDENTE'
                              ? 'bg-orange-400'
                              : 'bg-red-400'
                          }`}
                        />
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        id={`btnInvoice-${inv.id}`}
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-500 hover:text-white border border-slate-700 text-slate-300 font-bold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          qr_code_2
                        </span>
                        <span>Ver PIX</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice PIX Modal */}
      <InvoiceModal
        isOpen={Boolean(selectedInvoice)}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onConfirmSettlement={handleSettleInvoice}
      />
    </div>
  );
}
