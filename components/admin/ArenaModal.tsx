'use client';

import React, { useState } from 'react';
import { Landmark, X, Info, Cpu, Video, RefreshCw, Plus, Check, ShieldCheck, Trash2 } from 'lucide-react';

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
  features?: Record<string, boolean>;
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
  onDelete?: (arena: ArenaInfraData) => void;
}

export default function ArenaModal({
  isOpen,
  arena,
  onClose,
  onSave,
  onDelete,
}: ArenaModalProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'edge' | 'cameras' | 'features'>('geral');

  // Form State
  const [name, setName] = useState(arena?.name || '');
  const [cityState, setCityState] = useState(arena?.cityState || 'Paranaguá - PR');
  const [courtsCount, setCourtsCount] = useState(arena?.courtsCount || 2);
  const [contactName, setContactName] = useState(arena?.contactName || '');
  const [contactPhone, setContactPhone] = useState(arena?.contactPhone || '(41) 99876-5432');
  const [plan, setPlan] = useState(arena?.plan || 'Pro 2 Quadras');
  const [features, setFeatures] = useState<Record<string, boolean>>(
    arena?.features || {
      'auto_clipping': true,
      'custom_overlay': false,
      'live_streaming': false,
      'api_access': false,
    }
  );

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
    setCourtsCount((prev) => Math.max(prev, nextCourt));
  };

  const handleRemoveCamera = (index: number) => {
    setCameras((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((cam, i) => ({
        ...cam,
        courtNumber: i + 1,
        cameraName: cam.cameraName.startsWith('Câmera Quadra')
          ? `Câmera Quadra ${i + 1}`
          : cam.cameraName,
      }));
    });
    setCourtsCount((prev) => Math.max(1, prev - 1));
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
      features,
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
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Sora'] font-bold text-sm text-slate-100">
                {arena ? `Editar Arena: ${arena.name}` : 'Provisionar Nova Arena B2B'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Configuração da central de processamento e conexões de câmeras.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tabs Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2">
          <button
            type="button"
            id="tabModalGeral"
            onClick={() => setActiveTab('geral')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'geral'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>1. Dados Gerais</span>
          </button>

          <button
            type="button"
            id="tabModalEdge"
            onClick={() => setActiveTab('edge')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'edge'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>2. Infra Edge (N100)</span>
          </button>

          <button
            type="button"
            id="tabModalCameras"
            onClick={() => setActiveTab('cameras')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'cameras'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>3. Câmeras ({cameras.length})</span>
          </button>
          <button
            type="button"
            id="tabModalFeatures"
            onClick={() => setActiveTab('features')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'features'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>4. Permissões</span>
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
                <Cpu className="w-5 h-5 text-orange-500" />
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
                    Token de Autenticação da Unidade
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateMqttToken}
                    className="text-[10px] text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
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
                <p className="text-slate-300 font-bold">Comando de Instalação no Sistema:</p>
                <p className="text-orange-400">
                  curl -sSL https://get.sportsreview.app/bootstrap.sh | sudo bash -s -- --token={mqttToken}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CÂMERAS & BOTOEIRAS */}
          {activeTab === 'cameras' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">
                  Câmeras das quadras e botões de acionamento de lances.
                </span>
                <button
                  type="button"
                  onClick={handleAddCamera}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
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
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                          SINAL ATIVO
                        </span>
                        {cameras.length > 1 && (
                          <button
                            type="button"
                            id={`btnRemoveCamera-${idx}`}
                            onClick={() => handleRemoveCamera(idx)}
                            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                            title={`Remover Quadra ${cam.courtNumber}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">
                          Endereço do Sinal de Vídeo
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

          {/* TAB 4: MÓDULOS & PERMISSÕES */}
          {activeTab === 'features' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400">
                Configure os Entitlements granulares desta Arena. Estes flags ativam ou ocultam funcionalidades no painel do Tenant (Feature Flags).
              </div>
              <div className="space-y-2">
                {[
                  { id: 'auto_clipping', label: 'Corte Automático (Highlights)', desc: 'Permite gerar replays e cortes de lances' },
                  { id: 'custom_overlay', label: 'Overlay Personalizado (OBS)', desc: 'Permite trocar logos de patrocinadores na tela' },
                  { id: 'live_streaming', label: 'Transmissão ao Vivo (YouTube)', desc: 'Habilita botão de ir ao vivo (Go Live)' },
                  { id: 'api_access', label: 'Acesso via API Externa', desc: 'Permite que aplicativos terceiros leiam dados da arena' },
                  { id: 'player_portal', label: 'Portal do Atleta (QR Code)', desc: 'Libera escaneamento do QR Code no alambrado' },
                ].map((ff) => (
                  <label key={ff.id} className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-colors">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 bg-slate-900 border-slate-700 rounded text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-950"
                        checked={features[ff.id] || false}
                        onChange={(e) => setFeatures({ ...features, [ff.id]: e.target.checked })}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200">{ff.label}</span>
                      <span className="text-[10px] text-slate-500">{ff.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              {arena && onDelete && (
                <button
                  type="button"
                  id="btnDeleteArenaModal"
                  onClick={() => {
                    onClose();
                    onDelete(arena);
                  }}
                  className="px-4 py-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Excluir Arena</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              id="btnSaveArena"
              className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Provisionamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
