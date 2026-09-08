'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  VideoOff,
  Play,
  Download,
  Share2,
  PlayCircle,
  X,
} from 'lucide-react';

export interface B2BVideoClipItem {
  id: string;
  machineName: string;
  driveFileId?: string | null;
  s3Url?: string | null;
  s3Key?: string | null;
  duration: string;
  sizeMb: number | null;
  status: string;
  resolution?: string;
  triggerType?: string | null;
  createdAt: string;
  arenaId: string;
  arena?: {
    id: string;
    name: string;
  };
}

export default function TenantReplaysView() {
  const [videos, setVideos] = useState<B2BVideoClipItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/videos', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(`Erro na API (${res.status})`);
        }
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setVideos(data);
        }
      } catch (err) {
        console.warn('Falha ao carregar lances B2B:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchVideos();
    return () => {
      isMounted = false;
    };
  }, []);

  const getVideoPlaybackUrl = (v: B2BVideoClipItem) => {
    if (v.driveFileId) {
      return `https://drive.google.com/file/d/${v.driveFileId}/preview`;
    }
    return v.s3Url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  };

  const getDirectDownloadUrl = (v: B2BVideoClipItem) => {
    if (v.driveFileId) {
      return `https://drive.google.com/uc?export=download&id=${v.driveFileId}`;
    }
    return v.s3Url || '#';
  };

  const handleOpenPlayer = (v: B2BVideoClipItem) => {
    const url = getVideoPlaybackUrl(v);
    setSelectedVideoUrl(url);
    setSelectedVideoName(v.machineName);
  };

  const handleDownload = (v: B2BVideoClipItem) => {
    const downloadUrl = getDirectDownloadUrl(v);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `${v.machineName}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Download de ${v.machineName} iniciado!`);
  };

  const handleShareLink = (v: B2BVideoClipItem) => {
    const shareUrl = v.driveFileId
      ? `https://drive.google.com/file/d/${v.driveFileId}/view`
      : `${window.location.origin}/lance/${v.machineName}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    showToast(`Link de ${v.machineName} copiado para a área de transferência!`);
  };

  const handleManualSyncAll = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/videos', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setVideos(data);
        showToast(`Varredura concluída! ${data.length} lances sincronizados.`);
      }
    } catch {
      showToast('Erro ao sincronizar lances com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 bg-slate-900 border-slate-700 text-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-['Sora'] tracking-tight">
            Últimos Replays & Lances Gravados
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Todos os vídeos e melhores momentos gravados no seu complexo esportivo através do botão em quadra.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleManualSyncAll}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-orange-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-16 flex flex-col items-center justify-center gap-3 bg-slate-900 border border-slate-800 rounded-xl">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Carregando vídeos gravados...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && videos.length === 0 && (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <VideoOff className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-300">Nenhum lance gravado ainda</h3>
          <p className="text-xs text-slate-500 mt-1">
            Todos os vídeos de lances gravados aparecerão aqui automaticamente.
          </p>
        </div>
      )}

      {/* 4-Column Grid */}
      {!isLoading && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {videos.map((rep) => {
            const isGoogleDrive = !!rep.driveFileId;
            const formattedDate = rep.createdAt
              ? new Date(rep.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : '19:45:00';

            return (
              <div
                key={rep.id}
                id={`replay-card-${rep.machineName}`}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                {/* Video / Thumbnail Box */}
                <div
                  onClick={() => handleOpenPlayer(rep)}
                  className="relative w-full aspect-video bg-black overflow-hidden cursor-pointer group/thumb"
                >
                  {isGoogleDrive ? (
                    <iframe
                      src={`https://drive.google.com/file/d/${rep.driveFileId}/preview`}
                      className="w-full h-full border-0 pointer-events-none opacity-85 group-hover/thumb:opacity-100 transition-opacity"
                      title={rep.machineName}
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={rep.s3Url || ''}
                      preload="metadata"
                      className="w-full h-full object-cover opacity-85 group-hover/thumb:opacity-100 transition-opacity"
                    />
                  )}

                  {/* Duration Tag */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-white font-mono text-[10px] font-bold z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span>{rep.duration || '00:30'}</span>
                  </div>

                  {/* Time of recording */}
                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px] z-10">
                    {formattedDate}
                  </div>

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity z-20">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg transform group-hover/thumb:scale-110 transition-transform">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-100 tracking-wide truncate max-w-[180px]">
                        {rep.machineName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{rep.triggerType || 'Botão Físico'}</span>
                      <span className="font-mono">{rep.sizeMb ? `${rep.sizeMb} MB` : '12.5 MB'}</span>
                    </div>

                    {/* Storage Cloud Badge */}
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {isGoogleDrive ? 'Google Drive Gravado' : 'Salvo na Nuvem'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      id={`btnDownloadReplay-${rep.id}`}
                      onClick={() => handleDownload(rep)}
                      className="w-full py-2 bg-slate-800 hover:bg-orange-500 hover:text-white border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar</span>
                    </button>

                    <button
                      type="button"
                      id={`btnShareReplay-${rep.id}`}
                      onClick={() => handleShareLink(rep)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Link</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Modal Player */}
      {selectedVideoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedVideoUrl(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden w-full max-w-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-orange-500" />
                <h3 className="font-mono text-sm font-bold text-slate-100">{selectedVideoName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideoUrl(null)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {selectedVideoUrl.includes('drive.google.com') ? (
                <iframe
                  src={selectedVideoUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen"
                  title={selectedVideoName}
                />
              ) : (
                <video
                  src={selectedVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
