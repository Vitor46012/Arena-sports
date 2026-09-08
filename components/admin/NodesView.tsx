'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Server,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Search,
  X,
  Filter,
  RefreshCw,
  SearchX,
  Landmark,
  ChevronRight,
  Trash2
} from 'lucide-react';
import NodeDetailsModal, { NodeData } from './NodeDetailsModal';
import { useDeviceLayout } from '@/contexts/DeviceLayoutContext';

export interface EdgeNodeWithArena {
  id: string;
  nodeId: string;
  macAddress: string;
  mqttToken: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  localIp: string | null;
  srtPort: number;
  cpuUsage: number | null;
  temperature: number | null;
  fps: number | null;
  bitrateMbps: number | null;
  lastPing: string | null;
  arenaId: string;
  arena: {
    id: string;
    name: string;
    cnpj?: string | null;
  };
}

const FALLBACK_EDGE_NODES: EdgeNodeWithArena[] = [
  {
    id: "bc2c2663-64c6-4beb-b682-8ec36002a87e",
    nodeId: "node-pr-112",
    macAddress: "00:1A:2B:3C:4D:5E",
    mqttToken: "token-secreto-123",
    status: "ONLINE",
    localIp: "192.168.15.100",
    srtPort: 6000,
    cpuUsage: 34.2,
    temperature: 46.5,
    fps: 60,
    bitrateMbps: 8.5,
    lastPing: new Date().toISOString(),
    arenaId: "arena-pr-01",
    arena: {
      id: "arena-pr-01",
      name: "Arena Society Paranaguá",
      cnpj: "12.345.678/0001-90",
    },
  },
  {
    id: "0c3c28b6-7f68-4fe2-be7d-707cdbe4257d",
    nodeId: "node-sp-02",
    macAddress: "B8:27:EB:A4:91:0F",
    mqttToken: "token-morumbi-456",
    status: "ONLINE",
    localIp: "192.168.1.102",
    srtPort: 6000,
    cpuUsage: 28.1,
    temperature: 42.0,
    fps: 60,
    bitrateMbps: 8.2,
    lastPing: new Date().toISOString(),
    arenaId: "arena-sp-02",
    arena: {
      id: "arena-sp-02",
      name: "Morumbi Sports Center",
      cnpj: "98.765.432/0001-10",
    },
  },
];

interface NodesViewProps {
  onDeployClick?: () => void;
}

export default function NodesView({ onDeployClick }: NodesViewProps) {
  const { effectiveLayout } = useDeviceLayout();
  const isMobileLayout = effectiveLayout === 'mobile';
  const [nodes, setNodes] = useState<EdgeNodeWithArena[]>(FALLBACK_EDGE_NODES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOfflineOnly, setFilterOfflineOnly] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [arenaToDelete, setArenaToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const reloadNodes = async () => {
    try {
      const res = await fetch('/api/nodes', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNodes(data);
        }
      }
    } catch (e) {
      console.warn('Erro ao atualizar lista de nós:', e);
    }
  };

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
      await reloadNodes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir arena.';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchNodes = async (retryCount = 0) => {
      try {
        const res = await fetch('/api/nodes', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });

        // Tratamento gracioso para Rate Limiting (429) com backoff exponencial
        if (res.status === 429 && retryCount < 2) {
          setTimeout(() => {
            if (isMounted) fetchNodes(retryCount + 1);
          }, 1500 * (retryCount + 1));
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setNodes(data);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        if (retryCount < 1) {
          setTimeout(() => {
            if (isMounted) fetchNodes(retryCount + 1);
          }, 1200);
          return;
        }
        console.warn('Aviso ao carregar nós Edge (usando nós locais):', err);
      }

      if (isMounted) {
        setNodes((prev) => (prev.length > 0 ? prev : FALLBACK_EDGE_NODES));
        setIsLoading(false);
      }
    };

    fetchNodes();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenDetails = (node: EdgeNodeWithArena) => {
    // Mapear dados para a interface do modal
    const modalData: NodeData = {
      id: node.id,
      nodeId: node.nodeId,
      arena: node.arena?.name || 'Arena Sem Vínculo',
      arenaId: node.arenaId || node.arena?.id,
      mqttStatus: (node.status?.toLowerCase() as 'online' | 'offline' | 'warning') || 'offline',
      droppedFrames: node.fps && node.fps < 30 ? Number(((30 - node.fps) * 0.5).toFixed(2)) : 0.05,
      ramdiskUsage: 25,
      smartSsdLife: 95,
      localIp: node.localIp || '192.168.1.100',
      srtPort: node.srtPort || 6000,
      courtsCount: 2,
      lastHeartbeat: node.lastPing ? new Date(node.lastPing).toLocaleTimeString('pt-BR') : 'Sem sinal',
    };
    setSelectedNode(modalData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNode(null);
  };

  const filteredNodes = nodes.filter((n) => {
    const arenaName = n.arena?.name || '';
    const matchSearch =
      arenaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.nodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.macAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchOffline = filterOfflineOnly ? n.status === 'OFFLINE' : true;
    return matchSearch && matchOffline;
  });

  const totalOnline = nodes.filter((n) => n.status === 'ONLINE').length;
  const totalWarning = nodes.filter((n) => n.status === 'WARNING').length;
  const totalOffline = nodes.filter((n) => n.status === 'OFFLINE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-['Sora'] tracking-tight">
            Monitoramento de Frota (Edge NOC)
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Telemetria em tempo real dos Mini PCs N100 (Node-RED + OBS Studio) nas arenas.
          </p>
        </div>

        {onDeployClick && (
          <button
            type="button"
            onClick={onDeployClick}
            className="self-start md:self-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Provisionar Novo Nó
          </button>
        )}
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total de Nós</span>
            <Server className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-100 font-['Sora'] mt-2">
            {isLoading ? '...' : nodes.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">100% instâncias N100</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Online & Gravando</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-['Sora'] mt-2">
            {isLoading ? '...' : totalOnline}
          </p>
          <p className="text-[11px] text-emerald-500/80 mt-0.5 font-mono">Sinal RTSP Estável</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Atenção (Buffer)</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-400 font-['Sora'] mt-2">
            {isLoading ? '...' : totalWarning}
          </p>
          <p className="text-[11px] text-orange-500/80 mt-0.5 font-mono">Ramdisk &gt; 80%</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Offline / Falha</span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-400 font-['Sora'] mt-2">
            {isLoading ? '...' : totalOffline}
          </p>
          <p className="text-[11px] text-red-500/80 mt-0.5 font-mono">Sem MQTT Heartbeat</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            id="inputSearchNodes"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar Node ID, MAC ou Arena..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-2.5 text-xs text-slate-100 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btnFilterOffline"
            onClick={() => setFilterOfflineOnly(!filterOfflineOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterOfflineOnly
                ? 'bg-red-500/10 text-red-400 border-red-500/40 font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{filterOfflineOnly ? 'Mostrando Apenas Offlines' : 'Filtrar Offline'}</span>
          </button>
        </div>
      </div>

      {/* Nodes List / Table Container */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Mobile View: High-density interactive cards for smartphones */}
        {isMobileLayout ? (
          <div className="divide-y divide-slate-800/80">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <RefreshCw className="w-7 h-7 text-orange-500 animate-spin" />
              <p className="font-mono text-xs">Carregando nós Edge...</p>
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2 text-center p-4">
              <SearchX className="w-7 h-7 text-slate-500" />
              <p className="text-xs">Nenhum nó encontrado para os filtros.</p>
            </div>
          ) : (
            filteredNodes.map((node) => {
              const isOnline = node.status === 'ONLINE';
              const isWarning = node.status === 'WARNING';
              return (
                <div key={node.id} className="p-4 space-y-3 bg-slate-900/60 hover:bg-slate-900 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Landmark className="w-4 h-4 text-orange-500 shrink-0" />
                      <h3 className="font-bold text-sm text-slate-100 truncate">
                        {node.arena?.name || 'Arena Sem Vínculo'}
                      </h3>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOnline
                            ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                            : isWarning
                            ? 'bg-orange-500 animate-pulse'
                            : 'bg-red-500 animate-pulse'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-mono font-bold capitalize ${
                          isOnline ? 'text-emerald-400' : isWarning ? 'text-orange-400' : 'text-red-400'
                        }`}
                      >
                        {node.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Node ID</span>
                      <span className="text-slate-200 font-semibold">{node.nodeId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">MAC</span>
                      <span className="font-mono text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded truncate block mt-0.5">{node.macAddress}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">IP Local</span>
                      <span className="text-slate-300">{node.localIp || '192.168.1.100'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Porta SRT</span>
                      <span className="text-slate-400">{node.srtPort}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(node)}
                      className="flex-1 py-2.5 px-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 active:scale-[0.99] border border-slate-700 rounded-xl text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <span>Ver Detalhes do Nó</span>
                      <ChevronRight className="w-4 h-4 text-orange-500" />
                    </button>

                    {(node.arenaId || node.arena?.id) && (
                      <button
                        type="button"
                        id={`btnDeleteArenaMobile-${node.nodeId}`}
                        onClick={() =>
                          setArenaToDelete({
                            id: node.arenaId || node.arena.id,
                            name: node.arena?.name || node.nodeId,
                          })
                        }
                        className="p-2.5 min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 rounded-xl text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                        title={`Excluir arena ${node.arena?.name || node.nodeId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          </div>
        ) : (
          /* Desktop Table */
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="nodesTable">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60">
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap font-['Inter']">
                Arena
              </th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap font-['Inter']">
                Node ID
              </th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap font-['Inter']">
                MAC Address
              </th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap text-center font-['Inter']">
                Status
              </th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap text-right font-['Inter']">
                IP Local
              </th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap text-right font-['Inter']">
                Porta SRT
              </th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap text-right font-['Inter']">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="text-xs text-slate-200 divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                    <p className="font-mono text-xs text-slate-400">Carregando nós Edge...</p>
                  </div>
                </td>
              </tr>
            ) : filteredNodes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <SearchX className="w-8 h-8 text-slate-500" />
                    <p>Nenhum nó encontrado para os filtros selecionados.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredNodes.map((node) => {
                const isOnline = node.status === 'ONLINE';
                const isWarning = node.status === 'WARNING';
                const isOffline = node.status === 'OFFLINE';

                return (
                  <tr
                    key={node.id}
                    id={`node-row-${node.nodeId}`}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Arena Name (via include) */}
                    <td className="py-3.5 px-4 font-semibold text-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-slate-500" />
                        <span>{node.arena?.name || 'Arena Sem Vínculo'}</span>
                      </div>
                    </td>

                    {/* Node ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800">
                        {node.nodeId}
                      </span>
                    </td>

                    {/* MAC Address */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded">
                        {node.macAddress}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-800">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOnline
                              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                              : isWarning
                              ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse'
                              : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse'
                          }`}
                        />
                        <span
                          className={`text-[11px] font-mono font-bold capitalize ${
                            isOnline ? 'text-emerald-400' : isWarning ? 'text-orange-400' : 'text-red-400'
                          }`}
                        >
                          {node.status}
                        </span>
                      </div>
                    </td>

                    {/* IP Local */}
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap text-slate-300">
                      {node.localIp || '192.168.1.100'}
                    </td>

                    {/* SRT Port */}
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap text-slate-400">
                      {node.srtPort}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          id={`btnDetails-${node.nodeId}`}
                          onClick={() => handleOpenDetails(node)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-orange-500/10 hover:text-orange-500 text-slate-300 border border-slate-700 hover:border-orange-500/40 rounded-lg transition-all text-xs font-semibold cursor-pointer"
                        >
                          <span>Detalhes</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        {(node.arenaId || node.arena?.id) && (
                          <button
                            type="button"
                            id={`btnDeleteArena-${node.nodeId}`}
                            onClick={() =>
                              setArenaToDelete({
                                id: node.arenaId || node.arena.id,
                                name: node.arena?.name || node.nodeId,
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title={`Excluir arena ${node.arena?.name || node.nodeId}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
          </div>
        )}
      </div>

      {/* Node Details Slide-over Modal */}
      <NodeDetailsModal
        isOpen={isModalOpen}
        node={selectedNode}
        onClose={handleCloseModal}
        onDeleteArena={(arenaId, arenaName) =>
          setArenaToDelete({ id: arenaId, name: arenaName })
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border flex items-center gap-2.5 ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

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
                id="btnConfirmDeleteArenaNodesView"
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
