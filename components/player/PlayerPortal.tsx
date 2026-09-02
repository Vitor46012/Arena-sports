'use client';

import React, { useState, useEffect, useCallback } from 'react';
import VideoPlayerModal, { VideoData } from './VideoPlayerModal';
import SportsReviewLogo from '@/components/common/SportsReviewLogo';

export interface ArenaItem {
  id: string;
  name: string;
}

export interface VideoClipItem {
  id: string;
  machineName: string;
  driveFileId: string | null;
  s3Key?: string | null;
  s3Url?: string | null;
  duration: string;
  sizeMb?: number;
  arenaId: string;
  status: string;
  streamUrl: string | null;
  previewUrl: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

interface PlayerPortalProps {
  onBackToDashboard?: () => void;
}

export default function PlayerPortal({ onBackToDashboard }: PlayerPortalProps) {
  const [arenas, setArenas] = useState<ArenaItem[]>([]);
  const [selectedArena, setSelectedArena] = useState<string>('arena-pr-01');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [videos, setVideos] = useState<VideoClipItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    icon: string;
    type: 'download' | 'share' | 'search';
  } | null>(null);

  const showToast = (
    text: string,
    icon: string,
    type: 'download' | 'share' | 'search' = 'download'
  ) => {
    setToast({ text, icon, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Carregamento dinâmico das arenas cadastradas via API
  useEffect(() => {
    let isMounted = true;
    const fetchArenas = async () => {
      try {
        const res = await fetch('/api/arenas', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(`Erro ao buscar arenas (${res.status})`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Resposta de arenas não é JSON válido');
        }
        const data: ArenaItem[] = await res.json();
        if (isMounted && Array.isArray(data)) {
          setArenas(data);
          if (data.length > 0) {
            setSelectedArena((prev) => {
              const exists = data.some((a) => a.id === prev);
              return exists && prev ? prev : data[0].id;
            });
          }
        }
      } catch (err) {
        console.error('Falha ao buscar arenas:', err);
      }
    };

    fetchArenas();
    return () => {
      isMounted = false;
    };
  }, []);

  // Função para buscar vídeos na API
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedArena) params.append('arenaId', selectedArena);
      if (selectedDate) params.append('date', selectedDate);

      const res = await fetch(`/api/videos?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`Erro na API (${res.status})`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta de vídeos não é JSON');
      }
      const data: VideoClipItem[] = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Falha ao carregar lances:', err);
      showToast('Falha ao conectar com o servidor de vídeos.', 'error', 'search');
    } finally {
      setIsLoading(false);
    }
  }, [selectedArena, selectedDate]);

  // Consumo da API no carregamento inicial e quando filtros mudarem
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedArena) params.append('arenaId', selectedArena);
        if (selectedDate) params.append('date', selectedDate);

        const res = await fetch(`/api/videos?${params.toString()}`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(`Erro na API (${res.status})`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Resposta de vídeos não é JSON');
        }
        const data: VideoClipItem[] = await res.json();
        if (isMounted) setVideos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Falha ao carregar lances:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedArena, selectedDate]);

  const handleOpenVideo = (clip: VideoClipItem) => {
    const formattedTime = formatTime(clip.createdAt);
    const arenaName =
      arenas.find((a) => a.id === clip.arenaId)?.name ||
      (clip.arenaId === 'arena-pr-01' ? 'Arena Society Paranaguá (PR)' : clip.arenaId);

    setSelectedVideo({
      id: clip.id,
      machineName: clip.machineName,
      arena: arenaName,
      arenaId: clip.arenaId,
      timestamp: `Quadra 1 • ${formattedTime}`,
      videoUrl: clip.streamUrl || clip.s3Url || undefined,
      streamUrl: clip.streamUrl,
      s3Url: clip.s3Url,
      previewUrl: clip.previewUrl,
      court: 'Quadra 1',
      duration: clip.duration || '00:30',
      sizeMb: clip.sizeMb,
      driveFileId: clip.driveFileId,
      createdAt: clip.createdAt,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Buscando lances sincronizados no Drive...', 'cloud_sync', 'search');
    fetchVideos();
  };

  const handleShare = (clip: VideoClipItem) => {
    const shareUrl = `https://sportsreview.app/lance/${clip.machineName}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    showToast('Link do lance copiado para a área de transferência!', 'share', 'share');
  };

  const formatTime = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '19:42';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '19:42';
    }
  };

  const formatTimeAgo = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'recentemente';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'hoje';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-orange-500 selection:text-white font-sans antialiased">
      {/* Mobile-First Container */}
      <div className="w-full max-w-md min-h-screen bg-slate-950 border-x border-slate-900 flex flex-col relative shadow-2xl">
        {/* Header with Brand Logo */}
        <header
          id="playerHeader"
          className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <SportsReviewLogo variant="compact" size="xs" />
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
              PORTAL B2C
            </span>
            {onBackToDashboard && (
              <button
                type="button"
                id="btnBackToAdmin"
                onClick={onBackToDashboard}
                title="Voltar para a Mesa de Operação / NOC"
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-orange-500 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 px-4 py-5 space-y-6 pb-12">
          {/* Hero Headline */}
          <section className="text-center space-y-1.5 pt-1">
            <h1 className="text-2xl font-bold font-['Sora'] text-slate-100 tracking-tight">
              Baixe e compartilhe seus lances
            </h1>
            <p className="text-xs text-slate-400">
              Vídeos em alta definição (1080p 60fps) gravados automaticamente via botão da quadra.
            </p>
          </section>

          {/* Search Filter Box */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-xl">
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              {/* Arena Select */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Selecione a Arena
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    stadium
                  </span>
                  <select
                    id="selectArena"
                    value={selectedArena}
                    onChange={(e) => setSelectedArena(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg pl-9 pr-8 py-2.5 text-xs font-semibold appearance-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                  >
                    {arenas.length > 0 ? (
                      arenas.map((arena) => (
                        <option key={arena.id} value={arena.id}>
                          {arena.name}
                        </option>
                      ))
                    ) : (
                      <option value="arena-pr-01">Carregando arenas...</option>
                    )}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Data do Jogo
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                      calendar_month
                    </span>
                    <input
                      id="inputDate"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg pl-8 pr-2 py-2 text-xs font-semibold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Horário da Partida
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                      schedule
                    </span>
                    <input
                      id="inputTime"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg pl-8 pr-2 py-2 text-xs font-semibold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btnSearchHighlights"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-70 text-white font-bold text-xs py-3.5 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 mt-1"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isLoading ? 'sync' : 'search'}
                </span>
                <span>{isLoading ? 'Buscando Lances...' : 'Buscar Lances'}</span>
              </button>
            </form>
          </section>

          {/* Results Count Banner */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="font-['Sora'] text-base font-bold text-slate-100">
              Lances Encontrados
            </h2>
            <span className="text-[11px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
              {isLoading ? 'Carregando...' : `${videos.length} cortes`}
            </span>
          </div>

          {/* Loading UI State: Orange Spinner + Skeletons */}
          {isLoading && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-xs font-mono text-slate-400 animate-pulse">
                  Consultando lances gravados no Google Drive...
                </p>
              </div>

              {[1, 2].map((idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="w-full aspect-video bg-slate-800/60" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                    <div className="h-10 bg-slate-800 rounded-lg w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && videos.length === 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">videocam_off</span>
              </div>
              <h3 className="font-semibold text-sm text-slate-200">
                Nenhum lance encontrado
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Não encontramos vídeos para os filtros selecionados. Pressione o botão físico na quadra para gerar um novo corte.
              </p>
            </div>
          )}

          {/* Dynamic Highlights Feed */}
          {!isLoading && videos.length > 0 && (
            <div className="space-y-5">
              {videos.map((clip) => {
                const timeString = formatTime(clip.createdAt);
                const timeAgoString = formatTimeAgo(clip.createdAt);
                const currentArenaName =
                  arenas.find((a) => a.id === clip.arenaId)?.name ||
                  'Arena Society Paranaguá';

                return (
                  <article
                    key={clip.id}
                    id={`card-${clip.machineName}`}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl transition-all hover:border-slate-700 group"
                  >
                    {/* Video Preview Aspect Box */}
                    <div
                      onClick={() => handleOpenVideo(clip)}
                      className="relative w-full aspect-video bg-slate-950 overflow-hidden cursor-pointer"
                    >
                      {/* Zero Mocks Thumbnail: Usa previewUrl real ou degráde neutro elegante com ícone de vídeo */}
                      {clip.previewUrl ? (
                        <div
                          className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                          style={{ backgroundImage: `url(${clip.previewUrl})` }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-slate-600 group-hover:text-slate-500 transition-colors">
                            videocam
                          </span>
                        </div>
                      )}

                      {/* Top Right Duration Pill */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span>{clip.duration || '00:30'}</span>
                      </div>

                      {/* Bottom Left Court Label */}
                      <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded">
                        Quadra 1 • {timeString}
                      </div>

                      {/* Play Overlay Button */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-orange-500/90 group-hover:bg-orange-500 text-white flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                          <span className="material-symbols-outlined text-3xl icon-fill ml-0.5">
                            play_arrow
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content & Action Buttons */}
                    <div className="p-4 space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3
                            onClick={() => handleOpenVideo(clip)}
                            className="font-mono text-xs font-bold text-slate-100 tracking-wide hover:text-orange-400 cursor-pointer"
                          >
                            {clip.machineName}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {currentArenaName} • Câmera Principal (HD)
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {timeAgoString}
                        </span>
                      </div>

                      {/* Action Buttons: Free Download & Share */}
                      <div className="flex flex-col gap-2 pt-1">
                        {/* Primary Button */}
                        <button
                          type="button"
                          id={`btnDownload-${clip.machineName}`}
                          onClick={() => handleOpenVideo(clip)}
                          className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all uppercase tracking-wide"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            play_circle
                          </span>
                          <span>Assistir & Baixar</span>
                        </button>

                        {/* Secondary Button */}
                        <button
                          type="button"
                          id={`btnShare-${clip.machineName}`}
                          onClick={() => handleShare(clip)}
                          className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            share
                          </span>
                          <span>Compartilhar Link</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* Video Player Modal Component */}
        <VideoPlayerModal
          isOpen={Boolean(selectedVideo)}
          videoData={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />

        {/* Global Toast Notification */}
        {toast && (
          <div
            id="playerToast"
            role="alert"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 w-[90%] max-w-sm animate-in slide-in-from-bottom-4 duration-300"
          >
            <span
              className={`material-symbols-outlined text-xl ${
                toast.type === 'download'
                  ? 'text-emerald-400'
                  : toast.type === 'share'
                  ? 'text-orange-400'
                  : 'text-slate-300'
              }`}
            >
              {toast.icon}
            </span>
            <p className="text-xs font-semibold leading-snug">{toast.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
