'use client';

import React, { useState } from 'react';

export interface ArenaInfraData {
  id: string;
  name: string;
  cityState: string;
  courtsCount: number;
  contactName: string;
  contactPhone: string;
  plan: string;
  status: 'ONLINE' | 'PROVISIONANDO' | 'OFFLINE';
  macAddress: string;
  ipLan: string;
  mqttToken: string;
  cameras: {
    courtNumber: number;
    cameraName: string;
    rtspUrl: string;
    esp32Ip: string;
    status: 'ONLINE' | 'OFFLINE';
  }[];
}

interface ArenaModalProps {
  isOpen: boolean;
  arena?: ArenaInfraData | null;
  onClose: () => void;
  onSave: (arenaData: ArenaInfraData) => void;
}

export default function ArenaModal({
  isOpen,
  arena,
  onClose,
  onSave,
}: ArenaModalProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'edge' | 'cameras'>('geral');

  // Form State
  const [name, setName] = useState(arena?.name || '');
  const [cityState, setCityState] = useState(arena?.cityState || 'Paranaguá - PR');
  const [courtsCount, setCourtsCount] = useState(arena?.courtsCount || 2);
  const [contactName, setContactName] = useState(arena?.contactName || '');
  const [contactPhone, setContactPhone] = useState(arena?.contactPhone || '(41) 99876-5432');
  const [plan, setPlan] = useState(arena?.plan || 'Pro 2 Quadras');

  // Edge Infra State
  const [macAddress, setMacAddress] = useState(
    arena?.macAddress || 'B8:27:EB:A4:91:0F'
  );
  const [ipLan, setIpLan] = useState(arena?.ipLan || '192.168.15.200');
  const [mqttToken, setMqttToken] = useState(
    arena?.mqttToken || 'tok_live_n100_edge_789456123'
  );

  // Cameras State
  const [cameras, setCameras] = useState<ArenaInfraData['cameras']>(
    arena?.cameras || [
      {
        courtNumber: 1,
        cameraName: 'Câmera Principal (Gol Norte)',
        rtspUrl: 'rtsp://admin:pass123@192.168.15.51:554/stream1',
        esp32Ip: '192.168.15.101',
        status: 'ONLINE',
      },
      {
        courtNumber: 2,
        cameraName: 'Câmera Principal (Lateral)',
        rtspUrl: 'rtsp://admin:pass123@192.168.15.52:554/stream1',
        esp32Ip: '192.168.15.102',
        status: 'ONLINE',
      },
    ]
  );

  if (!isOpen) return null;

  const handleGenerateMqttToken = () => {
    const randomHex = Math.random().toString(36).substring(2, 12);
    setMqttToken(`tok_live_n100_${randomHex}`);
  };

  const handleCameraChange = (
    index: number,
    field: 'cameraName' | 'rtspUrl' | 'esp32Ip',
    value: string
  ) => {
    setCameras((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddCamera = () => {
    const nextCourt = cameras.length + 1;
    setCameras((prev) => [
      ...prev,
      {
        courtNumber: nextCourt,
        cameraName: `Câmera Quadra ${nextCourt}`,
        rtspUrl: `rtsp://admin:pass123@192.168.15.${50 + nextCourt}:554/stream1`,
        esp32Ip: `192.168.15.${100 + nextCourt}`,
        status: 'ONLINE',
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: ArenaInfraData = {
      id: arena?.id || `arena-${Date.now().toString().slice(-4)}`,
      name: name || 'Nova Arena Esportiva',
      cityState,
      courtsCount,
      contactName,
      contactPhone,
      plan,
      status: 'ONLINE',
      macAddress,
      ipLan,
      mqttToken,
      cameras,
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
              <span className="material-symbols-outlined text-[20px]">
                stadium
              </span>
            </div>
            <div>
              <h3 className="font-['Sora'] font-bold text-sm text-slate-100">
                {arena ? `Editar Arena: ${arena.name}` : 'Provisionar Nova Arena B2B'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Configuração do Mini PC N100, credenciais RTSP e tópicos MQTT.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* 3 Tabs Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2">
          <button
            type="button"
            id="tabModalGeral"
            onClick={() => setActiveTab('geral')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'geral'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>1. Dados Gerais</span>
          </button>

          <button
            type="button"
            id="tabModalEdge"
            onClick={() => setActiveTab('edge')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'edge'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">memory</span>
            <span>2. Infra Edge (N100)</span>
          </button>

          <button
            type="button"
            id="tabModalCameras"
            onClick={() => setActiveTab('cameras')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'cameras'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">videocam</span>
            <span>3. Câmeras RTSP ({cameras.length})</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                    Nome Fantasia da Arena
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Arena Society Paranaguá"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                    Cidade / Estado
                  </label>
                  <input
                    type="text"
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    placeholder="Paranaguá - PR"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                    Nº de Quadras
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={courtsCount}
                    onChange={(e) => setCourtsCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-orange-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                    Plano Contratado
                  </label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-orange-500 outline-none"
                  >
                    <option value="Starter 1 Quadra">Starter 1 Quadra (R$ 1.490/mês)</option>
                    <option value="Pro 2 Quadras">Pro 2 Quadras (R$ 2.290/mês)</option>
                    <option value="Enterprise 4 Quadras">Enterprise 4 Quadras (R$ 3.490/mês)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(41) 99876-5432"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                  Responsável Técnico / Dono
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nome do Gestor Local"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-orange-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: INFRA EDGE */}
          {activeTab === 'edge' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500 text-[18px]">
                  developer_board
                </span>
                <span>
                  O Mini PC N100 roda Ubuntu Server 24.04 com Docker Compose (OBS + Node-RED + Mosquitto).
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                    MAC Address (Interface ETH0)
                  </label>
                  <input
                    type="text"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    placeholder="B8:27:EB:A4:91:0F"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                    IP Estático na LAN Local
                  </label>
                  <input
                    type="text"
                    value={ipLan}
                    onChange={(e) => setIpLan(e.target.value)}
                    placeholder="192.168.15.200"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                    Token de Autenticação MQTT Broker
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateMqttToken}
                    className="text-[10px] text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    Gerar Novo Token
                  </button>
                </div>
                <input
                  type="text"
                  value={mqttToken}
                  onChange={(e) => setMqttToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:border-orange-500 outline-none"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                <p className="text-slate-300 font-bold">Comando de Instalação no Edge:</p>
                <p className="text-orange-400">
                  curl -sSL https://get.sportsreview.app/bootstrap.sh | sudo bash -s -- --token={mqttToken}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CÂMERAS RTSP & BOTOEIRAS */}
          {activeTab === 'cameras' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">
                  Câmeras IP com compressão H.264/H.265 e botões físicos ESP32.
                </span>
                <button
                  type="button"
                  onClick={handleAddCamera}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Adicionar Câmera
                </button>
              </div>

              <div className="space-y-3">
                {cameras.map((cam, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        Quadra {cam.courtNumber} • {cam.cameraName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                        RTSP ATIVO
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">
                          URL RTSP Stream
                        </label>
                        <input
                          type="text"
                          value={cam.rtspUrl}
                          onChange={(e) =>
                            handleCameraChange(idx, 'rtspUrl', e.target.value)
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] font-mono text-slate-200 outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">
                          IP do Módulo ESP32 (Botoeira)
                        </label>
                        <input
                          type="text"
                          value={cam.esp32Ip}
                          onChange={(e) =>
                            handleCameraChange(idx, 'esp32Ip', e.target.value)
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] font-mono text-slate-200 outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              id="btnSaveArena"
              className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>Salvar Provisionamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
