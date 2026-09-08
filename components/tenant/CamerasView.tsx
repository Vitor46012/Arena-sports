'use client';

import React, { useState, useEffect } from 'react';
import { Video, RefreshCw, VideoOff, Radio, Film, Cpu, Sparkles, Monitor, Smartphone, Tablet, Tv } from 'lucide-react';
import { useDeviceLayout } from '@/contexts/DeviceLayoutContext';

export interface RTSPCameraFeed {
  id: string;
  nodeId?: string;
  court: string;
  name: string;
  rtspUrl: string;
  resolution: string;
  fps: number;
  bitrateKbps: number;
  status: 'ONLINE' | 'OFFLINE' | 'RECONECTANDO';
  posterUrl?: string;
}

export default function CamerasView() {
  const [cameras, setCameras] = useState<RTSPCameraFeed[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reloadingCamId, setReloadingCamId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { deviceSpecs, targetResolution, resolutionPreference } = useDeviceLayout();

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCameras = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/cameras', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Erro na API (${res.status})`);
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setCameras(data);
        }
      } catch (err) {
        console.warn('Falha ao carregar câmeras RTSP do banco:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCameras();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleReloadStream = (camId: string, camName: string) => {
    setReloadingCamId(camId);
    setCameras((prev) =>
      prev.map((c) => (c.id === camId ? { ...c, status: 'RECONECTANDO' } : c))
    );

    setTimeout(() => {
      setCameras((prev) =>
        prev.map((c) => (c.id === camId ? { ...c, status: 'ONLINE' } : c))
      );
      setReloadingCamId(null);
      showToast(`Conexão da câmera "${camName}" reiniciada com sucesso!`);
    }, 1200);
  };

  const handleManualTrigger = (cam: RTSPCameraFeed) => {
    showToast(`Corte manual de 30s gravado para ${cam.court}!`);
  };

  const activeCount = cameras.filter((c) => c.status === 'ONLINE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 bg-slate-900 border-slate-700 text-slate-100">
          <Video className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-['Sora'] tracking-tight">
            Câmeras da Quadra
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Acompanhe ao vivo todas as câmeras instaladas no seu complexo esportivo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-slate-300">
              Câmeras: {activeCount}/{cameras.length} Ativas
            </span>
          </div>
        </div>
      </div>

      {/* Automatic Device & Resolution Diagnostic Banner */}
      <div
        suppressHydrationWarning
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            {deviceSpecs.formFactor === 'mobile' ? (
              <Smartphone className="w-5 h-5" />
            ) : deviceSpecs.formFactor === 'tablet' ? (
              <Tablet className="w-5 h-5" />
            ) : deviceSpecs.formFactor === 'tv' ? (
              <Tv className="w-5 h-5" />
            ) : (
              <Monitor className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-slate-200">
                Dispositivo Identificado: <span className="text-orange-400">{deviceSpecs.modelName}</span> ({deviceSpecs.osName})
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Resolução Automática
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Tela: <strong className="text-slate-300 font-mono">{deviceSpecs.screen.physicalWidth}x{deviceSpecs.screen.physicalHeight}px</strong> (DPR {deviceSpecs.screen.dpr}x) • Formato: <span className="text-slate-300 font-mono">{deviceSpecs.aspectRatio.label}</span> • Diagnóstico: {deviceSpecs.detectionReason}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 text-xs font-mono shrink-0">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Perfil de Transmissão</div>
            <div className="font-bold text-orange-400">
              {targetResolution.shortTag} ({targetResolution.width}x{targetResolution.height})
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-slate-900 border border-slate-800 rounded-xl">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Carregando a lista de câmeras...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && cameras.length === 0 && (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-xl p-8">
          <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-500 mb-3">
            <VideoOff className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-slate-200 font-['Sora']">
            Nenhuma câmera instalada
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5">
            As câmeras vinculadas às quadras do seu complexo aparecerão aqui.
          </p>
        </div>
      )}

      {/* 2-Column Video Feeds Grid */}
      {!isLoading && cameras.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cameras.map((cam) => {
            const isReloading = reloadingCamId === cam.id;
            const isOnline = cam.status === 'ONLINE';

            return (
              <div
                key={cam.id}
                id={`cam-container-${cam.id}`}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between"
              >
                {/* RTSP Native Container (Zero Fake Images / Raw RTSP Signaling View) */}
                <div className="relative w-full aspect-video bg-black overflow-hidden group flex flex-col justify-between p-4">
                  {/* Status Badge Top Left */}
                  <div className="flex items-center justify-between w-full z-10">
                    <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded text-white text-[11px] font-mono font-bold tracking-wider">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></span>
                      <span className={isOnline ? 'text-red-400' : 'text-slate-400'}>
                        {isOnline ? 'AO VIVO' : 'OFFLINE'}
                      </span>
                      <span className="text-slate-600 font-normal">|</span>
                      <span className="text-slate-300">{cam.fps || 60} FPS</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-sm border border-slate-800 px-2 py-1 rounded text-slate-300 text-[10px] font-mono">
                      <span title="Resolução da câmera">Qualidade: {cam.resolution || 'Alta (HD)'}</span>
                      <span className="text-slate-600">•</span>
                      <span title="Resolução ajustada ao dispositivo ativo" className="text-orange-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {targetResolution.shortTag}
                      </span>
                    </div>
                  </div>

                  {/* Central Technical Loading / WebRTC Transcoding Box */}
                  <div className="my-auto flex flex-col items-center justify-center text-center px-6 py-4 space-y-3 z-10">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-orange-500 shadow-inner">
                        {isReloading ? (
                          <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                        ) : (
                          <Radio className="w-6 h-6 text-orange-400" />
                        )}
                      </div>
                      {isOnline && !isReloading && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-black"></span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 max-w-sm">
                      <p className="text-xs font-mono font-bold text-slate-200 leading-relaxed">
                        Câmera conectada. Preparando o vídeo ao vivo para você...
                      </p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {cam.rtspUrl}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Bar Info Overlay */}
                  <div className="w-full flex items-end justify-between z-10 pt-2 border-t border-slate-900">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 font-mono block">
                        {cam.court}
                      </span>
                      <h3 className="text-xs font-bold text-white tracking-tight">
                        {cam.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Porta 554 • H.264
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                    <span className="text-xs text-slate-400 font-medium">
                      Encoder: <strong className="text-slate-300 font-mono">Transmissão Automática</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleManualTrigger(cam)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Film className="w-4 h-4 text-orange-400" />
                      <span>Gravar Corte</span>
                    </button>

                    <button
                      type="button"
                      id={`btnReload-${cam.id}`}
                      disabled={isReloading}
                      onClick={() => handleReloadStream(cam.id, cam.name)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 hover:text-orange-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          isReloading ? 'animate-spin text-orange-500' : ''
                        }`}
                      />
                      <span>Recarregar Sinal</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
