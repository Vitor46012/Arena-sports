'use client';

import React, { useState } from 'react';

export interface B2BReplayItem {
  id: string;
  machineName: string;
  court: string;
  duration: string;
  recordedAt: string;
  sizeMb: number;
  triggerType: 'Botoeira ESP32' | 'Painel Web' | 'API Cronômetro';
  thumbnailUrl: string;
  s3Url: string;
  synced: boolean;
}

const INITIAL_REPLAYS: B2BReplayItem[] = [
  {
    id: 'rep-01',
    machineName: 'LANCE_20260831_19h45',
    court: 'Quadra 1 (Society)',
    duration: '00:30',
    recordedAt: '19:45:12',
    sizeMb: 18.4,
    triggerType: 'Botoeira ESP32',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=900&auto=format&fit=crop',
    s3Url: 's3://sportsreview-clips/pr112/LANCE_20260831_19h45.mp4',
    synced: true,
  },
  {
    id: 'rep-02',
    machineName: 'LANCE_20260831_19h32',
    court: 'Quadra 2 (Fut 7)',
    duration: '00:45',
    recordedAt: '19:32:40',
    sizeMb: 24.2,
    triggerType: 'Botoeira ESP32',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=900&auto=format&fit=crop',
    s3Url: 's3://sportsreview-clips/pr112/LANCE_20260831_19h32.mp4',
    synced: true,
  },
  {
    id: 'rep-03',
    machineName: 'LANCE_20260831_19h10',
    court: 'Quadra 1 (Society)',
    duration: '00:30',
    recordedAt: '19:10:05',
    sizeMb: 17.9,
    triggerType: 'Painel Web',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=900&auto=format&fit=crop',
    s3Url: 's3://sportsreview-clips/pr112/LANCE_20260831_19h10.mp4',
    synced: true,
  },
  {
    id: 'rep-04',
    machineName: 'LANCE_20260831_18h54',
    court: 'Quadra 1 (Society)',
    duration: '00:30',
    recordedAt: '18:54:22',
    sizeMb: 18.1,
    triggerType: 'Botoeira ESP32',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=900&auto=format&fit=crop',
    s3Url: 's3://sportsreview-clips/pr112/LANCE_20260831_18h54.mp4',
    synced: true,
  },
  {
    id: 'rep-05',
    machineName: 'LANCE_20260831_18h40',
    court: 'Quadra 3 (Beach Tennis)',
    duration: '00:30',
    recordedAt: '18:40:15',
    sizeMb: 16.8,
    triggerType: 'Botoeira ESP32',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=900&auto=format&fit=crop',
    s3Url: 's3://sportsreview-clips/pr112/LANCE_20260831_18h40.mp4',
    synced: true,
  },
  {
    id: 'rep-06',
    machineName: 'LANCE_20260831_18h22',
    court: 'Quadra 2 (Fut 7)',
    duration: '00:40',
    recordedAt: '18:22:50',
    sizeMb: 21.3,
    triggerType: 'Botoeira ESP32',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=900&auto=format&fit=crop',
    s3Url: 's3://sportsreview-clips/pr112/LANCE_20260831_18h22.mp4',
    synced: true,
  },
  {
    id: 'rep-07',
    machineName: 'LANCE_20260831_17h58',
    court: 'Quadra 1 (Society)',
    duration: '00:30',
    recordedAt: '17:58:30',
    sizeMb: 17.5,
    triggerType: 'API Cronômetro',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?q=80&w=900&auto=format&fit=crop',
    s3Url: 's3://sportsreview-clips/pr112/LANCE_20260831_17h58.mp4',
    synced: true,
  },
  {
    id: 'rep-08',
    machineName: 'LANCE_20260831_17h35',
    court: 'Quadra 2 (Fut 7)',
    duration: '00:30',
    recordedAt: '17:35:10',
    sizeMb: 18.0,
    triggerType: 'Botoeira ESP32',
    thumbnailUrl: 'https://images.unsplash.com/photo-1529900241929-5447765f52a0?q=80&w=900&auto=format&fit=crop',
    s3Url: 's3://sportsreview-clips/pr112/LANCE_20260831_17h35.mp4',
    synced: true,
  },
];

export default function TenantReplaysView() {
  const [replays, setReplays] = useState<B2BReplayItem[]>(INITIAL_REPLAYS);
  const [selectedCourt, setSelectedCourt] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredReplays = replays.filter((rep) => {
    if (selectedCourt === 'all') return true;
    return rep.court.toLowerCase().includes(selectedCourt.toLowerCase());
  });

  const handleDownload = (replay: B2BReplayItem) => {
    showToast(`Download de ${replay.machineName}.mp4 iniciado com sucesso!`);
  };

  const handleShareLink = (replay: B2BReplayItem) => {
    const url = `https://sportsreview.app/lance/${replay.machineName}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    showToast(`Link de ${replay.machineName} copiado!`);
  };

  const handleManualSyncAll = () => {
    showToast('Varredura do Bucket S3 executada. Todos os 8 lances sincronizados!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 bg-slate-900 border-slate-700 text-slate-100">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            cloud_done
          </span>
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
            Galeria B2B de cortes gerados via botoeira física das quadras e sincronizados no bucket S3.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">
              filter_alt
            </span>
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-100">
                Todas as Quadras ({replays.length})
              </option>
              <option value="Quadra 1" className="bg-slate-900 text-slate-100">
                Quadra 1 (Society)
              </option>
              <option value="Quadra 2" className="bg-slate-900 text-slate-100">
                Quadra 2 (Fut 7)
              </option>
              <option value="Quadra 3" className="bg-slate-900 text-slate-100">
                Quadra 3 (Beach Tennis)
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleManualSyncAll}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] text-orange-500">
              sync
            </span>
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* 4-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredReplays.map((rep) => (
          <div
            key={rep.id}
            id={`replay-card-${rep.machineName}`}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all group"
          >
            {/* Thumbnail Box */}
            <div className="relative w-full aspect-video bg-black overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                style={{ backgroundImage: `url(${rep.thumbnailUrl})` }}
              />

              {/* Duration Tag */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-white font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>{rep.duration}</span>
              </div>

              {/* Time of recording */}
              <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px]">
                {rep.recordedAt}
              </div>

              {/* Play Hover Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-2xl icon-fill ml-0.5">
                    play_arrow
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-100 tracking-wide">
                    {rep.machineName}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{rep.court}</span>
                  <span className="font-mono">{rep.sizeMb} MB</span>
                </div>

                {/* S3 Emerald Badge */}
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Sincronizado na Nuvem
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  id={`btnDownloadReplay-${rep.id}`}
                  onClick={() => handleDownload(rep)}
                  className="w-full py-2 bg-slate-800 hover:bg-orange-500 hover:text-white border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  <span>Baixar</span>
                </button>

                <button
                  type="button"
                  id={`btnShareReplay-${rep.id}`}
                  onClick={() => handleShareLink(rep)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-300 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">share</span>
                  <span>Link</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
