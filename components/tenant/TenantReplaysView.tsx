'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  VideoOff,
  Video,
  Play,
  Download,
  Share2,
  PlayCircle,
  X,
} from 'lucide-react';

export interface B2BVideoClipItem {
  id: string;
  machineName: string;
  thumbnailUrl?: string | null;
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
  courtId?: string | null;
  courtName?: string | null;
  courtIdentifier?: string | null;
  court?: {
    id: string;
    name: string;
    identifier: string;
  } | string | null;
  arena?: {
    id: string;
    name: string;
  };
}

/**
 * Converte segundos em formato mm:ss (ex: 22 -> 00:22, 26 -> 00:26, 65 -> 01:05)
 */
export function formatDurationMmSs(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0 || !isFinite(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formata identificador de quadra para exibição amigável na interface.
 * Exemplo: se receber "quadra-1", exibe "Quadra 1". Se receber "quadra-3", exibe "Quadra 3".
 */
export function formatCourtName(
  courtInput?: string | { name?: string; identifier?: string } | null
): string {
  if (!courtInput) return 'Quadra 1';

  const raw = typeof courtInput === 'object'
    ? (courtInput.identifier || courtInput.name || '')
    : courtInput;

  if (!raw || typeof raw !== 'string') return 'Quadra 1';

  const trimmed = raw.trim();

  // Exemplo: "quadra-1" -> "Quadra 1", "quadra-3" -> "Quadra 3"
  const match = trimmed.match(/quadra[-_\s]*(\d+)/i);
  if (match) {
    return `Quadra ${match[1]}`;
  }

  // Se vier apenas dígitos numéricos como "1", "2", "3"
  if (/^\d+$/.test(trimmed)) {
    return `Quadra ${trimmed}`;
  }

  return trimmed;
}

/**
 * Converte timestamp Unix (presente no nome do arquivo ou createdAt) em formato legível de data
 * Exemplo: 16 Set - 10:24h
 */
export function formatReplayTitle(machineName?: string, createdAt?: string): string {
  if (!machineName && !createdAt) return 'Replay Gravado';

  let date: Date | null = null;

  if (machineName) {
    const match = machineName.match(/\d{10,13}/);
    if (match) {
      const rawNum = parseInt(match[0], 10);
      const timestampMs = match[0].length === 10 ? rawNum * 1000 : rawNum;
      const candidate = new Date(timestampMs);
      if (!isNaN(candidate.getTime())) {
        date = candidate;
      }
    }
  }

  if (!date && createdAt) {
    const candidate = new Date(createdAt);
    if (!isNaN(candidate.getTime())) {
      date = candidate;
    }
  }

  if (!date) return 'Replay Gravado';

  try {
    const day = date.getDate();
    const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
    let month = monthFormatter.format(date).replace('.', '');
    month = month.charAt(0).toUpperCase() + month.slice(1);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} - ${hours}:${minutes}h`;
  } catch {
    return 'Replay Gravado';
  }
}

export default function TenantReplaysView() {
  const [videos, setVideos] = useState<B2BVideoClipItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState<string>('');
  const [selectedVideoCourt, setSelectedVideoCourt] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({});

  const handleLoadedMetadata = (videoId: string, durationSec: number) => {
    if (!durationSec || isNaN(durationSec) || !isFinite(durationSec) || durationSec <= 0) return;
    setVideoDurations((prev) => {
      if (prev[videoId] === durationSec) return prev;
      return { ...prev, [videoId]: durationSec };
    });
  };

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
    const displayTitle = formatReplayTitle(v.machineName, v.createdAt);
    const courtRaw = v.court || v.courtIdentifier || v.courtName || v.courtId;
    setSelectedVideoUrl(url);
    setSelectedVideoName(displayTitle);
    setSelectedVideoCourt(formatCourtName(courtRaw));
  };

  const handleDownload = (v: B2BVideoClipItem) => {
    const downloadUrl = getDirectDownloadUrl(v);
    const displayTitle = formatReplayTitle(v.machineName, v.createdAt);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `${v.machineName || 'replay'}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Download de "${displayTitle}" iniciado!`);
  };

  const handleShareLink = (v: B2BVideoClipItem) => {
    const displayTitle = formatReplayTitle(v.machineName, v.createdAt);
    const shareUrl = v.driveFileId
      ? `https://drive.google.com/file/d/${v.driveFileId}/view`
      : `${window.location.origin}/lance/${v.machineName}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    showToast(`Link de "${displayTitle}" copiado para a área de transferência!`);
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
            const displayTitle = formatReplayTitle(rep.machineName, rep.createdAt);
            const formattedDate = rep.createdAt
              ? new Date(rep.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : '19:45:00';

            const courtRaw = rep.court || rep.courtIdentifier || rep.courtName || rep.courtId;
            const formattedCourt = formatCourtName(courtRaw);

            // Obtém a duração real em segundos do estado local (extraída via onLoadedMetadata)
            const realDurationSec = videoDurations[rep.id];
            let displayDuration = '--:--';
            if (realDurationSec !== undefined && realDurationSec > 0) {
              displayDuration = formatDurationMmSs(realDurationSec);
            } else if (rep.duration && rep.duration !== '30s' && rep.duration !== '00:30') {
              if (/^\d+$/.test(rep.duration.trim())) {
                displayDuration = formatDurationMmSs(parseInt(rep.duration.trim(), 10));
              } else if (/^\d{2}:\d{2}$/.test(rep.duration.trim())) {
                displayDuration = rep.duration.trim();
              }
            }

            return (
              <div
                key={rep.id}
                id={`replay-card-${rep.id}`}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                {/* Video / Thumbnail Box */}
                <div
                  onClick={() => handleOpenPlayer(rep)}
                  className="relative w-full aspect-video bg-slate-800 overflow-hidden cursor-pointer group/thumb flex items-center justify-center"
                >
                  {isGoogleDrive ? (
                    <iframe
                      src={`https://drive.google.com/file/d/${rep.driveFileId}/preview`}
                      className="w-full h-full border-0 pointer-events-none opacity-85 group-hover/thumb:opacity-100 transition-opacity"
                      title={displayTitle}
                      loading="lazy"
                    />
                  ) : rep.s3Url ? (
                    <video
                      src={`${rep.s3Url}#t=0.5`}
                      poster={rep.thumbnailUrl || undefined}
                      preload="metadata"
                      muted
                      playsInline
                      onLoadedMetadata={(e) => {
                        handleLoadedMetadata(rep.id, e.currentTarget.duration);
                      }}
                      className="w-full h-full object-cover opacity-85 group-hover/thumb:opacity-100 transition-opacity"
                    />
                  ) : rep.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rep.thumbnailUrl}
                      alt={displayTitle}
                      className="w-full h-full object-cover opacity-85 group-hover/thumb:opacity-100 transition-opacity"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Video className="w-8 h-8 text-slate-500" />
                    </div>
                  )}

                  {/* Real Dynamic Duration Tag */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-white font-mono text-[10px] font-bold z-10 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span>{displayDuration}</span>
                  </div>

                  {/* Dynamic Court Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-orange-400 font-mono text-[10px] font-bold z-10 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    <span>{formattedCourt}</span>
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-100 tracking-wide truncate" title={displayTitle}>
                        {displayTitle}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[10px] font-bold shrink-0">
                        {formattedCourt}
                      </span>
                    </div>

                    <div className="flex items-center text-[11px] text-slate-400">
                      <span>{rep.triggerType || 'Botão Físico'}</span>
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
                {selectedVideoCourt && (
                  <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[10px] font-bold">
                    {selectedVideoCourt}
                  </span>
                )}
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
