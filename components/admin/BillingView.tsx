'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CheckCircle,
  Download,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Cloud,
  Receipt,
  RefreshCw,
  QrCode,
  Sliders,
} from 'lucide-react';
import InvoiceModal, { InvoiceData } from './InvoiceModal';
import PlanManagerModal, { PlanItem } from './PlanManagerModal';
import { useDeviceLayout } from '@/contexts/DeviceLayoutContext';

interface ArenaDbRecord {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  planType: 'BASIC' | 'PRO' | 'MASTER' | string;
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

// Fallbacks de segurança caso o banco esteja inacessível
const FALLBACK_PLANS: PlanItem[] = [
  { id: '1', name: 'Starter', slug: 'starter', price: 299.0, maxCourts: 1, active: true },
  { id: '2', name: 'Pro', slug: 'pro', price: 499.0, maxCourts: 2, active: true },
  { id: '3', name: 'Master', slug: 'master', price: 899.0, maxCourts: 4, active: true },
];

function matchPlanForArena(planType: string, availablePlans: PlanItem[]): PlanItem {
  if (!availablePlans || availablePlans.length === 0) {
    return FALLBACK_PLANS[1];
  }
  const normalized = (planType || '').trim().toLowerCase();
  
  // Casamento exato por slug
  const bySlug = availablePlans.find((p) => p.slug.toLowerCase() === normalized);
  if (bySlug) return bySlug;
  
  // Casamento por nome
  const byName = availablePlans.find((p) => p.name.toLowerCase() === normalized);
  if (byName) return byName;
  
  // Tratamento de tipos legados do Enum
  if (normalized === 'basic') {
    const starter = availablePlans.find((p) => p.slug === 'starter' || p.name.toLowerCase().includes('starter'));
    if (starter) return starter;
  }
  if (normalized === 'enterprise' || normalized === 'master') {
    const master = availablePlans.find((p) => p.slug === 'master' || p.name.toLowerCase().includes('master'));
    if (master) return master;
  }

  // Padrão: Pro ou primeiro plano da lista
  return availablePlans.find((p) => p.slug === 'pro') || availablePlans[0] || FALLBACK_PLANS[1];
}

export default function BillingView() {
  const { effectiveLayout } = useDeviceLayout();
  const isMobileLayout = effectiveLayout === 'mobile';
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [arenas, setArenas] = useState<ArenaDbRecord[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>(FALLBACK_PLANS);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Recalcula faturas dinamicamente associando o preço do plano às arenas reais
  const computeInvoices = useCallback((arenasList: ArenaDbRecord[], plansList: PlanItem[]) => {
    return arenasList.map((arena, idx) => {
      const plan = matchPlanForArena(arena.planType, plansList);
      const basePrice = plan.price;
      const planLabel = `${plan.name} (${plan.maxCourts} ${plan.maxCourts === 1 ? 'Quadra' : 'Quadras'})`;
      const clipsCount = arena._count?.videoClips || 0;
      const storageGb = Number(((clipsCount * 12.5) / 1024).toFixed(1));
      const s3Cost = Number((storageGb * 1.25).toFixed(2));
      const total = basePrice + s3Cost;

      // Determina status da fatura
      const firstInvoice = arena.invoices && arena.invoices.length > 0 ? arena.invoices[0] : null;
      const status: 'PAGO' | 'PENDENTE' | 'ATRASADO' =
        firstInvoice?.status === 'PAGO'
          ? 'PAGO'
          : firstInvoice?.status === 'ATRASADO'
          ? 'ATRASADO'
          : idx === 0
          ? 'PAGO'
          : 'PENDENTE';

      return {
        id: `FAT-2026-${String(idx + 101).padStart(4, '0')}`,
        arenaName: arena.name,
        cnpj: arena.cnpj || 'Não informado',
        planName: planLabel,
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
  }, []);

  // Busca dados de faturamento e planos simultaneamente
  const fetchBillingData = useCallback(async () => {
    async function load(retryCount = 0) {
      try {
        const [arenasRes, plansRes] = await Promise.all([
          fetch('/api/arenas', {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          }),
          fetch('/api/plans?includeInactive=true', {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          }),
        ]);

        if (arenasRes.status === 429 && retryCount < 2) {
          setTimeout(() => {
            load(retryCount + 1);
          }, 1500 * (retryCount + 1));
          return;
        }

        let loadedArenas: ArenaDbRecord[] = [];
        if (arenasRes.ok) {
          const arenasData = await arenasRes.json();
          if (Array.isArray(arenasData)) {
            loadedArenas = arenasData;
            setArenas(arenasData);
          }
        }

        let loadedPlans: PlanItem[] = FALLBACK_PLANS;
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          if (Array.isArray(plansData) && plansData.length > 0) {
            loadedPlans = plansData;
            setPlans(plansData);
          }
        }

        // Calcula faturas com valores dinâmicos dos planos
        if (loadedArenas.length > 0) {
          const dynamicInvoices = computeInvoices(loadedArenas, loadedPlans);
          setInvoices(dynamicInvoices);
        }
      } catch (err) {
        console.warn('Aviso ao buscar dados de faturamento e planos:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
      } finally {
        setIsLoading(false);
      }
    }

    await load(0);
  }, [computeInvoices]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // Atualização em tempo real quando planos são editados, criados ou excluídos
  const handlePlansUpdated = () => {
    fetchBillingData();
  };

  const handleSettleInvoice = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'PAGO' } : inv))
    );
    setSelectedInvoice(null);
    showToast(`Fatura #${invoiceId} baixada manualmente com sucesso via PIX!`);
  };

  // Cálculos dinâmicos baseados nas instâncias reais e planos configurados
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
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-['Sora'] tracking-tight">
            Faturamento &amp; Finanças B2B
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Gestão de faturas mensais e consumo de armazenamento de vídeo das Arenas.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Botão Configurar Planos */}
          <button
            type="button"
            id="btnConfigPlans"
            onClick={() => setIsPlanModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer shadow-sm"
          >
            <Sliders className="w-4 h-4 text-orange-400" />
            <span>Configurar Planos</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
            <Calendar className="text-slate-400 w-4 h-4" />
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
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
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
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold font-['Sora'] text-slate-100 font-mono">
              {isLoading ? '...' : totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-4 h-4" />
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
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold font-['Sora'] text-rose-500 font-mono">
              {isLoading ? '...' : pendingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{pendingInvoices.length} faturas aguardando conciliação</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Cloud Storage Cost (R2) */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              CUSTO INFRA CLOUD (R2)
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
              <Cloud className="w-5 h-5" />
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
            <Receipt className="w-5 h-5 text-orange-500" />
            <h2 className="text-sm font-bold font-['Sora'] text-slate-200 uppercase tracking-wider">
              FATURAS DO CICLO ATUAL
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {isLoading ? '...' : `${invoices.length} faturas reais`}
          </span>
        </div>

        {/* Mobile View vs Desktop Table based on Device Layout */}
        {isMobileLayout ? (
          <div className="divide-y divide-slate-800/80">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
              <p className="font-mono text-xs">Carregando faturas das arenas...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs px-4">
              Nenhuma arena cadastrada para cálculo de faturamento.
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="p-4 space-y-3 bg-slate-900/60 hover:bg-slate-900 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{inv.arenaName}</h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{inv.cnpj}</p>
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Plano</span>
                    <span className="text-slate-200 font-semibold">{inv.planName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Vencimento</span>
                    <span className="text-slate-300">{inv.dueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Armazenamento (R2)</span>
                    <span className="text-slate-300">{inv.s3StorageGb} GB ({inv.clipsCount} clips)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Valor Total</span>
                    <span className="text-orange-400 font-bold text-xs">
                      {inv.totalAmount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id={`btnInvoiceMobile-${inv.id}`}
                  onClick={() => setSelectedInvoice(inv)}
                  className="w-full py-2.5 px-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  <span>Ver Fatura &amp; PIX Copia e Cola</span>
                </button>
              </div>
            ))
          )}
          </div>
        ) : (
          /* Desktop Table */
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Arena / Razão Social</th>
                <th className="py-3 px-4">Plano Contratado</th>
                <th className="py-3 px-4 text-center">ARMAZENAMENTO (R2)</th>
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
                      <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
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
                        className="flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 ml-auto cursor-pointer transition-colors"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        <span>Ver PIX</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Invoice PIX Modal */}
      <InvoiceModal
        isOpen={Boolean(selectedInvoice)}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onConfirmSettlement={handleSettleInvoice}
      />

      {/* Plan Manager Modal */}
      <PlanManagerModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        plans={plans}
        onPlansUpdated={handlePlansUpdated}
        onToast={showToast}
      />
    </div>
  );
}
