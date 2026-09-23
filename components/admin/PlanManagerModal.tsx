'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  Sliders,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export interface PlanItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  maxCourts: number;
  description?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PlanManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: PlanItem[];
  onPlansUpdated: () => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export default function PlanManagerModal({
  isOpen,
  onClose,
  plans,
  onPlansUpdated,
  onToast,
}: PlanManagerModalProps) {
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '299,00',
    maxCourts: '1',
    description: '',
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (plan: PlanItem) => {
    setEditingPlanId(plan.id);
    setFormData({
      name: plan.name,
      price: plan.price.toFixed(2).replace('.', ','),
      maxCourts: String(plan.maxCourts),
      description: plan.description || '',
      active: plan.active,
    });
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setFormData({
      name: '',
      price: '299,00',
      maxCourts: '1',
      description: '',
      active: true,
    });
    setFormError(null);
  };

  const parsePriceInput = (val: string): number => {
    // Limpa caracteres estranhos exceto dígitos, vírgulas e pontos
    const clean = val.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formData.name.trim();
    if (trimmedName.length < 2) {
      setFormError('O nome do plano deve conter no mínimo 2 caracteres.');
      return;
    }

    const numericPrice = parsePriceInput(formData.price);
    if (numericPrice <= 0) {
      setFormError('Informe um valor de mensalidade válido maior que zero.');
      return;
    }

    const courts = parseInt(formData.maxCourts, 10);
    if (isNaN(courts) || courts < 1) {
      setFormError('O limite de quadras deve ser pelo menos 1.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPlanId) {
        // PUT /api/plans/[id]
        const res = await fetch(`/api/plans/${editingPlanId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            price: numericPrice,
            maxCourts: courts,
            description: formData.description.trim() || null,
            active: formData.active,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Erro ao atualizar plano');
        }

        onToast(`Plano "${trimmedName}" atualizado com sucesso!`, 'success');
      } else {
        // POST /api/plans
        const res = await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            price: numericPrice,
            maxCourts: courts,
            description: formData.description.trim() || null,
            active: formData.active,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Erro ao cadastrar novo plano');
        }

        onToast(`Novo plano "${trimmedName}" cadastrado com sucesso!`, 'success');
      }

      handleCancelEdit();
      onPlansUpdated();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Falha na requisição';
      setFormError(errorMsg);
      onToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string, planName: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao excluir plano');
      }

      onToast(`Plano "${planName}" processado com sucesso!`, 'success');
      setConfirmDeleteId(null);
      if (editingPlanId === id) {
        handleCancelEdit();
      }
      onPlansUpdated();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao excluir plano';
      onToast(errorMsg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Sora'] text-slate-100 flex items-center gap-2">
                <span>Configuração de Planos &amp; Preços</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  DINÂMICO
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gerencie os pacotes de assinatura B2B, valores mensais e limites de quadras para as Arenas.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btnClosePlanModal"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Existing Plans List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-orange-400" />
                <span>Planos Cadastrados no Banco ({plans.length})</span>
              </h3>
              {editingPlanId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-orange-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Novo</span>
                </button>
              )}
            </div>

            {plans.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-2">
                <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Nenhum plano cadastrado no momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => {
                  const isBeingEdited = editingPlanId === plan.id;
                  const isDeleting = deletingId === plan.id;

                  return (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isBeingEdited
                          ? 'bg-orange-500/10 border-orange-500/50 shadow-lg shadow-orange-950/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-100 font-['Sora']">
                              {plan.name}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                plan.active
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {plan.active ? 'ATIVO' : 'INATIVO'}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold font-mono text-orange-400">
                              {plan.price.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </span>
                            <span className="text-xs text-slate-400 font-sans">/ mês</span>
                          </div>

                          <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-0.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                            <span>
                              <strong>{plan.maxCourts}</strong> {plan.maxCourts === 1 ? 'quadra inclusa' : 'quadras inclusas'}
                            </span>
                          </p>

                          {plan.description && (
                            <p className="text-xs text-slate-400 italic pt-1 leading-relaxed">
                              {plan.description}
                            </p>
                          )}
                        </div>

                        {/* Actions: Edit & Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            id={`btnEditPlan-${plan.id}`}
                            onClick={() => handleStartEdit(plan)}
                            title="Editar Plano"
                            className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                              isBeingEdited
                                ? 'bg-orange-500 text-white border-orange-400'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteId === plan.id ? (
                            <div className="flex items-center gap-1 bg-slate-900 border border-rose-500/50 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => handleDeletePlan(plan.id, plan.name)}
                                disabled={isDeleting}
                                title="Confirmar exclusão"
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded cursor-pointer flex items-center gap-1"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Sim</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                title="Cancelar exclusão"
                                className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              id={`btnDeletePlan-${plan.id}`}
                              onClick={() => setConfirmDeleteId(plan.id)}
                              title="Excluir Plano"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 text-slate-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: Create / Edit Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950/70 rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-slate-100 font-['Sora'] flex items-center gap-2">
                {editingPlanId ? (
                  <>
                    <Pencil className="w-4 h-4 text-orange-400" />
                    <span>Editar Plano</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-orange-400" />
                    <span>Novo Plano</span>
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {editingPlanId
                  ? 'Altere o nome, valor da mensalidade e limite de quadras.'
                  : 'Cadastre um novo pacote de assinatura para as Arenas.'}
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Nome do Plano */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="planNameInput">
                  Nome do Plano <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  id="planNameInput"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Starter, Pro, Clube Enterprise"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>

              {/* Valor da Mensalidade (R$) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="planPriceInput">
                  Valor da Mensalidade (R$) <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">R$</span>
                  <input
                    type="text"
                    id="planPriceInput"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="299,00"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Ex: 299,00 ou 499.50 (precisão de duas casas decimais)
                </span>
              </div>

              {/* Limite de Quadras */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="planCourtsInput">
                  Limite de Quadras Inclusas <span className="text-orange-400">*</span>
                </label>
                <input
                  type="number"
                  id="planCourtsInput"
                  min="1"
                  max="50"
                  value={formData.maxCourts}
                  onChange={(e) => setFormData({ ...formData, maxCourts: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>

              {/* Descrição Rápida */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="planDescInput">
                  Descrição Rápida (Opcional)
                </label>
                <textarea
                  id="planDescInput"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Câmera inclusa com botão físico de replay"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>

              {/* Status Ativo Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="planActiveCheckbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="planActiveCheckbox" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Disponível para contratação (Ativo)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  id="btnSavePlan"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-950/40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingPlanId ? 'Salvar Alterações' : 'Salvar Plano'}</span>
                    </>
                  )}
                </button>

                {editingPlanId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Alterações de preço refletem em tempo real no faturamento projetado.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
