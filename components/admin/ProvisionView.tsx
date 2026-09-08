'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Zap,
  RefreshCw,
  Save,
  Server,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import ArenaModal, { ArenaInfraData } from './ArenaModal';

const FALLBACK_PROVISION_ARENAS: ArenaInfraData[] = [
  {
    id: "arena-pr-01",
    name: "Arena Society Paranaguá",
    cityState: "Rua das Palmeiras, 112 - Paranaguá, PR",
    courtsCount: 2,
    contactName: "Administrador Local",
    contactPhone: "(41) 99876-5432",
    plan: "Pro 2 Quadras",
    status: "ONLINE",
    macAddress: "00:1A:2B:3C:4D:5E",
    ipLan: null,
    mqttToken: "tok_live_n100_edge",
    cameras: [
      {
        courtNumber: 1,
        cameraName: "Câmera Principal (Society)",
        rtspUrl: "rtsp://admin:pass123@192.168.15.51:554/stream1",
        esp32Ip: "192.168.15.101",
        status: "ONLINE",
      },
    ],
  },
];

export default function ProvisionView() {
  const [arenas, setArenas] = useState<ArenaInfraData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArena, setEditingArena] = useState<ArenaInfraData | null>(null);
  const [arenaToDelete, setArenaToDelete] = useState<ArenaInfraData | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    title?: string;
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Estados para provisionamento rápido direto na view
  const [quickArenaName, setQuickArenaName] = useState('');
  const [quickCnpj, setQuickCnpj] = useState('');
  const [quickMacAddress, setQuickMacAddress] = useState('');
  const [quickSrtPort, setQuickSrtPort] = useState('6000');

  const showToast = (
    text: string,
    type: 'success' | 'error' = 'success',
    title?: string
  ) => {
    setToastMessage({
      text,
      type,
      title: title || (type === 'success' ? 'Alterações Aplicadas' : 'Erro de Configuração'),
    });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadArenas = useCallback(async () => {
    const fetchWithRetry = async (retry = 0) => {
      try {
        // Tentar carregar de /api/arenas primeiro para ter todas as arenas do banco
        const resArenas = await fetch('/api/arenas', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (resArenas.ok) {
          const arenasData = await resArenas.json();
          if (Array.isArray(arenasData) && arenasData.length > 0) {
            const mappedArenas: ArenaInfraData[] = arenasData.map((a: any) => {
              const node = a.edgeNodes && a.edgeNodes.length > 0 ? a.edgeNodes[0] : null;
              const hasMac = Boolean(node && node.macAddress && node.macAddress.trim() !== '' && node.macAddress !== 'Não vinculado');
              return {
                id: a.id,
                name: a.name,
                cityState: a.address || 'Localização não informada',
                courtsCount: a.planType === 'MASTER' ? 4 : a.planType === 'PRO' ? 2 : 1,
                contactName: 'Administrador Local',
                contactPhone: '(41) 99876-5432',
                plan: a.planType === 'MASTER' ? 'Master (4 Quadras)' : a.planType === 'PRO' ? 'Pro 2 Quadras' : 'Starter (1 Quadra)',
                status: hasMac ? (node.status || 'ONLINE') : 'AGUARDANDO_HARDWARE',
                macAddress: hasMac ? node.macAddress : null,
                ipLan: hasMac && node.localIp ? node.localIp : null,
                mqttToken: node?.mqttToken || null,
                features: a.features || {},
                cameras: [
                  {
                    courtNumber: 1,
                    cameraName: 'Câmera Principal (Society)',
                    rtspUrl: `rtsp://admin:pass123@${hasMac && node?.localIp ? node.localIp : '192.168.15.51'}:554/stream1`,
                    esp32Ip: '192.168.15.101',
                    status: (hasMac && node?.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE') as 'ONLINE' | 'OFFLINE',
                  },
                ],
              };
            });

            // Deduplicação segura para garantir que nenhuma arena apareça repetida na listagem
            const seenIds = new Set<string>();
            const uniqueArenas = mappedArenas.filter((arena) => {
              if (seenIds.has(arena.id)) return false;
              seenIds.add(arena.id);
              return true;
            });

            setArenas(uniqueArenas);
            setIsLoading(false);
            return;
          }
        }

        // Fallback: tentar carregar de /api/nodes
        const res = await fetch('/api/nodes', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (res.status === 429 && retry < 2) {
          setTimeout(() => fetchWithRetry(retry + 1), 1500 * (retry + 1));
          return;
        }
        if (res.ok) {
          const nodesData = await res.json();
          if (Array.isArray(nodesData) && nodesData.length > 0) {
            const mappedArenas: ArenaInfraData[] = nodesData.map((node: any) => {
              const hasMac = Boolean(node && node.macAddress && node.macAddress.trim() !== '' && node.macAddress !== 'Não vinculado');
              return {
                id: node.arena?.id || node.id,
                name: node.arena?.name || 'Arena Sem Vínculo',
                cityState: node.arena?.address || 'Localização não informada',
                courtsCount: 2,
                contactName: 'Administrador Local',
                contactPhone: '(41) 99876-5432',
                plan: 'Pro 2 Quadras',
                status: hasMac ? (node.status || 'ONLINE') : 'AGUARDANDO_HARDWARE',
                macAddress: hasMac ? node.macAddress : null,
                ipLan: hasMac && node.localIp ? node.localIp : null,
                mqttToken: node.mqttToken || null,
                features: node.arena?.features,
                cameras: [
                  {
                    courtNumber: 1,
                    cameraName: 'Câmera Principal (Society)',
                    rtspUrl: `rtsp://admin:pass123@${hasMac && node.localIp ? node.localIp : '192.168.15.51'}:554/stream1`,
                    esp32Ip: '192.168.15.101',
                    status: (hasMac && node.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE') as 'ONLINE' | 'OFFLINE',
                  },
                ],
              };
            });

            const seenIds = new Set<string>();
            const uniqueArenas = mappedArenas.filter((arena) => {
              if (seenIds.has(arena.id)) return false;
              seenIds.add(arena.id);
              return true;
            });

            setArenas(uniqueArenas);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        if (retry < 1) {
          setTimeout(() => fetchWithRetry(retry + 1), 1200);
          return;
        }
        console.warn('Aviso ao buscar arenas provisionadas:', err);
      }
      setArenas((prev) => (prev.length > 0 ? prev : FALLBACK_PROVISION_ARENAS));
      setIsLoading(false);
    };

    fetchWithRetry();
  }, []);

  const handleConfirmDeleteArena = async () => {
    if (!arenaToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/arenas/${arenaToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao excluir arena.');
      }
      showToast(`Arena "${arenaToDelete.name}" excluída com sucesso!`);
      setArenaToDelete(null);
      await loadArenas();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir arena.';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadArenas();
  }, [loadArenas]);

  const handleOpenNew = () => {
    setEditingArena(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (arena: ArenaInfraData) => {
    setEditingArena(arena);
    setIsModalOpen(true);
  };

  // Manipulador com máscara automática de MAC Address (adiciona ':' a cada 2 caracteres hexadecimais)
  const handleMacAddressChange = (value: string) => {
    const raw = value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 12);
    const matches = raw.match(/.{1,2}/g);
    const formatted = matches ? matches.join(':') : raw;
    setQuickMacAddress(formatted);
  };

  // Envio do formulário com chamada POST para /api/provision
  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickArenaName || !quickMacAddress) {
      showToast('Preencha o Nome da Arena e o MAC Address do Edge N100.', 'error');
      return;
    }

    // Validação estrita de formato MAC Address (ex: B8:27:EB:A4:91:0F)
    const macRegex = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;
    if (!macRegex.test(quickMacAddress)) {
      showToast('MAC Address inválido. Formato exigido: B8:27:EB:A4:91:0F (12 dígitos hexadecimais).', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          arenaName: quickArenaName,
          cnpj: quickCnpj || null,
          macAddress: quickMacAddress,
          srtPort: parseInt(quickSrtPort, 10) || 6000,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao provisionar nó');
      }

      // Limpar formulário e exibir mensagem de sucesso
      setQuickArenaName('');
      setQuickCnpj('');
      setQuickMacAddress('');
      setQuickSrtPort('6000');
      showToast(
        `Nó Edge para "${quickArenaName}" provisionado e salvo com sucesso.`,
        'success',
        'Infraestrutura Atualizada'
      );

      // Recarregar dados do banco
      await loadArenas();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar provisionamento.';
      showToast(msg, 'error', 'Falha no Provisionamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler do Modal completo
  const handleSaveModalArena = async (savedArena: ArenaInfraData) => {
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: savedArena.id && !savedArena.id.startsWith('arena-') ? savedArena.id : undefined,
          arenaName: savedArena.name,
          cnpj: null,
          macAddress: savedArena.macAddress,
          srtPort: 6000,
          ipLan: savedArena.ipLan,
          address: savedArena.cityState,
          features: savedArena.features,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao salvar no banco.');
      }

      setIsModalOpen(false);
      showToast(
        `As alterações de infraestrutura de "${savedArena.name}" foram aplicadas com sucesso.`,
        'success',
        'Configurações Aplicadas'
      );
      await loadArenas();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.';
      showToast(msg, 'error', 'Erro ao Aplicar Alterações');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 relative">
      {/* Toast Notification usando Tailwind */}
      {toastMessage && (
        <div
          id="provisionToastNotification"
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 max-w-md w-full sm:w-96 shadow-2xl transition-all animate-in slide-in-from-top-4 fade-in duration-300"
        >
          <div
            className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3.5 ${
              toastMessage.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/30 shadow-emerald-500/10 text-slate-100'
                : 'bg-slate-900/95 border-rose-500/30 shadow-rose-500/10 text-slate-100'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-bold font-['Sora'] uppercase tracking-wider text-slate-200">
                {toastMessage.title || (toastMessage.type === 'success' ? 'Sucesso' : 'Erro')}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {toastMessage.text}
              </p>
            </div>

            <button
              type="button"
              id="btnCloseToastNotification"
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-['Sora'] tracking-tight">
            Provisionamento de Infraestrutura
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Cadastro de novos clientes, geração de scripts Edge N100 e vinculação de streams RTSP.
          </p>
        </div>

        <button
          type="button"
          id="btnNewArena"
          onClick={handleOpenNew}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nova Arena</span>
        </button>
      </div>

      {/* Formulário Rápido de Provisionamento */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center mb-4 pb-3 border-b border-slate-800">
          <Zap className="w-5 h-5 text-orange-500 mr-2" />
          <h2 className="text-sm font-bold font-['Sora'] text-slate-100 uppercase tracking-wider">
            PROVISIONAMENTO RÁPIDO DE NÓ EDGE
          </h2>
        </div>

        <form onSubmit={handleProvisionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                Nome da Arena *
              </label>
              <input
                id="inputArenaName"
                type="text"
                required
                value={quickArenaName}
                onChange={(e) => setQuickArenaName(e.target.value)}
                placeholder="Ex: Arena Gol de Placa"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                CNPJ da Empresa
              </label>
              <input
                id="inputCnpj"
                type="text"
                value={quickCnpj}
                onChange={(e) => setQuickCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-orange-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                MAC Address (ETH0) *
              </label>
              <input
                id="inputMacAddress"
                type="text"
                required
                maxLength={17}
                value={quickMacAddress}
                onChange={(e) => handleMacAddressChange(e.target.value)}
                placeholder="B8:27:EB:A4:91:0F"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-orange-500 outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                Porta SRT
              </label>
              <input
                id="inputSrtPort"
                type="number"
                value={quickSrtPort}
                onChange={(e) => setQuickSrtPort(e.target.value)}
                placeholder="6000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-orange-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-500 font-mono">
              * O token MQTT será gerado de forma autônoma e criptográfica pelo servidor.
            </p>

            <button
              type="submit"
              id="btnSubmitProvision"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              <span>{isSubmitting ? 'Provisionando...' : 'Salvar e Provisionar Nó'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Arenas Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center">
            <Server className="w-5 h-5 text-orange-500 mr-2" />
            <h2 className="text-sm font-bold font-['Sora'] text-slate-200 uppercase tracking-wider">
              ARENAS & NÓS ATIVOS
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {isLoading ? 'Carregando...' : `${arenas.length} ${arenas.length === 1 ? 'instância conectada' : 'instâncias conectadas'}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Arena / Localização</th>
                <th className="py-3 px-4">Plano</th>
                <th className="py-3 px-4 text-center">Quadras</th>
                <th className="py-3 px-4 text-center">Câmeras RTSP</th>
                <th className="py-3 px-4 font-mono">Edge MAC / IP</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                // Skeleton Screen para o carregamento dos nós Edge
                <>
                  {[1, 2, 3, 4].map((index) => (
                    <tr key={`skeleton-row-${index}`} className="animate-pulse">
                      <td className="py-4 px-4">
                        <div className="h-4 w-44 bg-slate-800 rounded mb-2"></div>
                        <div className="h-3 w-32 bg-slate-800/60 rounded"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-24 bg-slate-800 rounded"></div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="h-4 w-8 bg-slate-800 rounded mx-auto"></div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="h-5 w-16 bg-slate-800 rounded mx-auto"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3.5 w-32 bg-slate-800 rounded mb-1.5"></div>
                        <div className="h-3 w-24 bg-slate-800/60 rounded"></div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="h-6 w-24 bg-slate-800 rounded-full mx-auto"></div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-7 w-20 bg-slate-800 rounded-lg"></div>
                          <div className="h-7 w-7 bg-slate-800 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : arenas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Nenhuma arena provisionada ainda no banco de dados.
                  </td>
                </tr>
              ) : (
                arenas.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{a.name}</div>
                      <div className="text-[11px] text-slate-400">{a.cityState} • {a.contactPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {a.plan}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                      {a.courtsCount}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">
                        {a.cameras.length} {a.cameras.length === 1 ? 'feed' : 'feeds'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {a.macAddress ? (
                        <div className="flex flex-col font-mono text-[11px]">
                          <span className="text-slate-300 font-semibold">{a.macAddress}</span>
                          <span className="text-slate-500">{a.ipLan || 'Aguardando rede'}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic bg-slate-800/50 px-2 py-1 rounded border border-slate-800">
                          Aguardando Hardware
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {a.macAddress ? (
                        a.status === 'ONLINE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            ONLINE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            OFFLINE
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          AGUARDANDO HARDWARE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          id={`btnEditArena-${a.id}`}
                          onClick={() => handleOpenEdit(a)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-orange-400 font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Configurar</span>
                        </button>

                        <button
                          type="button"
                          id={`btnDeleteArena-${a.id}`}
                          onClick={() => setArenaToDelete(a)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title={`Excluir arena ${a.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arena Provisioning Modal */}
      <ArenaModal
        isOpen={isModalOpen}
        arena={editingArena}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModalArena}
        onDelete={(arena) => setArenaToDelete(arena)}
      />

      {/* Arena Delete Confirmation Modal */}
      {arenaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-100 font-['Sora']">
                  Excluir Arena?
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Tem certeza de que deseja excluir permanentemente a arena{' '}
                  <strong className="text-rose-400 font-semibold">{arenaToDelete.name}</strong>?
                  Todas as quadras, nós edge, gravações e permissões vinculadas serão permanentemente removidos.
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-[11px] text-rose-300">
              Esta ação é irreversível e remove os registros no banco de dados.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setArenaToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btnConfirmDeleteArena"
                disabled={isDeleting}
                onClick={handleConfirmDeleteArena}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
