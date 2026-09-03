'use client';

import React, { useRef, useState } from 'react';

export interface VideoData {
  id: string;
  machineName: string;
  arena: string;
  arenaId: string;
  timestamp: string;
  streamUrl: string;
  duration: string;
  sizeMb?: number;
  createdAt: string | Date;
}

interface VideoPlayerModalProps {
  isOpen: boolean;
  videoData: VideoData | null;
  onClose: () => void;
}

export default function VideoPlayerModal({ isOpen, videoData, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [, setIsPlaying] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !videoData) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(videoData.streamUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${videoData.machineName}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(videoData.streamUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Lance ${videoData.machineName} - Sports Review`,
        text: `Confira meu lance gravado na ${videoData.arena}!`,
        url: shareUrl,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      alert('Link do lance copiado para a área de transferência!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h3 className="font-mono text-sm font-bold text-slate-100 flex items-center gap-2">
              {videoData.machineName}
              <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-sans font-bold">
                1080p 60FPS
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{videoData.timestamp}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Video Player */}
        <div 
          onClick={togglePlay}
          className="relative aspect-video bg-black flex items-center justify-center cursor-pointer"
        >
          <video
            ref={videoRef}
            src={videoData.streamUrl}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Cloudflare R2 Edge CDN
            {videoData.sizeMb ? ` • ${videoData.sizeMb} MB` : ''}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">share</span>
              Compartilhar
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">
                {isDownloading ? 'sync' : 'download'}
              </span>
              {isDownloading ? 'Baixando...' : 'Baixar Lance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
