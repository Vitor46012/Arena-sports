'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface VideoData {
  id: string;
  machineName?: string;
  arena?: string;
  timestamp?: string;
  videoUrl?: string;
  court?: string;
  duration?: string;
}

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoData: VideoData | null;
}

export default function VideoPlayerModal({
  isOpen,
  onClose,
  videoData,
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [showCenterIcon, setShowCenterIcon] = useState<boolean>(true);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'processing' | 'completed'>('idle');

  const hideIconTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerIconAnimation = useCallback(() => {
    setShowCenterIcon(true);
    if (hideIconTimerRef.current) {
      clearTimeout(hideIconTimerRef.current);
    }
    hideIconTimerRef.current = setTimeout(() => {
      setShowCenterIcon(false);
    }, 1500);
  }, []);

  // Reset states when modal opens/closes or video changes
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setDownloadStatus('idle');
      setShowCenterIcon(true);

      // Auto play attempt on open
      const playTimer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().then(() => {
            setIsPlaying(true);
            triggerIconAnimation();
          }).catch(() => {
            // Autoplay prevented by browser policy
            setIsPlaying(false);
          });
        }
      }, 200);

      return () => clearTimeout(playTimer);
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [isOpen, videoData, triggerIconAnimation]);

  if (!isOpen || !videoData) {
    return null;
  }

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    triggerIconAnimation();
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || 30;
    setCurrentTime(current);
    setDuration(total);
    setProgress((current / total) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 30);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowCenterIcon(true);
    setProgress(100);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickRatio = Math.max(0, Math.min(1, clickX / width));
    const newTime = clickRatio * (videoRef.current.duration || duration);
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(clickRatio * 100);
  };

  const handleDownload = () => {
    if (downloadStatus !== 'idle') return;

    setDownloadStatus('processing');
    setTimeout(() => {
      setDownloadStatus('completed');
      
      // Trigger actual mock download file
      const dummyLink = document.createElement('a');
      dummyLink.href = videoData.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      dummyLink.download = `${videoData.machineName || 'LANCE_GRAVADO'}.mp4`;
      dummyLink.target = '_blank';
      document.body.appendChild(dummyLink);
      dummyLink.click();
      document.body.removeChild(dummyLink);

      setTimeout(() => {
        setDownloadStatus('idle');
      }, 3500);
    }, 2000);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const videoSource =
    videoData.videoUrl ||
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

  const lanceTitle = videoData.machineName || `LANCE_${videoData.id}`;
  const arenaName = videoData.arena || 'Arena Society Paranaguá';
  const timeInfo = videoData.timestamp || 'Hoje às 19:42';

  return (
    <div
      id="videoPlayerModal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black flex flex-col justify-center select-none overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Floating Close Button & Header */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-xs font-bold text-white tracking-wide">
            REPLAY B2C • HD
          </span>
        </div>

        <button
          type="button"
          id="btnFloatingClose"
          onClick={onClose}
          aria-label="Fechar reprodutor"
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>

      {/* Video Viewport Area (Interactive Click for Play/Pause) */}
      <div
        id="videoClickArea"
        onClick={togglePlayPause}
        className="relative w-full flex-1 flex items-center justify-center bg-black cursor-pointer overflow-hidden pb-48"
      >
        <video
          ref={videoRef}
          src={videoSource}
          controls={false}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
          className="w-full max-h-full object-contain pointer-events-none"
        />

        {/* Center Play/Pause Pulsating Icon Overlay (Instagram / TikTok style) */}
        <div
          className={`absolute pointer-events-none transition-all duration-300 transform flex items-center justify-center ${
            showCenterIcon
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-125'
          }`}
        >
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
            <span className="material-symbols-outlined text-5xl icon-fill ml-1">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </div>
        </div>

        {/* Progress Bar & Timestamp (Positioned right above bottom sheet) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-48 inset-x-0 px-4 pb-2 z-20 space-y-1.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-6"
        >
          <div
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            className="w-full h-2.5 bg-slate-800/80 hover:h-3.5 rounded-full cursor-pointer relative overflow-hidden transition-all group"
          >
            {/* Filled Progress */}
            <div
              className="h-full bg-orange-500 rounded-full relative transition-all"
              style={{ width: `${progress}%` }}
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] font-mono text-slate-300 px-0.5">
            <span>{formatSeconds(currentTime)}</span>
            <span className="text-slate-500">/</span>
            <span>{formatSeconds(duration)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Sheet Information & Download Panel */}
      <div
        id="bottomSheetPanel"
        className="absolute bottom-0 inset-x-0 z-30 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] space-y-5 animate-in slide-in-from-bottom duration-300"
      >
        {/* Header: Title and Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-mono text-base md:text-lg font-bold text-slate-100 tracking-tight">
              {lanceTitle}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-orange-500">
                stadium
              </span>
              <span>{arenaName}</span>
              <span>•</span>
              <span className="text-slate-300 font-mono">{timeInfo}</span>
            </p>
          </div>

          <button
            type="button"
            id="btnCloseBottomSheet"
            onClick={onClose}
            aria-label="Fechar painel"
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Badges and Details Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Qualidade 4K Original
            </span>

            <span className="px-2.5 py-1 rounded-full text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800">
              60 FPS
            </span>
          </div>

          <span className="text-xs font-mono font-semibold text-slate-400">
            MP4 • H.264
          </span>
        </div>

        {/* Primary Download Action Button */}
        <div className="pt-1">
          <button
            type="button"
            id="btnDownloadClipModal"
            disabled={downloadStatus === 'processing'}
            onClick={handleDownload}
            className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-xl ${
              downloadStatus === 'processing'
                ? 'bg-slate-800 text-orange-400 border border-orange-500/30 cursor-wait'
                : downloadStatus === 'completed'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white shadow-orange-500/25'
            }`}
          >
            {downloadStatus === 'processing' && (
              <>
                <span className="material-symbols-outlined text-xl animate-spin">
                  sync
                </span>
                <span>Processando no S3...</span>
              </>
            )}

            {downloadStatus === 'completed' && (
              <>
                <span className="material-symbols-outlined text-xl">
                  check_circle
                </span>
                <span>Download Concluído!</span>
              </>
            )}

            {downloadStatus === 'idle' && (
              <>
                <span className="material-symbols-outlined text-xl">
                  cloud_download
                </span>
                <span>Baixar Vídeo (MP4)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
