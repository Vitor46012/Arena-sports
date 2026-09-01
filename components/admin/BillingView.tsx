'use client';

import React, { useState } from 'react';
import InvoiceModal, { InvoiceData } from './InvoiceModal';

const INITIAL_INVOICES: InvoiceData[] = [
  {
    id: 'FAT-2026-0811',
    arenaName: 'Arena Society Paranaguá (PR)',
    cnpj: '45.123.890/0001-22',
    planName: 'Enterprise 4 Quadras',
    monthlyAmount: 3490.0,
    clipsCount: 1420,
    s3StorageGb: 142,
    s3Cost: 177.5,
    totalAmount: 3667.5,
    dueDate: '10/09/2026',
    status: 'PAGO',
    pixCode: '00020126580014br.gov.bcb.pix0136789456123-sportsreview-pr52040000530398654073667.505802BR5925SPORTS REVIEW BRASIL6009CURITIBA62070503***6304E1F2',
    referenceMonth: 'Agosto / 2026',
  },
  {
    id: 'FAT-2026-0812',
    arenaName: 'Clube Pinheiros Society (SP)',
    cnpj: '12.345.678/0001-90',
    planName: 'Pro 2 Quadras',
    monthlyAmount: 2290.0,
    clipsCount: 980,
    s3StorageGb: 98,
    s3Cost: 122.5,
    totalAmount: 2412.5,
    dueDate: '15/09/2026',
    status: 'PENDENTE',
    pixCode: '00020126580014br.gov.bcb.pix0136123456789-sportsreview-sp52040000530398654072412.505802BR5925SPORTS REVIEW BRASIL6009SAO PAULO62070503***6304B7A9',
    referenceMonth: 'Agosto / 2026',
  },
  {
    id: 'FAT-2026-0813',
    arenaName: 'Complexo Esportivo BH (MG)',
    cnpj: '98.765.432/0001-11',
    planName: 'Pro 2 Quadras',
    monthlyAmount: 2290.0,
    clipsCount: 1105,
    s3StorageGb: 110,
    s3Cost: 137.5,
    totalAmount: 2427.5,
    dueDate: '05/09/2026',
    status: 'ATRASADO',
    pixCode: '00020126580014br.gov.bcb.pix0136987654321-sportsreview-mg52040000530398654072427.505802BR5925SPORTS REVIEW BRASIL6009BELO HORIZONTE62070503***6304C991',
    referenceMonth: 'Agosto / 2026',
  },
  {
    id: 'FAT-2026-0814',
    arenaName: 'Quadras Gávea Beach & Fut (RJ)',
    cnpj: '33.222.111/0001-05',
    planName: 'Enterprise 4 Quadras',
    monthlyAmount: 3490.0,
    clipsCount: 1650,
    s3StorageGb: 165,
    s3Cost: 206.25,
    totalAmount: 3696.25,
    dueDate: '10/09/2026',
    status: 'PAGO',
    pixCode: '00020126580014br.gov.bcb.pix0136332221110-sportsreview-rj52040000530398654073696.255802BR5925SPORTS REVIEW BRASIL6009RIO DE JANEIRO62070503***6304D442',
    referenceMonth: 'Agosto / 2026',
  },
  {
    id: 'FAT-2026-0815',
    arenaName: 'Arena Beira-Rio Society (RS)',
    cnpj: '77.888.999/0001-33',
    planName: 'Starter 1 Quadra',
    monthlyAmount: 1490.0,
    clipsCount: 420,
    s3StorageGb: 42,
    s3Cost: 52.5,
    totalAmount: 1542.5,
    dueDate: '12/09/2026',
    status: 'PAGO',
    pixCode: '00020126580014br.gov.bcb.pix0136778889990-sportsreview-rs52040000530398654071542.505802BR5925SPORTS REVIEW BRASIL6009PORTO ALEGRE62070503***6304F558',
    referenceMonth: 'Agosto / 2026',
  },
];

export default function BillingView() {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [invoices, setInvoices] = useState<InvoiceData[]>(INITIAL_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSettleInvoice = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'PAGO' } : inv))
    );
    setSelectedInvoice(null);
    showToast(`Fatura #${invoiceId} baixada manualmente com sucesso via PIX!`);
  };

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
            Gestão de faturas mensais das Arenas, cobrança de armazenamento S3 e conciliação PIX.
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
            onClick={() => showToast('Relatório financeiro exportado em CSV/PDF!')}
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
              R$ 42.850,00
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>+18.4% em relação ao mês anterior (14 Arenas)</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Delinquency / Default rate */}
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
              R$ 4.840,00
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>2 faturas aguardando conciliação PIX</span>
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
              R$ 696,45
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-orange-400 font-semibold font-mono">557 GB gravados</span>
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
              Faturas do Ciclo Atual
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {invoices.length} faturas geradas
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
              {invoices.map((inv) => (
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
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-500 hover:text-white border border-slate-700 text-slate-300 font-bold text-xs transition-all inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        qr_code_2
                      </span>
                      <span>Ver PIX</span>
                    </button>
                  </td>
                </tr>
              ))}
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
