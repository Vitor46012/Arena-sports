'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, VideoOff, History, Calendar, Play, Video } from 'lucide-react';
import VideoPlayerModal, { VideoData } from './VideoPlayerModal';
import SportsReviewLogo from '@/components/common/SportsReviewLogo';
import { formatReplayTitle, formatCourtName, formatDurationMmSs } from '@/components/tenant/TenantReplaysView';

export interface VideoClipItem {
  id: string;
  machineName: string;
  s3Key: string;
  streamUrl: string;
  downloadUrl: string;
  duration: string;
  sizeMb: number;
  arenaId: string;
  courtId?: string | null;
  courtName?: string;
  courtIdentifier?: string | null;
  status: string;
  createdAt: string;
}

export interface ArenaItem {
  id: string;
  name: string;
}

export interface CourtItem {
  id: string;
  name: string;
  identifier: string;
  arenaId: string;
}

interface PlayerPortalProps {
  onBackToDashboard?: () => void;
  initialCourtParam?: string;
  initialArenaId?: string;
}

function getBrasiliaDateString(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export default function PlayerPortal({
  onBackToDashboard,
  initialCourtParam,
  initialArenaId,
}: PlayerPortalProps = {}) {
  const [arenas, setArenas] = useState<ArenaItem[]>([]);
  const [selectedArena, setSelectedArena] = useState<string>(() => {
    if (initialArenaId) return initialArenaId;
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('arenaId') || '';
    }
    return '';
  });
  const [courts, setCourts] = useState<CourtItem[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>(() => {
    if (initialCourtParam) return initialCourtParam;
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('courtId') || 'all';
    }
    return 'all';
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => getBrasiliaDateString());
  const [clips, setClips] = useState<VideoClipItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeVideo, setActiveVideo] = useState<VideoData | null>(null);
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({});

  const handleVideoLoadedMetadata = (clipId: string, durationSec: number) => {
    if (!durationSec || isNaN(durationSec) || !isFinite(durationSec) || durationSec <= 0) return;
    setVideoDurations((prev) => {
      if (prev[clipId] === durationSec) return prev;
      return { ...prev, [clipId]: durationSec };
    });
  };

  // Carrega arenas disponíveis com resiliência
  useEffect(() => {
    let isMounted = true;
    fetch('/api/arenas')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ArenaItem[]) => {
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setArenas(data);
            setSelectedArena((prev) => prev || data[0].id);
          } else {
            const fallbackArena = { id: 'arena-pr-01', name: 'Arena Society Paranaguá' };
            setArenas([fallbackArena]);
            setSelectedArena((prev) => prev || fallbackArena.id);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallbackArena = { id: 'arena-pr-01', name: 'Arena Society Paranaguá' };
          setArenas([fallbackArena]);
          setSelectedArena((prev) => prev || fallbackArena.id);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Carrega as quadras da arena selecionada e ajusta slug inicial se fornecido
  useEffect(() => {
    if (!selectedArena) return;
    let isMounted = true;

    fetch(`/api/courts?arenaId=${selectedArena}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CourtItem[]) => {
        if (isMounted) {
          const courtList = Array.isArray(data) ? data : [];
          setCourts(courtList);
          if (initialCourtParam) {
            const match = courtList.find(
              (c) => c.identifier === initialCourtParam || c.id === initialCourtParam
            );
            if (match) {
              setSelectedCourt(match.id);
            }
          }
        }
      })
      .catch(() => {
        if (isMounted) setCourts([]);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedArena, initialCourtParam]);

  // Carrega os vídeos com base nos filtros (sincronização imediata)
  useEffect(() => {
    let isMounted = true;
    const fetchClips = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedDate) params.append('date', selectedDate);
        if (selectedArena && selectedArena !== 'all') params.append('arenaId', selectedArena);
        if (selectedCourt && selectedCourt !== 'all') params.append('courtId', selectedCourt);

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

    fetchClips();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedArena, selectedCourt]);

  const handleArenaChange = (newArenaId: string) => {
    setSelectedArena(newArenaId);
    setSelectedCourt('all');
  };

  const handleOpenModal = (clip: VideoClipItem) => {
    const formattedTime = new Date(clip.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const arenaName = arenas.find((a) => a.id === clip.arenaId)?.name || 'Arena Society';
    const courtLabel = formatCourtName(clip.courtName || clip.courtIdentifier || clip.courtId);

    const realDurationSec = videoDurations[clip.id];
    let finalDuration = '--:--';
    if (realDurationSec !== undefined && realDurationSec > 0) {
      finalDuration = formatDurationMmSs(realDurationSec);
    } else if (clip.duration && clip.duration !== '30s' && clip.duration !== '00:30') {
      if (/^\d+$/.test(clip.duration.trim())) {
        finalDuration = formatDurationMmSs(parseInt(clip.duration.trim(), 10));
      } else if (/^\d{2}:\d{2}$/.test(clip.duration.trim())) {
        finalDuration = clip.duration.trim();
      }
    }

    setActiveVideo({
      id: clip.id,
      machineName: clip.machineName,
      arena: arenaName,
      arenaId: clip.arenaId,
      timestamp: `${courtLabel} • ${formattedTime}`,
      streamUrl: clip.streamUrl,
      duration: finalDuration,
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
                <Monitor className="w-4 h-4" />
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
              Streaming imediato em 1080p 60fps.
            </p>
          </div>

          {/* Filtros */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-lg">
            {/* Seletor de Quadras (Pills) com no-scrollbar e scroll fluido */}
            {courts.length > 0 && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Quadra
                </label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCourt('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCourt === 'all'
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    Todas as Quadras
                  </button>
                  {courts.map((court) => (
                    <button
                      key={court.id}
                      type="button"
                      onClick={() => setSelectedCourt(court.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCourt === court.id
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {court.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Data dos Jogos
                </label>
                {!selectedDate && (
                  <span className="text-[10px] font-mono text-orange-400">Exibindo todos os lances</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs font-semibold focus:border-orange-500 outline-none [color-scheme:dark] cursor-pointer"
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    title="Remover filtro de data"
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                  >
                    Todos
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Vídeos */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              <span className="text-xs font-mono text-slate-400">Carregando replays...</span>
            </div>
          ) : clips.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-lg">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                <VideoOff className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-sm font-bold text-slate-200">
                  Nenhum lance gravado nesta data
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {selectedDate
                    ? `Não encontramos gravações para o dia ${selectedDate.split('-').reverse().join('/')}.`
                    : 'Não há clipes registrados para esta quadra.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  <History className="w-4 h-4" />
                  Ver últimos lances gravados
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(getBrasiliaDateString())}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <Calendar className="w-4 h-4" />
                  Hoje
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {clips.map((clip) => {
                const formattedCourt = formatCourtName(clip.courtName || clip.courtIdentifier || clip.courtId);
                const realDurationSec = videoDurations[clip.id];
                let displayDuration = '--:--';
                if (realDurationSec !== undefined && realDurationSec > 0) {
                  displayDuration = formatDurationMmSs(realDurationSec);
                } else if (clip.duration && clip.duration !== '30s' && clip.duration !== '00:30') {
                  if (/^\d+$/.test(clip.duration.trim())) {
                    displayDuration = formatDurationMmSs(parseInt(clip.duration.trim(), 10));
                  } else if (/^\d{2}:\d{2}$/.test(clip.duration.trim())) {
                    displayDuration = clip.duration.trim();
                  }
                }

                return (
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
                        onLoadedMetadata={(e) => {
                          handleVideoLoadedMetadata(clip.id, e.currentTarget.duration);
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Real Dynamic Duration Badge */}
                      <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-white flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span>{displayDuration}</span>
                      </div>

                      {/* Dynamic Court Badge */}
                      <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-orange-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        <span>{formattedCourt}</span>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                        {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(clip.createdAt))}
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                        <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 ml-0.5 fill-current" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono text-xs font-bold text-slate-100">{formatReplayTitle(clip.machineName, clip.createdAt)}</h4>
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-[9px] font-bold">
                            {formattedCourt}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono">Disponível em 1080p</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenModal(clip)}
                        className="px-4 py-2.5 min-h-[44px] rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-500/20"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Assistir</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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
