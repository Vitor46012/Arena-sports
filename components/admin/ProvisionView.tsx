'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ArenaModal, { ArenaInfraData } from './ArenaModal';

export default function ProvisionView() {
  const [arenas, setArenas] = useState<ArenaInfraData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArena, setEditingArena] = useState<ArenaInfraData | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Estados para provisionamento rápido direto na view
  const [quickArenaName, setQuickArenaName] = useState('');
  const [quickCnpj, setQuickCnpj] = useState('');
  const [quickMacAddress, setQuickMacAddress] = useState('');
  const [quickSrtPort, setQuickSrtPort] = useState('6000');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadArenas = useCallback(async () => {
    try {
      const res = await fetch('/api/nodes', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Falha ao carregar arenas');
      const nodesData = await res.json();

      if (Array.isArray(nodesData)) {
        const mappedArenas: ArenaInfraData[] = nodesData.map((node) => ({
          id: node.arena?.id || node.id,
          name: node.arena?.name || 'Arena Sem Vínculo',
          cityState: 'Paranaguá - PR',
          courtsCount: 2,
          contactName: 'Administrador Local',
          contactPhone: '(41) 99876-5432',
          plan: 'Pro 2 Quadras',
          status: node.status || 'ONLINE',
          macAddress: node.macAddress || 'B8:27:EB:A4:91:0F',
          ipLan: node.localIp || '192.168.15.200',
          mqttToken: node.mqttToken || 'tok_live_n100_edge',
          cameras: [
            {
              courtNumber: 1,
              cameraName: 'Câmera Principal (Society)',
              rtspUrl: `rtsp://admin:pass123@${node.localIp || '192.168.15.51'}:554/stream1`,
              esp32Ip: '192.168.15.101',
              status: 'ONLINE',
            },
          ],
        }));
        setArenas(mappedArenas);
      }
    } catch (err) {
      console.error('Erro ao buscar arenas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchInit = async () => {
      try {
        const res = await fetch('/api/nodes', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) return;
        const nodesData = await res.json();

        if (isMounted && Array.isArray(nodesData)) {
          const mappedArenas: ArenaInfraData[] = nodesData.map((node) => ({
            id: node.arena?.id || node.id,
            name: node.arena?.name || 'Arena Sem Vínculo',
            cityState: 'Paranaguá - PR',
            courtsCount: 2,
            contactName: 'Administrador Local',
            contactPhone: '(41) 99876-5432',
            plan: 'Pro 2 Quadras',
            status: node.status || 'ONLINE',
            macAddress: node.macAddress || 'B8:27:EB:A4:91:0F',
            ipLan: node.localIp || '192.168.15.200',
            mqttToken: node.mqttToken || 'tok_live_n100_edge',
            cameras: [
              {
                courtNumber: 1,
                cameraName: 'Câmera Principal (Society)',
                rtspUrl: `rtsp://admin:pass123@${node.localIp || '192.168.15.51'}:554/stream1`,
                esp32Ip: '192.168.15.101',
                status: 'ONLINE',
              },
            ],
          }));
          setArenas(mappedArenas);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInit();
    return () => {
      isMounted = false;
    };
  }, []);

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
      showToast('Nó provisionado com sucesso!');

      // Recarregar dados do banco
      await loadArenas();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar provisionamento.';
      showToast(msg, 'error');
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
          arenaName: savedArena.name,
          cnpj: null,
          macAddress: savedArena.macAddress,
          srtPort: 6000,
          ipLan: savedArena.ipLan,
          address: savedArena.cityState,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao salvar no banco.');
      }

      setIsModalOpen(false);
      showToast('Nó provisionado com sucesso!');
      await loadArenas();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-18 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900 border-red-500/40 text-red-300'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toastMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toastMessage.text}</span>
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
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Nova Arena</span>
        </button>
      </div>

      {/* Formulário Rápido de Provisionamento */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <span className="material-symbols-outlined text-orange-500 text-[20px]">
            bolt
          </span>
          <h2 className="text-sm font-bold font-['Sora'] text-slate-100 uppercase tracking-wider">
            Provisionamento Rápido de Nó Edge (PostgreSQL)
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
              className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${isSubmitting ? 'animate-spin' : ''}`}>
                {isSubmitting ? 'sync' : 'save'}
              </span>
              <span>{isSubmitting ? 'Provisionando...' : 'Salvar e Provisionar Nó'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Arenas Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500 text-[20px]">
              stadium
            </span>
            <h2 className="text-sm font-bold font-['Sora'] text-slate-200 uppercase tracking-wider">
              Arenas & Nós Ativos no PostgreSQL
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {isLoading ? 'Carregando...' : `${arenas.length} instâncias conectadas`}
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
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-3xl text-orange-500 animate-spin">
                        sync
                      </span>
                      <p className="font-mono text-xs text-slate-400">Carregando dados da infraestrutura...</p>
                    </div>
                  </td>
                </tr>
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
                        {a.cameras.length} feeds
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-slate-300">{a.macAddress}</div>
                      <div className="text-slate-500">{a.ipLan}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(a)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-orange-400 font-bold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        <span>Configurar</span>
                      </button>
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
      />
    </div>
  );
}
