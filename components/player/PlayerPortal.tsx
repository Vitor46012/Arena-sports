'use client';

import React, { useState } from 'react';
import VideoPlayerModal, { VideoData } from './VideoPlayerModal';

export interface VideoHighlight {
  id: string;
  machineName: string;
  court: string;
  camera: string;
  duration: string;
  timeAgo: string;
  timestamp: string;
  thumbnailUrl: string;
  arenaName: string;
}

const SAMPLE_HIGHLIGHTS: VideoHighlight[] = [
  {
    id: 'lance-1',
    machineName: 'LANCE_20260831_1945',
    court: 'Quadra 2',
    camera: 'Câmera Central (1080p60)',
    duration: '00:30',
    timeAgo: '2min atrás',
    timestamp: '19:45:12',
    arenaName: 'Arena Society Paranaguá',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'lance-2',
    machineName: 'LANCE_20260831_1932',
    court: 'Quadra 2',
    camera: 'Câmera Defesa',
    duration: '00:45',
    timeAgo: '15min atrás',
    timestamp: '19:32:40',
    arenaName: 'Arena Society Paranaguá',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'lance-3',
    machineName: 'LANCE_20260831_1910',
    court: 'Quadra 1',
    camera: 'Câmera Lateral Direita',
    duration: '00:30',
    timeAgo: '37min atrás',
    timestamp: '19:10:05',
    arenaName: 'Arena Society Paranaguá',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'lance-4',
    machineName: 'LANCE_20260831_1854',
    court: 'Quadra 1',
    camera: 'Câmera Gol Norte',
    duration: '00:30',
    timeAgo: '53min atrás',
    timestamp: '18:54:22',
    arenaName: 'Arena Society Paranaguá',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=900&auto=format&fit=crop',
  },
];

interface PlayerPortalProps {
  onBackToDashboard?: () => void;
}

export default function PlayerPortal({ onBackToDashboard }: PlayerPortalProps) {
  const [selectedArena, setSelectedArena] = useState('arena-pr');
  const [selectedDate, setSelectedDate] = useState('2026-08-31');
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [isSearching, setIsSearching] = useState(false);
  const [highlights, setHighlights] = useState<VideoHighlight[]>(SAMPLE_HIGHLIGHTS);
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

  const handleOpenVideo = (video: VideoHighlight) => {
    setSelectedVideo({
      id: video.id,
      machineName: video.machineName,
      arena: video.arenaName,
      timestamp: `${video.court} • ${video.timestamp}`,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      court: video.court,
      duration: video.duration,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    showToast('Buscando lances sincronizados no S3...', 'cloud_sync', 'search');

    setTimeout(() => {
      setIsSearching(false);
      setHighlights(SAMPLE_HIGHLIGHTS);
      showToast(`${SAMPLE_HIGHLIGHTS.length} lances encontrados!`, 'check_circle', 'search');
    }, 600);
  };

  const handleDownload = (video: VideoHighlight) => {
    showToast(
      `Iniciando download gratuito de ${video.machineName}.mp4...`,
      'cloud_download',
      'download'
    );
  };

  const handleShare = (video: VideoHighlight) => {
    const shareUrl = `https://sportsreview.app/lance/${video.machineName}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    showToast('Link do lance copiado para a área de transferência!', 'share', 'share');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-orange-500 selection:text-white font-sans antialiased">
      {/* Mobile-First Container (max-w-md strictly, no bottom navigation) */}
      <div className="w-full max-w-md min-h-screen bg-slate-950 border-x border-slate-900 flex flex-col relative shadow-2xl">
        {/* Header with Orange Brand Logo */}
        <header
          id="playerHeader"
          className="sticky top-0 z-40 flex items-center justify-between px-4 py-3.5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
              <span className="material-symbols-outlined text-2xl icon-fill">
                sports_soccer
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-['Sora'] text-base font-bold text-orange-500 tracking-tight">
                SPORTS
              </span>
              <span className="text-[10px] font-bold text-white tracking-[0.25em] -mt-1">
                REVIEW
              </span>
            </div>
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
            <form onSubmit={handleSearch} className="space-y-3">
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
                    <option value="arena-pr">Arena Society Paranaguá (PR)</option>
                    <option value="clube-sp">Clube Pinheiros (SP)</option>
                    <option value="bh-mg">Complexo Esportivo BH (MG)</option>
                    <option value="gavea-rj">Quadras Gávea (RJ)</option>
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
                disabled={isSearching}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-70 text-white font-bold text-xs py-3.5 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 mt-1"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSearching ? 'sync' : 'search'}
                </span>
                <span>{isSearching ? 'Buscando Lances...' : 'Buscar Lances'}</span>
              </button>
            </form>
          </section>

          {/* Results Count Banner */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="font-['Sora'] text-base font-bold text-slate-100">
              Lances Encontrados
            </h2>
            <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full">
              {highlights.length} cortes
            </span>
          </div>

          {/* Highlights Feed */}
          <div className="space-y-5">
            {highlights.map((video) => (
              <article
                key={video.id}
                id={`card-${video.machineName}`}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl transition-all hover:border-slate-700 group"
              >
                {/* Video Preview Aspect Box */}
                <div
                  onClick={() => handleOpenVideo(video)}
                  className="relative w-full aspect-video bg-slate-950 overflow-hidden cursor-pointer"
                >
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
                  />

                  {/* Top Right Duration Pill */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span>{video.duration}</span>
                  </div>

                  {/* Bottom Left Court Label */}
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded">
                    {video.court} • {video.timestamp}
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
                        onClick={() => handleOpenVideo(video)}
                        className="font-mono text-xs font-bold text-slate-100 tracking-wide hover:text-orange-400 cursor-pointer"
                      >
                        {video.machineName}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {video.arenaName} • {video.camera}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {video.timeAgo}
                    </span>
                  </div>

                  {/* Action Buttons: Free Download & Share */}
                  <div className="flex flex-col gap-2 pt-1">
                    {/* Primary Button */}
                    <button
                      type="button"
                      id={`btnDownload-${video.machineName}`}
                      onClick={() => handleOpenVideo(video)}
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
                      id={`btnShare-${video.machineName}`}
                      onClick={() => handleShare(video)}
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
            ))}
          </div>
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
