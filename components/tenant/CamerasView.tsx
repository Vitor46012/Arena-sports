'use client';

import React, { useState } from 'react';

interface RTSPCameraFeed {
  id: string;
  court: string;
  name: string;
  rtspUrl: string;
  resolution: string;
  fps: number;
  bitrateKbps: number;
  status: 'ONLINE' | 'RECONECTANDO';
  posterUrl: string;
}

const INITIAL_CAMERAS: RTSPCameraFeed[] = [
  {
    id: 'cam-q1-main',
    court: 'Quadra 1 (Society Principal)',
    name: 'Câmera Ângulo Central (Gol a Gol)',
    rtspUrl: 'rtsp://192.168.15.51:554/stream1',
    resolution: '1920x1080',
    fps: 60,
    bitrateKbps: 4200,
    status: 'ONLINE',
    posterUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'cam-q1-sec',
    court: 'Quadra 1 (Society Principal)',
    name: 'Câmera Lateral Direita / Linha de Fundo',
    rtspUrl: 'rtsp://192.168.15.52:554/stream1',
    resolution: '1920x1080',
    fps: 60,
    bitrateKbps: 3950,
    status: 'ONLINE',
    posterUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'cam-q2-main',
    court: 'Quadra 2 (Futebol 7 Sintética)',
    name: 'Câmera Panorâmica (Central)',
    rtspUrl: 'rtsp://192.168.15.53:554/stream1',
    resolution: '1920x1080',
    fps: 60,
    bitrateKbps: 4100,
    status: 'ONLINE',
    posterUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'cam-q3-beach',
    court: 'Quadra 3 (Beach Tennis)',
    name: 'Câmera Linha de Rede (Beach)',
    rtspUrl: 'rtsp://192.168.15.54:554/stream1',
    resolution: '1920x1080',
    fps: 60,
    bitrateKbps: 4050,
    status: 'ONLINE',
    posterUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=900&auto=format&fit=crop',
  },
];

export default function CamerasView() {
  const [cameras, setCameras] = useState<RTSPCameraFeed[]>(INITIAL_CAMERAS);
  const [reloadingCamId, setReloadingCamId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
      showToast(`Stream RTSP de "${camName}" reconectado com sucesso!`);
    }, 1200);
  };

  const handleManualTrigger = (cam: RTSPCameraFeed) => {
    showToast(`Corte manual de 30s gravado para ${cam.court}!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 bg-slate-900 border-slate-700 text-slate-100">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            videocam
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-['Sora'] tracking-tight">
            Monitoramento de Câmeras ao Vivo (RTSP)
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Visualização em baixa latência das câmeras instaladas nas quadras via protocolo RTSP local.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300">Edge Gateway RTSP: 4/4 Ativos</span>
          </div>
        </div>
      </div>

      {/* 2-Column Video Feeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cameras.map((cam) => {
          const isReloading = reloadingCamId === cam.id;
          return (
            <div
              key={cam.id}
              id={`cam-container-${cam.id}`}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between"
            >
              {/* RTSP Player Container (Aspect Video bg-black) */}
              <div className="relative w-full aspect-video bg-black overflow-hidden group">
                {/* Simulated Camera Video Stream / Poster */}
                <div
                  className={`w-full h-full bg-cover bg-center transition-all duration-300 ${
                    isReloading ? 'filter blur-sm opacity-40' : 'opacity-90 group-hover:opacity-100'
                  }`}
                  style={{ backgroundImage: `url(${cam.posterUrl})` }}
                />

                {/* Pulsating Red Live Badge Top Left */}
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/75 backdrop-blur-sm border border-slate-700 px-2.5 py-1 rounded text-white text-[11px] font-mono font-bold tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-red-400">AO VIVO</span>
                  <span className="text-slate-500 font-normal">|</span>
                  <span className="text-slate-300">{cam.fps} FPS</span>
                </div>

                {/* Top Right Resolution & Bitrate */}
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/75 backdrop-blur-sm border border-slate-700 px-2.5 py-1 rounded text-slate-300 text-[10px] font-mono">
                  <span>{cam.resolution}</span>
                  <span className="text-slate-600">•</span>
                  <span>{cam.bitrateKbps} kbps</span>
                </div>

                {/* Reloading Spinner Overlay */}
                {isReloading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white space-y-2">
                    <span className="material-symbols-outlined text-3xl text-orange-500 animate-spin">
                      progress_activity
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-300">
                      Reestabelecendo handshake RTSP...
                    </p>
                  </div>
                )}

                {/* Bottom Bar Info Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-6 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 font-mono block">
                      {cam.court}
                    </span>
                    <h3 className="text-xs font-bold text-white tracking-tight">
                      {cam.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-slate-800">
                    {cam.rtspUrl}
                  </span>
                </div>
              </div>

              {/* Bottom Actions Toolbar */}
              <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs text-slate-400 font-medium">
                    Codec: <strong className="text-slate-300 font-mono">H.264 Main Profile</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleManualTrigger(cam)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-orange-400">
                      video_camera_front
                    </span>
                    <span>Gravar Corte</span>
                  </button>

                  <button
                    type="button"
                    id={`btnReload-${cam.id}`}
                    disabled={isReloading}
                    onClick={() => handleReloadStream(cam.id, cam.name)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 hover:text-orange-400 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        isReloading ? 'animate-spin text-orange-500' : ''
                      }`}
                    >
                      refresh
                    </span>
                    <span>Recarregar Sinal</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
