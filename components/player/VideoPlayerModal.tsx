'use client';

import React, { useRef, useState } from 'react';
import { X, Share2, Download, RefreshCw, Check, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useDeviceLayout } from '@/contexts/DeviceLayoutContext';
import { RESOLUTION_PRESETS, ResolutionKey } from '@/lib/deviceDetection';
import { formatReplayTitle } from '@/components/tenant/TenantReplaysView';

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
  const [copied, setCopied] = useState(false);
  const [showResMenu, setShowResMenu] = useState(false);

  const {
    deviceSpecs,
    targetResolution,
    resolutionPreference,
    setResolutionPreference,
  } = useDeviceLayout();

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
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      navigator.share({
        title: `Lance ${videoData.machineName} - Sports Review`,
        text: `Confira meu lance gravado na ${videoData.arena}!`,
        url: shareUrl,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold text-slate-100">
                {formatReplayTitle(videoData.machineName, videoData.createdAt)}
              </h3>

              {/* Dynamic Resolution Badge with Quick Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowResMenu(!showResMenu)}
                  title="Resolução ajustada ao dispositivo. Clique para alterar."
                  className="px-2 py-0.5 rounded bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  <span>{resolutionPreference === 'auto' ? `Auto: ${targetResolution.shortTag}` : targetResolution.shortTag}</span>
                  <SlidersHorizontal className="w-2.5 h-2.5 text-orange-400/70 ml-0.5" />
                </button>

                {showResMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowResMenu(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2 py-1 text-[10px] font-mono text-slate-400 border-b border-slate-800 mb-1">
                        Dispositivo: <strong className="text-slate-200">{deviceSpecs.modelName}</strong> ({deviceSpecs.screen.physicalWidth}x{deviceSpecs.screen.physicalHeight})
                      </div>

                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setResolutionPreference('auto');
                            setShowResMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            resolutionPreference === 'auto'
                              ? 'bg-orange-500/20 text-orange-400 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div>Auto ({deviceSpecs.recommendedResolution.shortTag})</div>
                            <div className="text-[10px] text-slate-400">Recomendado para sua tela</div>
                          </div>
                          {resolutionPreference === 'auto' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setResolutionPreference('1080p');
                            setShowResMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            resolutionPreference === '1080p'
                              ? 'bg-orange-500/20 text-orange-400 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div>1080p 60FPS (Full HD)</div>
                            <div className="text-[10px] text-slate-400">1920x1080 • Broadcast</div>
                          </div>
                          {resolutionPreference === '1080p' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setResolutionPreference('720p');
                            setShowResMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            resolutionPreference === '720p'
                              ? 'bg-orange-500/20 text-orange-400 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div>720p 60FPS (HD Mobile)</div>
                            <div className="text-[10px] text-slate-400">1280x720 • Econômico</div>
                          </div>
                          {resolutionPreference === '720p' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setResolutionPreference('4k');
                            setShowResMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            resolutionPreference === '4k'
                              ? 'bg-orange-500/20 text-orange-400 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div>4K 60FPS (Ultra HD)</div>
                            <div className="text-[10px] text-slate-400">3840x2160 • Pro</div>
                          </div>
                          {resolutionPreference === '4k' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{videoData.timestamp}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar reprodutor"
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div 
          onClick={togglePlay}
          className={`relative bg-black flex items-center justify-center cursor-pointer ${
            targetResolution.aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[70vh] mx-auto' : 'aspect-video'
          }`}
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
        <div className="p-3.5 sm:p-4 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-xs text-slate-400 font-mono self-start sm:self-auto">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Qualidade HD</span>
            </div>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-[11px] text-orange-400/90 font-medium">
              {targetResolution.width}x{targetResolution.height} ({targetResolution.shortTag})
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleShare}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              {isDownloading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isDownloading ? 'Baixando...' : 'Baixar Lance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
