'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useArenaState } from '@/hooks/useArenaState';

export interface NodeData {
  id: string;
  nodeId: string;
  arena: string;
  mqttStatus: 'online' | 'offline' | 'warning';
  droppedFrames: number;
  ramdiskUsage: number;
  smartSsdLife: number;
  localIp: string;
  srtPort: number;
  courtsCount: number;
  lastHeartbeat: string;
}

interface NodeDetailsModalProps {
  isOpen: boolean;
  node: NodeData | null;
  onClose: () => void;
}

export default function NodeDetailsModal({ isOpen, node, onClose }: NodeDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'network' | 'actions' | 'logs'>('network');
  const [logs, setLogs] = useState<string[]>([]);
  const [isLiveStreamingLogs, setIsLiveStreamingLogs] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Hook global de estado e telemetria da arena selecionada
  const { telemetry } = useArenaState(node?.nodeId || 'node-pr-112');

  // Inicialização de logs ao abrir o modal
  useEffect(() => {
    if (!isOpen || !node) {
      setLogs([]);
      return;
    }

    const initialLogs = [
      `[MQTT] Conectado ao broker tls://mqtt.sportsreview.internal:8883...`,
      `[MQTT] Autenticado com client_id: edge-${node.nodeId}`,
      `[MQTT] Subscribed to telemetry/nodes/${node.nodeId}/#`,
      `[EDGE] OBS Studio v30.2.2 WebSocket server online na porta 4455`,
      `[EDGE] Node-RED flow engine: ativo (3 runners executando)`,
      `[STORAGE] Ramdisk /dev/shm/replay_buffer montado (4096MB)`,
      `[HEARTBEAT] Telemetria inicial sincronizada com sucesso.`,
    ];
    setLogs(initialLogs);
  }, [isOpen, node]);

  // Streaming de logs MQTT derivado diretamente da telemetria do hook useArenaState
  useEffect(() => {
    if (!isOpen || !node || !isLiveStreamingLogs || !telemetry.lastPacketTime) return;

    const logMsg = `[${telemetry.lastPacketTime}] > {"cpu": "${telemetry.cpu}%", "temp": "${telemetry.temp}°C", "fps": ${telemetry.fps}, "bitrate_mbps": ${telemetry.bitrateMbps}, "ramdisk": "${node.ramdiskUsage}%", "status": "ok"}`;

    setLogs((prev) => {
      // Evita duplicar exatamente a mesma linha consecutiva
      if (prev.length > 0 && prev[prev.length - 1] === logMsg) return prev;
      const next = [...prev, logMsg];
      if (next.length > 60) return next.slice(next.length - 60);
      return next;
    });
  }, [isOpen, node, isLiveStreamingLogs, telemetry]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen || !node) return null;

  const handleTriggerAction = (actionName: string) => {
    setActionFeedback(`Comando "${actionName}" transmitido via MQTT para ${node.nodeId}`);
    setLogs((prev) => [
      ...prev,
      `[CMD_DISPATCH] MQTT Publish topic="edge/cmd/${node.nodeId}" payload={"action":"${actionName}"}`,
    ]);
    setTimeout(() => {
      setActionFeedback(null);
    }, 3500);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        id="nodeModalOverlay"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer */}
      <div
        id="nodeDetailsModal"
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 h-full w-full sm:w-[560px] bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 md:p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500 text-xl">router</span>
              <h2 className="text-base font-bold text-slate-100 font-['Sora']">
                Detalhes do Nó Edge
              </h2>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                {node.nodeId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{node.arena}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    node.mqttStatus === 'online'
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                      : node.mqttStatus === 'warning'
                      ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.7)]'
                      : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                  }`}
                />
                MQTT {node.mqttStatus.toUpperCase()}
              </span>
            </p>
          </div>

          <button
            type="button"
            id="btnCloseNodeModal"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div className="mx-4 mt-4 px-3 py-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Live Telemetry KPI Bar - Powered by useArenaState */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-slate-950/40 border-b border-slate-800 text-center">
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400">CPU Load</p>
            <p className={`text-sm font-bold font-mono mt-0.5 ${telemetry.cpu > 70 ? 'text-orange-400' : 'text-emerald-400'}`}>
              {telemetry.cpu}%
            </p>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400">Temperatura</p>
            <p className={`text-sm font-bold font-mono mt-0.5 ${telemetry.temp > 65 ? 'text-red-400' : 'text-slate-200'}`}>
              {telemetry.temp}°C
            </p>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400">RTSP FPS</p>
            <p className="text-sm font-bold font-mono mt-0.5 text-emerald-400">
              {telemetry.fps}
            </p>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400">Bitrate</p>
            <p className="text-sm font-bold font-mono mt-0.5 text-slate-200">
              {telemetry.bitrateMbps}M
            </p>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-4">
          <button
            type="button"
            onClick={() => setActiveTab('network')}
            className={`flex-1 py-3 text-xs font-bold tracking-wide border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'network'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">lan</span>
            Configuração de Rede
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-3 text-xs font-bold tracking-wide border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'actions'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            Ações Rápidas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-3 text-xs font-bold tracking-wide border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            Terminal MQTT
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
          {/* Tab 1: Network Config */}
          {activeTab === 'network' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-3 p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    IP Local do Mini PC (N100)
                  </label>
                  <input
                    type="text"
                    defaultValue={node.localIp}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Endereço estático na rede local da arena.</p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Porta Ingest SRT (OBS Studio)
                  </label>
                  <input
                    type="number"
                    defaultValue={node.srtPort}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Câmeras Vinculadas (RTSP Ingest)
                  </label>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between font-mono">
                      <span>Quadra 1 - Central:</span>
                      <span className="text-emerald-400">rtsp://192.168.1.201:554/ch0</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Quadra 1 - Gol Esquerdo:</span>
                      <span className="text-emerald-400">rtsp://192.168.1.202:554/ch0</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerAction('Salvar Parâmetros de Rede')}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors mt-2"
                >
                  Salvar e Reiniciar Ingest
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Quick Actions */}
          {activeTab === 'actions' && (
            <div className="space-y-4 animate-in fade-in">
              <p className="text-xs text-slate-400">
                Dispare comandos administrativos remotos diretamente no Edge N100 via broker MQTT autenticado.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTriggerAction('Reiniciar Container OBS Studio')}
                  className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-orange-500/50 hover:bg-orange-500/5 rounded-lg text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-orange-500 mb-2">
                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-orange-400">
                    Reiniciar OBS Studio
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Reinicia o daemon Docker sem descarregar o SO.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerAction('Limpar Ramdisk Buffer')}
                  className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-lg text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 mb-2">
                    <span className="material-symbols-outlined text-[18px]">memory</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">
                    Limpar Buffer RAM
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Esvazia a partição tmpfs /dev/shm de replays.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerAction('Recarregar Fluxos Node-RED')}
                  className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-orange-500/50 hover:bg-orange-500/5 rounded-lg text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-orange-500 mb-2">
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-orange-400">
                    Recarregar Node-RED
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sincroniza gatilhos dos botões físicos USB.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerAction('Testar Upload AWS S3')}
                  className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-lg text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 mb-2">
                    <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">
                    Testar Bucket S3
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Valida credenciais IAM e latência do bucket.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: MQTT Terminal Logs - Streaming from useArenaState */}
          {activeTab === 'logs' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-mono text-slate-300">
                    telemetry/nodes/{node.nodeId}/live
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLiveStreamingLogs(!isLiveStreamingLogs)}
                    className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                      isLiveStreamingLogs
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isLiveStreamingLogs ? 'PAUSAR STREAM' : 'RETOMAR STREAM'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                    title="Limpar logs"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              </div>

              {/* Console Box */}
              <div
                id="mqttTerminalBox"
                className="bg-black/90 rounded-lg p-3.5 border border-slate-800 font-mono text-xs text-emerald-400 h-80 overflow-y-auto space-y-1 shadow-inner selection:bg-emerald-500 selection:text-black"
              >
                {logs.map((log, index) => (
                  <div key={index} className="leading-relaxed whitespace-pre-wrap break-all opacity-95">
                    {log}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-mono">
            Último pacote MQTT: {telemetry.lastPacketTime || node.lastHeartbeat}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </>
  );
}
