'use client';

import React, { useState, useEffect } from 'react';
import NodeDetailsModal, { NodeData } from './NodeDetailsModal';

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

interface NodesViewProps {
  onDeployClick?: () => void;
}

export default function NodesView({ onDeployClick }: NodesViewProps) {
  const [nodes, setNodes] = useState<EdgeNodeWithArena[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOfflineOnly, setFilterOfflineOnly] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchNodes = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/nodes', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(`Erro na API (${res.status})`);
        }
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setNodes(data);
        }
      } catch (err) {
        console.error('Falha ao carregar nós Edge:', err);
      } finally {
        if (isMounted) setIsLoading(false);
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
            className="self-start md:self-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Provisionar Novo Nó
          </button>
        )}
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total de Nós</span>
            <span className="material-symbols-outlined text-slate-500 text-[18px]">dns</span>
          </div>
          <p className="text-2xl font-bold text-slate-100 font-['Sora'] mt-2">
            {isLoading ? '...' : nodes.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">100% instâncias N100</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Online & Gravando</span>
            <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-['Sora'] mt-2">
            {isLoading ? '...' : totalOnline}
          </p>
          <p className="text-[11px] text-emerald-500/80 mt-0.5 font-mono">Sinal RTSP Estável</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Atenção (Buffer)</span>
            <span className="material-symbols-outlined text-orange-500 text-[18px]">warning</span>
          </div>
          <p className="text-2xl font-bold text-orange-400 font-['Sora'] mt-2">
            {isLoading ? '...' : totalWarning}
          </p>
          <p className="text-[11px] text-orange-500/80 mt-0.5 font-mono">Ramdisk &gt; 80%</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Offline / Falha</span>
            <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
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
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            id="inputSearchNodes"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar Node ID, MAC ou Arena..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btnFilterOffline"
            onClick={() => setFilterOfflineOnly(!filterOfflineOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              filterOfflineOnly
                ? 'bg-red-500/10 text-red-400 border-red-500/40 font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {filterOfflineOnly ? 'filter_alt' : 'filter_list'}
            </span>
            <span>{filterOfflineOnly ? 'Mostrando Apenas Offlines' : 'Filtrar Offline'}</span>
          </button>
        </div>
      </div>

      {/* Nodes Table */}
      <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
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
                    <span className="material-symbols-outlined text-3xl text-orange-500 animate-spin">
                      sync
                    </span>
                    <p className="font-mono text-xs text-slate-400">Carregando nós Edge do PostgreSQL...</p>
                  </div>
                </td>
              </tr>
            ) : filteredNodes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-slate-500">search_off</span>
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
                        <span className="material-symbols-outlined text-slate-500 text-[18px]">
                          stadium
                        </span>
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
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800/80 text-orange-400/90 font-bold">
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
                      <button
                        type="button"
                        id={`btnDetails-${node.nodeId}`}
                        onClick={() => handleOpenDetails(node)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-orange-500/10 hover:text-orange-500 text-slate-300 border border-slate-700 hover:border-orange-500/40 rounded-lg transition-all text-xs font-semibold"
                      >
                        <span>Detalhes</span>
                        <span className="material-symbols-outlined text-[14px]">
                          chevron_right
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Node Details Slide-over Modal */}
      <NodeDetailsModal
        isOpen={isModalOpen}
        node={selectedNode}
        onClose={handleCloseModal}
      />
    </div>
  );
}
