'use client';

import React, { useState } from 'react';
import NodeDetailsModal, { NodeData } from './NodeDetailsModal';

export const INITIAL_NODES_DATA: NodeData[] = [
  {
    id: 'node-1',
    nodeId: 'node-pr-112',
    arena: 'Arena Society Paranaguá',
    mqttStatus: 'online',
    droppedFrames: 0.05,
    ramdiskUsage: 15,
    smartSsdLife: 98,
    localIp: '192.168.1.105',
    srtPort: 9000,
    courtsCount: 2,
    lastHeartbeat: 'Agora mesmo',
  },
  {
    id: 'node-2',
    nodeId: 'node-sp-004',
    arena: 'Clube Pinheiros',
    mqttStatus: 'online',
    droppedFrames: 1.2,
    ramdiskUsage: 78,
    smartSsdLife: 92,
    localIp: '192.168.10.40',
    srtPort: 9002,
    courtsCount: 4,
    lastHeartbeat: '2s atrás',
  },
  {
    id: 'node-3',
    nodeId: 'node-mg-088',
    arena: 'Complexo Esportivo BH',
    mqttStatus: 'offline',
    droppedFrames: 15.4,
    ramdiskUsage: 95,
    smartSsdLife: 89,
    localIp: '10.0.0.88',
    srtPort: 9004,
    courtsCount: 2,
    lastHeartbeat: '14 min atrás',
  },
  {
    id: 'node-4',
    nodeId: 'node-rj-021',
    arena: 'Quadras Gávea',
    mqttStatus: 'online',
    droppedFrames: 0.0,
    ramdiskUsage: 8,
    smartSsdLife: 45,
    localIp: '192.168.0.21',
    srtPort: 9006,
    courtsCount: 1,
    lastHeartbeat: 'Agora mesmo',
  },
  {
    id: 'node-5',
    nodeId: 'node-sc-019',
    arena: 'Arena Joinville Beach & Fut',
    mqttStatus: 'warning',
    droppedFrames: 3.8,
    ramdiskUsage: 84,
    smartSsdLife: 96,
    localIp: '192.168.2.19',
    srtPort: 9008,
    courtsCount: 3,
    lastHeartbeat: '4s atrás',
  },
];

interface NodesViewProps {
  onDeployClick?: () => void;
}

export default function NodesView({ onDeployClick }: NodesViewProps) {
  const [nodes, setNodes] = useState<NodeData[]>(INITIAL_NODES_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOfflineOnly, setFilterOfflineOnly] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetails = (node: NodeData) => {
    setSelectedNode(node);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNode(null);
  };

  const filteredNodes = nodes.filter((n) => {
    const matchSearch =
      n.arena.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.nodeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchOffline = filterOfflineOnly ? n.mqttStatus === 'offline' : true;
    return matchSearch && matchOffline;
  });

  const totalOnline = nodes.filter((n) => n.mqttStatus === 'online').length;
  const totalWarning = nodes.filter((n) => n.mqttStatus === 'warning').length;
  const totalOffline = nodes.filter((n) => n.mqttStatus === 'offline').length;

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
            {nodes.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">100% instâncias N100</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Online & Gravando</span>
            <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-['Sora'] mt-2">
            {totalOnline}
          </p>
          <p className="text-[11px] text-emerald-500/80 mt-0.5 font-mono">Sinal RTSP Estável</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Atenção (Buffer)</span>
            <span className="material-symbols-outlined text-orange-500 text-[18px]">warning</span>
          </div>
          <p className="text-2xl font-bold text-orange-400 font-['Sora'] mt-2">
            {totalWarning}
          </p>
          <p className="text-[11px] text-orange-500/80 mt-0.5 font-mono">Ramdisk &gt; 80%</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Offline / Falha</span>
            <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
          </div>
          <p className="text-2xl font-bold text-red-400 font-['Sora'] mt-2">
            {totalOffline}
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
            placeholder="Buscar Node ID ou Arena..."
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
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap text-center font-['Inter']">
                Status MQTT
              </th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap text-right font-['Inter']">
                Dropped Frames
              </th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap font-['Inter']">
                Ramdisk Usage
              </th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap text-right font-['Inter']">
                S.M.A.R.T SSD Life
              </th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap text-right font-['Inter']">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="text-xs text-slate-200 divide-y divide-slate-800/60">
            {filteredNodes.length === 0 ? (
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
                const isOnline = node.mqttStatus === 'online';
                const isWarning = node.mqttStatus === 'warning';
                const isOffline = node.mqttStatus === 'offline';

                return (
                  <tr
                    key={node.id}
                    id={`node-row-${node.nodeId}`}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Arena Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-500 text-[18px]">
                          stadium
                        </span>
                        <span>{node.arena}</span>
                      </div>
                    </td>

                    {/* Node ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800">
                        {node.nodeId}
                      </span>
                    </td>

                    {/* MQTT Status */}
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
                          {node.mqttStatus}
                        </span>
                      </div>
                    </td>

                    {/* Dropped Frames */}
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          node.droppedFrames > 5
                            ? 'text-red-400 font-bold'
                            : node.droppedFrames > 1
                            ? 'text-orange-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {node.droppedFrames.toFixed(2)}%
                      </span>
                    </td>

                    {/* Ramdisk Usage with Bar */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              node.ramdiskUsage > 85
                                ? 'bg-red-500'
                                : node.ramdiskUsage > 60
                                ? 'bg-orange-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${node.ramdiskUsage}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 w-8">
                          {node.ramdiskUsage}%
                        </span>
                      </div>
                    </td>

                    {/* S.M.A.R.T SSD Life */}
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          node.smartSsdLife < 50
                            ? 'text-orange-400'
                            : node.smartSsdLife < 30
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {node.smartSsdLife}%
                      </span>
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
