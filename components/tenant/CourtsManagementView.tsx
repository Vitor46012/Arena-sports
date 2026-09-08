'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Activity,
  Edit2,
  Trash2,
  Tv,
  QrCode,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface CourtItem {
  id: string;
  name: string;
  identifier: string;
  arenaId: string;
  active: boolean;
  createdAt: string;
  _count?: {
    videoClips: number;
  };
  arena?: {
    id: string;
    name: string;
  };
}

interface ArenaOption {
  id: string;
  name: string;
}

export default function CourtsManagementView() {
  const [arenas, setArenas] = useState<ArenaOption[]>([]);
  const [selectedArenaId, setSelectedArenaId] = useState<string>('');
  const [courts, setCourts] = useState<CourtItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Formulário de Nova Quadra
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtSlug, setNewCourtSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edição
  const [editingCourt, setEditingCourt] = useState<CourtItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Exclusão Segura de Quadra (Modal in-app compatível com iframes)
  const [courtToDelete, setCourtToDelete] = useState<CourtItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Feedback visual (substitui window.alert / confirm bloqueados por iframes)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Carregar arenas com retry resiliente
  const loadArenas = useCallback(async () => {
    const fetchWithRetry = async (retry = 0) => {
      try {
        const res = await fetch('/api/arenas');
        if (res.ok) {
          const data: ArenaOption[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setArenas(data);
            setSelectedArenaId((prev) => {
              const found = data.find((a) => a.id === prev);
              return found ? found.id : data[0].id;
            });
            return;
          }
        }
      } catch (err) {
        if (retry < 1) {
          setTimeout(() => {
            fetchWithRetry(retry + 1);
          }, 1200);
          return;
        }
        console.warn('Aviso ao listar arenas:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
      }

      const defaultArena: ArenaOption = {
        id: 'arena-pr-01',
        name: 'Arena Society Paranaguá',
      };
      setArenas([defaultArena]);
      setSelectedArenaId((prev) => prev || defaultArena.id);
    };

    fetchWithRetry();
  }, []);

  useEffect(() => {
    loadArenas();
  }, [loadArenas]);

  // Carregar quadras da arena selecionada
  useEffect(() => {
    if (!selectedArenaId) return;
    let isMounted = true;

    const loadCourts = async (arenaId: string, retry = 0) => {
      try {
        const res = await fetch(`/api/courts?arenaId=${arenaId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCourts(Array.isArray(data) ? data : []);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        if (retry < 1) {
          setTimeout(() => {
            if (isMounted) loadCourts(arenaId, retry + 1);
          }, 1200);
          return;
        }
        console.warn('Aviso ao carregar quadras:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadCourts(selectedArenaId);

    return () => {
      isMounted = false;
    };
  }, [selectedArenaId]);

  const reloadCourts = async () => {
    if (!selectedArenaId) return;
    try {
      const res = await fetch(`/api/courts?arenaId=${selectedArenaId}`);
      if (res.ok) {
        const data = await res.json();
        setCourts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Aviso ao recarregar quadras:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
    }
  };

  const handleCreateCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourtName.trim() || !selectedArenaId) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCourtName.trim(),
          identifier: newCourtSlug.trim() || undefined,
          arenaId: selectedArenaId,
          active: true,
        }),
      });

      if (res.ok) {
        setNewCourtName('');
        setNewCourtSlug('');
        setIsCreateOpen(false);
        showFeedback('success', 'Quadra criada com sucesso!');
        await reloadCourts();
      } else {
        const err = await res.json().catch(() => ({ error: 'Falha ao criar quadra.' }));
        showFeedback('error', err.error || 'Falha ao criar quadra.');
      }
    } catch {
      showFeedback('error', 'Erro de conexão ao criar quadra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt || !editName.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/courts/${editingCourt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          identifier: editSlug.trim() || undefined,
          active: editActive,
        }),
      });

      if (res.ok) {
        setEditingCourt(null);
        showFeedback('success', 'Quadra atualizada com sucesso!');
        await reloadCourts();
      } else {
        const err = await res.json().catch(() => ({ error: 'Falha ao atualizar quadra.' }));
        showFeedback('error', err.error || 'Falha ao atualizar quadra.');
      }
    } catch {
      showFeedback('error', 'Erro de conexão ao atualizar quadra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDeleteCourt = (court: CourtItem) => {
    setCourtToDelete(court);
  };

  const confirmDeleteCourt = async () => {
    if (!courtToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/courts/${courtToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const courtName = courtToDelete.name;
        setCourtToDelete(null);
        showFeedback('success', `A quadra "${courtName}" foi excluída com sucesso.`);
        await reloadCourts();
      } else {
        const err = await res.json().catch(() => ({ error: 'Falha ao excluir quadra.' }));
        showFeedback('error', err.error || 'Falha ao excluir quadra.');
      }
    } catch {
      showFeedback('error', 'Erro de conexão ao excluir quadra.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (court: CourtItem) => {
    setEditingCourt(court);
    setEditName(court.name);
    setEditSlug(court.identifier);
    setEditActive(court.active);
  };

  return (
    <div className="space-y-6">
      {/* Notificação / Feedback in-app (evita window.alert/confirm em iframes) */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header com ações */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold font-mono">
              MULTI-QUADRAS
            </span>
            <h2 className="text-xl font-bold font-['Sora'] text-white">
              Gestão de Quadras & Espaços
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Cadastre os campos e quadras do seu complexo para gerar os links da live e os QR Codes de acesso aos vídeos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {arenas.length > 0 && (
            <select
              value={selectedArenaId}
              onChange={(e) => setSelectedArenaId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs font-semibold focus:border-orange-500 outline-none"
            >
              {arenas.map((arena) => (
                <option key={arena.id} value={arena.id}>
                  {arena.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Quadra
          </button>
        </div>
      </div>

      {/* Grid de Quadras */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Carregando quadras...</span>
        </div>
      ) : courts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Activity className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Nenhuma quadra cadastrada</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Clique no botão acima para adicionar a primeira quadra da sua arena.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courts.map((court) => {
            const origin =
              typeof window !== 'undefined' && window.location.origin
                ? window.location.origin
                : 'https://arena-sports-five.vercel.app';
            const overlayUrl = `${origin}/overlay/${court.identifier || court.id}`;
            const qrUrl = `/admin/qr-codes`;
            const videoCount = court._count?.videoClips ?? 0;

            return (
              <div
                key={court.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            court.active ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {court.active ? 'Ativa no Sistema' : 'Inativa'}
                      </span>
                      <h3 className="text-lg font-bold font-['Sora'] text-white mt-1.5">
                        {court.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(court)}
                        title="Editar quadra"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDeleteCourt(court)}
                        title="Excluir quadra"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Informações técnicas */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Identificador do Sistema:</span>
                      <span className="text-orange-400 font-bold">{court.identifier}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Lances Gravados:</span>
                      <span className="text-white font-bold">
                        {videoCount} {videoCount === 1 ? 'vídeo' : 'vídeos'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações de Integração (OBS e QR Code) */}
                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <a
                    href={overlayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Link da Tela (Para a Live)"
                  >
                    <Tv className="w-4 h-4 text-orange-500" />
                    Link da Live
                  </a>

                  <a
                    href={qrUrl}
                    className="flex-1 py-2 px-2.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Gerar e imprimir totem com QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                    Totem / QR
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-['Sora'] text-white">
                Cadastrar Nova Quadra
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourt} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Nome da Quadra
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Quadra 3 - Areia Premium"
                  value={newCourtName}
                  onChange={(e) => {
                    setNewCourtName(e.target.value);
                    if (!newCourtSlug) {
                      setNewCourtSlug(
                        e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9-_]/g, '-')
                      );
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Identificador Único (Slug)
                </label>
                <input
                  type="text"
                  placeholder="Ex: quadra-3"
                  value={newCourtSlug}
                  onChange={(e) => setNewCourtSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-3.5 py-2.5 text-xs font-mono focus:border-orange-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Usado para identificar de qual quadra veio o lance.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newCourtName.trim()}
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : 'Criar Quadra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {editingCourt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-['Sora'] text-white">
                Editar Quadra
              </h3>
              <button
                type="button"
                onClick={() => setEditingCourt(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourt} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Nome da Quadra
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Identificador Único (Slug)
                </label>
                <input
                  type="text"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-3.5 py-2.5 text-xs font-mono focus:border-orange-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkCourtActive"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-orange-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="chkCourtActive" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Quadra ativa para receber gravações e lives
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCourt(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editName.trim()}
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  {isSubmitting ? 'Atualizando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (100% compatível com iframe) */}
      {courtToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Sora'] text-white">
                    Excluir Quadra
                  </h3>
                  <p className="text-xs text-slate-400">
                    Remover quadra das configurações da arena
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCourtToDelete(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3 text-xs text-slate-300">
              <p>
                Tem certeza de que deseja excluir a quadra{' '}
                <strong className="text-white font-semibold">{courtToDelete.name}</strong>?
              </p>

              <div className="font-mono text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800/70 space-y-1">
                <div>Identificador do Sistema: <span className="text-orange-400 font-bold">{courtToDelete.identifier}</span></div>
                <div>Lances gravados: <span className="text-white font-bold">{courtToDelete._count?.videoClips ?? 0}</span></div>
              </div>

              {(courtToDelete._count?.videoClips ?? 0) > 0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>{courtToDelete._count?.videoClips} lances vinculados</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Os vídeos gravados continuarão salvos normalmente no histórico da sua arena. Apenas a associação com este espaço físico será desvinculada com segurança.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Esta quadra não possui vídeos associados e será removida imediatamente.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCourtToDelete(null)}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteCourt}
                className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir Quadra</span>
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
