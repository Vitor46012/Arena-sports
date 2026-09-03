'use client';

import React, { useState, useEffect } from 'react';
import VideoPlayerModal, { VideoData } from './VideoPlayerModal';
import SportsReviewLogo from '@/components/common/SportsReviewLogo';

export interface VideoClipItem {
  id: string;
  machineName: string;
  s3Key: string;
  streamUrl: string;
  downloadUrl: string;
  duration: string;
  sizeMb: number;
  arenaId: string;
  status: string;
  createdAt: string;
}

export interface ArenaItem {
  id: string;
  name: string;
}

interface PlayerPortalProps {
  onBackToDashboard?: () => void;
}

export default function PlayerPortal({ onBackToDashboard }: PlayerPortalProps = {}) {
  const [arenas, setArenas] = useState<ArenaItem[]>([]);
  const [selectedArena, setSelectedArena] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toLocaleDateString('sv-SE'));
  const [clips, setClips] = useState<VideoClipItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeVideo, setActiveVideo] = useState<VideoData | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/arenas')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ArenaItem[]) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setArenas(data);
          setSelectedArena(data[0].id);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchClips = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedDate) params.append('date', selectedDate);
        if (selectedArena && selectedArena !== 'all') params.append('arenaId', selectedArena);

        const res = await fetch(`/api/videos?${params.toString()}`, { cache: 'no-store' });
        if (res.ok) {
          const data: VideoClipItem[] = await res.json();
          if (isMounted) {
            setClips(Array.isArray(data) ? data : []);
          }
        } else if (isMounted) {
          setClips([]);
        }
      } catch {
        if (isMounted) setClips([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (selectedDate) {
      fetchClips();
    }

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedArena]);

  const handleOpenModal = (clip: VideoClipItem) => {
    const formattedTime = new Date(clip.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const arenaName = arenas.find((a) => a.id === clip.arenaId)?.name || 'Arena Society';

    setActiveVideo({
      id: clip.id,
      machineName: clip.machineName,
      arena: arenaName,
      arenaId: clip.arenaId,
      timestamp: `Quadra Principal • ${formattedTime}`,
      streamUrl: clip.streamUrl,
      duration: clip.duration,
      sizeMb: clip.sizeMb,
      createdAt: clip.createdAt,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-orange-500 font-sans antialiased">
      <div className="w-full max-w-md min-h-screen bg-slate-950 border-x border-slate-900 flex flex-col shadow-2xl">
        
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
          <SportsReviewLogo variant="compact" size="xs" />
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
              REDE AO VIVO
            </span>
            {onBackToDashboard && (
              <button
                type="button"
                id="btnBackToAdmin"
                onClick={onBackToDashboard}
                title="Voltar para a Mesa de Operação / NOC"
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-5 space-y-6 pb-12">
          
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold font-['Sora'] text-slate-100">
              Lances da Partida
            </h1>
            <p className="text-xs text-slate-400">
              Streaming imediato em 1080p 60fps via Cloudflare Edge.
            </p>
          </div>

          {/* Filtros */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-lg">
            {arenas.length > 1 && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Arena
                </label>
                <select
                  value={selectedArena}
                  onChange={(e) => setSelectedArena(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs font-semibold focus:border-orange-500 outline-none"
                >
                  {arenas.map((arena) => (
                    <option key={arena.id} value={arena.id}>
                      {arena.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Data dos Jogos
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs font-semibold focus:border-orange-500 outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Lista de Vídeos */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              <span className="text-xs font-mono text-slate-400">Carregando replays...</span>
            </div>
          ) : clips.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-8 text-center space-y-2">
              <span className="material-symbols-outlined text-3xl text-slate-500">videocam_off</span>
              <p className="text-xs font-medium text-slate-400">
                Nenhum lance gravado nesta data. Pressione a botoeira para capturar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md group hover:border-slate-700 transition-all"
                >
                  <div
                    onClick={() => handleOpenModal(clip)}
                    className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                  >
                    <video
                      src={`${clip.streamUrl}#t=0.5`}
                      preload="metadata"
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                      {clip.duration}
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                      {new Date(clip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                      <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">play_arrow</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-mono text-xs font-bold text-slate-100">{clip.machineName}</h4>
                      <span className="text-[10px] text-emerald-400 font-mono">Disponível em 1080p</span>
                    </div>

                    <button
                      onClick={() => handleOpenModal(clip)}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      Assistir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <VideoPlayerModal
          isOpen={Boolean(activeVideo)}
          videoData={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      </div>
    </div>
  );
}
