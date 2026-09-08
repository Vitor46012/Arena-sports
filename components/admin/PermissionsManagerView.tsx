'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Server, Check, Save, Trash2, X, AlertTriangle, RefreshCw } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { PlanType, PermissionRegistry, PLAN_DEFAULTS, getPlanDefaults } from '@/lib/permissions';

interface ArenaInfo {
  id: string;
  name: string;
  planType: PlanType;
  features: Record<string, boolean>;
}

export default function PermissionsManagerView() {
  const [arenas, setArenas] = useState<ArenaInfo[]>([]);
  const [selectedArena, setSelectedArena] = useState<ArenaInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Exclusão de arena
  const [arenaToDelete, setArenaToDelete] = useState<ArenaInfo | null>(null);
  const [isDeletingArena, setIsDeletingArena] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadArenas = useCallback(async () => {
    try {
      const res = await fetch('/api/arenas', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const mappedArenas: ArenaInfo[] = data.map((arena: any) => ({
          id: arena.id,
          name: arena.name,
          planType: arena.planType || 'BASIC',
          features: arena.features && Object.keys(arena.features).length > 0
            ? { ...PLAN_DEFAULTS.BASIC, ...arena.features } 
            : PLAN_DEFAULTS[arena.planType as PlanType || 'BASIC'],
        }));
        setArenas(mappedArenas);
        
        setSelectedArena((prev) => {
          if (prev) {
            const stillExists = mappedArenas.find((a) => a.id === prev.id);
            return stillExists || (mappedArenas.length > 0 ? mappedArenas[0] : null);
          }
          return mappedArenas.length > 0 ? mappedArenas[0] : null;
        });
      }
    } catch (err) {
      console.warn('[LOAD_ARENAS_WARNING]', err);
    }
  }, []);

  const confirmDeleteArena = async () => {
    if (!arenaToDelete) return;
    try {
      setIsDeletingArena(true);
      const res = await fetch(`/api/arenas/${arenaToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao excluir arena.');
      }
      const arenaName = arenaToDelete.name;
      setArenaToDelete(null);
      showToast(`Arena "${arenaName}" excluída com sucesso!`, 'success');
      await loadArenas();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir arena.';
      showToast(msg, 'error');
    } finally {
      setIsDeletingArena(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchArenas = async () => {
      await loadArenas();
    };
    fetchArenas();
    return () => { mounted = false; };
  }, [loadArenas]);

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedArena) return;
    const newPlan = e.target.value as PlanType;
    setSelectedArena({
      ...selectedArena,
      planType: newPlan,
      features: { ...getPlanDefaults(newPlan) },
    });
  };

  const handleFeatureToggle = (flatKey: string) => {
    if (!selectedArena) return;
    setSelectedArena({
      ...selectedArena,
      features: {
        ...selectedArena.features,
        [flatKey]: !selectedArena.features[flatKey],
      },
    });
  };

  const handleSave = async () => {
    if (!selectedArena) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/arenas/${selectedArena.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: selectedArena.planType,
          features: selectedArena.features,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao salvar permissões');
      }

      showToast('Permissões atualizadas com sucesso!');
      await loadArenas();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {toastMessage && (
        <div className={`fixed top-18 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 ${
          toastMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          <Check className="w-4 h-4" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-['Sora'] tracking-tight text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-orange-500" />
            Entitlements & Features
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xl leading-relaxed">
            Gestão hiper-granular de permissões por tenant. Defina o plano padrão ou modifique as permissões individualmente.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Arenas List */}
        <div className="w-full md:w-1/3 space-y-2">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 px-2">Arenas (Tenants)</h2>
          <div className="space-y-1">
            {arenas.map(arena => (
              <button
                key={arena.id}
                onClick={() => setSelectedArena(arena)}
                className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${
                  selectedArena?.id === arena.id 
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4" />
                  <span className="text-sm font-semibold truncate">{arena.name}</span>
                </div>
                <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                  {arena.planType}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Panel */}
        {selectedArena && (
          <div className="w-full md:w-2/3 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-800 pb-6 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-100">{selectedArena.name}</h3>
                  <button
                    type="button"
                    onClick={() => setArenaToDelete(selectedArena)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title={`Excluir arena ${selectedArena.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-400 mt-1">Configure as permissões hiper-granulares</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plano Padrão</label>
                <select
                  value={selectedArena.planType}
                  onChange={handlePlanChange}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 font-semibold focus:border-orange-500 outline-none"
                >
                  <option value="BASIC">BASIC</option>
                  <option value="PRO">PRO</option>                  
                  <option value="MASTER">MASTER</option>
                </select>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              {Object.entries(PermissionRegistry).map(([moduleKey, moduleData]) => {
                const IconComponent = (LucideIcons as any)[moduleData.icon] || ShieldCheck;
                
                return (
                  <div key={moduleKey} className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden">
                    {/* Module Header */}
                    <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800/50 text-slate-400">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-200">{moduleData.label}</h4>
                    </div>
                    
                    {/* Module Actions */}
                    <div className="p-2 space-y-1">
                      {Object.entries(moduleData.actions).map(([actionKey, actionData]) => {
                        const flatKey = `${moduleKey}.${actionKey}`;
                        const isEnabled = selectedArena.features[flatKey] === true;
                        
                        return (
                          <div 
                            key={flatKey}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                              isEnabled ? 'bg-slate-900 border border-orange-500/20' : 'hover:bg-slate-900/50 border border-transparent'
                            }`}
                          >
                            <div>
                              <h5 className={`font-semibold text-sm ${isEnabled ? 'text-slate-100' : 'text-slate-400'}`}>
                                {actionData.label}
                              </h5>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{flatKey}</p>
                            </div>
                            
                            {/* Toggle Switch */}
                            <button
                              onClick={() => handleFeatureToggle(flatKey)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                                isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end sticky bottom-0 bg-slate-900">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar Permissões'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE ARENA */}
      {arenaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Sora'] text-white">
                    Excluir Arena
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ação permanente de remoção
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeletingArena}
                onClick={() => setArenaToDelete(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3 text-xs text-slate-300">
              <p>
                Tem certeza de que deseja excluir a arena{' '}
                <strong className="text-white font-semibold">{arenaToDelete.name}</strong>?
              </p>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>Atenção</span>
                </div>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">
                  Todas as quadras, nós edge, gravações e permissões desta arena serão permanentemente removidos.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingArena}
                onClick={() => setArenaToDelete(null)}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingArena}
                onClick={confirmDeleteArena}
                className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                {isDeletingArena ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir Arena</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
