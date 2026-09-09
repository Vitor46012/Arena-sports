'use client';

import React, { useState } from 'react';
import {
  Sliders,
  X,
  Image as ImageIcon,
  Video,
  Volume2,
  VolumeX,
  UploadCloud,
  RefreshCw,
  Mic,
  MicOff,
  Music,
  Send,
} from 'lucide-react';

interface SceneConfigModalProps {
  isOpen: boolean;
  sceneName: string;
  onClose: () => void;
  onSync: (config: {
    ambientVolume: number;
    mediaVolume: number;
    overlayEnabled: boolean;
    mediaFilesCount: number;
  }) => void;
}

export default function SceneConfigModal({
  isOpen,
  sceneName,
  onClose,
  onSync,
}: SceneConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'audio'>('media');
  const [ambientVolume, setAmbientVolume] = useState(75);
  const [mediaVolume, setMediaVolume] = useState(0);
  const [isAmbientMuted, setIsAmbientMuted] = useState(false);
  const [isMediaMuted, setIsMediaMuted] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'patrocinador_master_banner.png',
    'vinheta_intervalo_1080p.mp4',
  ]);
  const [syncSuccess, setSyncSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      setUploadedFiles((prev) => [...prev, fileName]);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f !== fileName));
  };

  const handleSyncObs = () => {
    onSync({
      ambientVolume: isAmbientMuted ? 0 : ambientVolume,
      mediaVolume: isMediaMuted ? 0 : mediaVolume,
      overlayEnabled: true,
      mediaFilesCount: uploadedFiles.length,
    });
    setSyncSuccess(true);
    setTimeout(() => {
      setSyncSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        id="sceneConfigOverlay"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer */}
      <div
        id="sceneConfigModal"
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-bold text-slate-100 font-['Sora']">
                Configuração da Tela
              </h2>
            </div>
            <p className="text-xs text-orange-400 font-mono mt-0.5">
              Cena: {sceneName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configuração"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-4">
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-3 text-xs font-bold tracking-wide border-b-2 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'media'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Mídia & Overlays
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-3 text-xs font-bold tracking-wide border-b-2 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'audio'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            Mixagem de Áudio
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
          {/* Tab 1: Visual Media */}
          {activeTab === 'media' && (
            <div className="space-y-4 animate-in fade-in">
              <label
                htmlFor="mediaFileInput"
                className="border-2 border-dashed border-slate-700 hover:border-orange-500/60 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-800/40 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-orange-500 mb-2 transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-200 text-center">
                  Clique ou arraste arquivos de mídia
                </p>
                <p className="text-[11px] text-slate-500 text-center mt-1">
                  Formatos suportados: MP4, MOV, PNG, JPG (Full HD 1080p)
                </p>
                <input
                  id="mediaFileInput"
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Uploaded Files List */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Arquivos Vinculados a esta Cena ({uploadedFiles.length})
                </p>
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {file.endsWith('.mp4') ? (
                        <Video className="w-4 h-4 text-orange-500 shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-orange-500 shrink-0" />
                      )}
                      <span className="text-slate-200 truncate font-mono text-[11px]">
                        {file}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file)}
                      className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                      title="Remover arquivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Edge Cache Alert */}
              <div className="bg-slate-950/80 rounded-lg p-3 flex gap-2.5 items-start border border-slate-800">
                <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Sincronização Rápida
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Arquivos enviados ficam armazenados no sistema para carregamento imediato durante os jogos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Audio Mixer */}
          {activeTab === 'audio' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Channel 1: Ambient Sound */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-slate-400" />
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                      Som Ambiente da Quadra (Microfone)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAmbientMuted(!isAmbientMuted)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isAmbientMuted
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-orange-500'
                    }`}
                  >
                    {isAmbientMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Volume</span>
                    <span className="text-emerald-400 font-bold">
                      {isAmbientMuted ? 'MUTADO' : `${ambientVolume}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isAmbientMuted ? 0 : ambientVolume}
                    disabled={isAmbientMuted}
                    onChange={(e) => setAmbientVolume(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer disabled:opacity-30"
                  />
                </div>
              </div>

              {/* Channel 2: Media Audio */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-slate-400" />
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                      Áudio do Vídeo de Fundo / Mídia
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMediaMuted(!isMediaMuted)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isMediaMuted
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-orange-500'
                    }`}
                  >
                    {isMediaMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Volume</span>
                    <span className="text-emerald-400 font-bold">
                      {isMediaMuted ? 'MUTADO' : `${mediaVolume}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMediaMuted ? 0 : mediaVolume}
                    disabled={isMediaMuted}
                    onChange={(e) => setMediaVolume(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer disabled:opacity-30"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-2">
          {syncSuccess && (
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center animate-in fade-in">
              Aparência da tela salva com sucesso!
            </div>
          )}
          <button
            type="button"
            id="btnSyncObsScene"
            onClick={handleSyncObs}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            SALVAR E ATUALIZAR TELA
          </button>
        </div>
      </div>
    </>
  );
}
