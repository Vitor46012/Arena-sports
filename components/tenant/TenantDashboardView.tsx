'use client';

import React, { useState, useEffect } from 'react';
import SceneConfigModal from './SceneConfigModal';
import { useArenaState } from '@/hooks/useArenaState';

const SCENES_LIST = [
  {
    id: 'Espera / Pré-jogo',
    label: 'Espera / Pré-jogo',
    description: 'Vinheta de abertura com som ambiente suave',
    icon: 'hourglass_empty',
  },
  {
    id: 'Jogo Ao Vivo + Placar',
    label: 'Jogo Ao Vivo + Placar',
    description: 'Câmera principal 1080p60 com overlay dinâmico',
    icon: 'live_tv',
  },
  {
    id: 'Intervalo / Patrocinadores',
    label: 'Intervalo / Patrocinadores',
    description: 'Carrossel de marcas locais e replays',
    icon: 'pause_presentation',
  },
];

const COURTS_METADATA = [
  { id: '1', name: 'Quadra 1 (Society Principal)' },
  { id: '2', name: 'Quadra 2 (Futebol 7 Sintética)' },
  { id: '3', name: 'Quadra 3 (Beach Tennis)' },
];

export default function TenantDashboardView() {
  const arenaState = useArenaState('arena-local');
  const {
    telemetry,
    matchState,
    updateScore,
    setTeams,
    toggleLive,
    toggleTimer,
    resetTimer,
    toggleOverlay,
    setActiveScene,
    setActiveCourt,
    triggerManualClip,
  } = arenaState;

  const [activeModalScene, setActiveModalScene] = useState<string | null>(null);
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warn';
  } | null>(null);

  // RTMP Dynamic State (Zero Mocks)
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [rtmpKey, setRtmpKey] = useState('');
  const [isSavingRtmp, setIsSavingRtmp] = useState(false);

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Carrega as configurações reais de RTMP da arena via API
  useEffect(() => {
    let isMounted = true;
    const fetchRtmpConfig = async () => {
      try {
        const res = await fetch('/api/arenas/config', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) return;

        const data = await res.json();
        if (isMounted && data) {
          if (typeof data.rtmpUrl === 'string') setRtmpUrl(data.rtmpUrl);
          if (typeof data.rtmpKey === 'string') setRtmpKey(data.rtmpKey);
        }
      } catch (err) {
        console.error('Erro ao carregar configurações RTMP:', err);
      }
    };

    fetchRtmpConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveRtmpConfig = async () => {
    setIsSavingRtmp(true);
    try {
      const res = await fetch('/api/arenas/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          rtmpUrl,
          rtmpKey,
          arenaId: matchState.id ? undefined : 'arena-pr-01',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }

      showToast('Configuração RTMP salva e sincronizada no OBS do Edge!', 'success');
    } catch (err) {
      console.error('Erro ao salvar parâmetros RTMP:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao salvar.';
      showToast(`Erro ao salvar RTMP: ${msg}`, 'warn');
    } finally {
      setIsSavingRtmp(false);
    }
  };

  const simulateEdgeUpload = async () => {
    setIsSimulatingUpload(true);
    try {
      let arenaId = 'arena-pr-01';
      try {
        const arenasRes = await fetch('/api/arenas');
        if (arenasRes.ok) {
          const arenasData = await arenasRes.json();
          if (Array.isArray(arenasData) && arenasData.length > 0) {
            arenaId = arenasData[0].id;
          }
        }
      } catch (fetchErr) {
        console.warn('Falha ao buscar arenas, usando fallback:', fetchErr);
      }

      const payload = {
        machineName: 'LANCE_TESTE_' + Date.now(),
        driveFileId: '1EHOEm2wEaNkxU_mD1tN6PM-4oJ1DpweE',
        duration: '00:30',
        sizeMb: 12.5,
        arenaId,
        nodeToken: 'token-secreto-123',
      };

      const res = await fetch('/api/webhooks/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }

      showToast('Webhook enviado com sucesso!', 'success');
    } catch (err: unknown) {
      console.error('Erro ao simular webhook do edge node:', err);
      const message = err instanceof Error ? err.message : 'Erro ao processar';
      showToast(`Erro no webhook: ${message}`, 'warn');
    } finally {
      setIsSimulatingUpload(false);
    }
  };

  const handleScoreChange = (team: 'home' | 'away', delta: number) => {
    updateScore(team, delta);
    showToast(
      `${team === 'home' ? matchState.homeTeam : matchState.awayTeam}: ${delta > 0 ? '+1 Gol!' : '-1 Gol'}`,
      'info'
    );
  };

  const handleToggleTimer = () => {
    toggleTimer();
    showToast(
      !matchState.isTimerRunning
        ? `Cronômetro iniciado (${matchState.courtName})`
        : 'Cronômetro pausado.',
      'info'
    );
  };

  const handleResetTimer = () => {
    resetTimer();
    showToast('Cronômetro reiniciado para 00:00.', 'info');
  };

  const handleSceneSelect = (sceneId: string) => {
    setActiveScene(sceneId);
    showToast(`Cena alterada para "${sceneId}" via WebSocket OBS!`, 'success');
  };

  const handleToggleGoLive = () => {
    const nextLive = toggleLive();
    if (nextLive) {
      showToast('TRANSMISSÃO AO VIVO INICIADA! Sinal enviado para o YouTube.', 'success');
    } else {
      showToast('Transmissão ao vivo encerrada.', 'warn');
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div
          id="tenantToast"
          className="fixed top-18 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 bg-slate-900 border-slate-700 text-slate-100"
        >
          <span
            className={`material-symbols-outlined text-[18px] ${
              toastMessage.type === 'success'
                ? 'text-emerald-400'
                : toastMessage.type === 'warn'
                ? 'text-red-400'
                : 'text-orange-400'
            }`}
          >
            {toastMessage.type === 'success'
              ? 'check_circle'
              : toastMessage.type === 'warn'
              ? 'error'
              : 'info'}
          </span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-['Sora'] tracking-tight">
            Mesa de Corte & Transmissão B2B
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Controle de partidas, troca de cenas OBS e disparo de replays em tempo real via MQTT & Edge N100.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                telemetry.brokerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
              }`}
            ></span>
            <span className="text-slate-300">
              {telemetry.brokerConnected
                ? `N100: ${telemetry.cpu}% CPU | ${telemetry.temp}°C | ${telemetry.fps} FPS`
                : 'Hardware: Aguardando Conexão'}
            </span>
          </div>
        </div>
      </div>

      {/* Court Selection Tabs */}
      <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-2">
        {COURTS_METADATA.map((c) => {
          const isSelected = matchState.courtId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              id={`tab-court-${c.id}`}
              onClick={() => {
                setActiveCourt(c.id);
                showToast(`Quadra ativa alternada para ${c.name}`, 'info');
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                isSelected
                  ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[inset_0_0_10px_rgba(249,115,22,0.1)]'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSelected && matchState.isLive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span className="truncate">{c.name}</span>
              {isSelected && matchState.isLive && (
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] uppercase font-mono">
                  AO VIVO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main 3-Column Control Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Match Control & Scoreboard */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between space-y-6 shadow-xl">
          {/* Header & Overlay Toggle */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-orange-500 text-[18px]">
                scoreboard
              </span>
              Controle de Partida
            </h3>

            <label className="inline-flex items-center cursor-pointer gap-2">
              <span className="text-[11px] font-semibold text-slate-400">
                Placar no OBS
              </span>
              <input
                type="checkbox"
                checked={matchState.showOverlay}
                onChange={() => {
                  toggleOverlay();
                  showToast(
                    !matchState.showOverlay
                      ? 'Overlay do placar exibido no stream.'
                      : 'Overlay do placar ocultado.',
                    'info'
                  );
                }}
                className="sr-only peer"
              />
              <div className="relative w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-500" />
            </label>
          </div>

          {/* Teams and Score Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Home Team */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 block text-center uppercase tracking-wider">
                Time Casa
              </label>
              <input
                type="text"
                value={matchState.homeTeam}
                onChange={(e) => setTeams(e.target.value, matchState.awayTeam)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-lg px-2 py-1.5 text-xs text-slate-100 text-center font-bold outline-none transition-colors"
                placeholder="Time Casa"
              />
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleScoreChange('home', -1)}
                  aria-label="Diminuir gol casa"
                  className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span
                  id="scoreHomeDisplay"
                  className="w-12 text-center text-4xl font-bold font-['Sora'] text-slate-100"
                >
                  {matchState.homeScore}
                </span>
                <button
                  type="button"
                  onClick={() => handleScoreChange('home', 1)}
                  aria-label="Aumentar gol casa"
                  className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-orange-500 hover:text-white active:scale-95 text-slate-200 border border-slate-700 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>

            {/* Away Team */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 block text-center uppercase tracking-wider">
                Visitante
              </label>
              <input
                type="text"
                value={matchState.awayTeam}
                onChange={(e) => setTeams(matchState.homeTeam, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-lg px-2 py-1.5 text-xs text-slate-100 text-center font-bold outline-none transition-colors"
                placeholder="Visitante"
              />
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleScoreChange('away', -1)}
                  aria-label="Diminuir gol visitante"
                  className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span
                  id="scoreAwayDisplay"
                  className="w-12 text-center text-4xl font-bold font-['Sora'] text-slate-100"
                >
                  {matchState.awayScore}
                </span>
                <button
                  type="button"
                  onClick={() => handleScoreChange('away', 1)}
                  aria-label="Aumentar gol visitante"
                  className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-orange-500 hover:text-white active:scale-95 text-slate-200 border border-slate-700 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chronometer Center */}
          <div className="pt-4 border-t border-slate-800 flex flex-col items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Tempo de Jogo
            </p>
            <div
              id="chronometerDisplay"
              className="text-4xl font-bold font-mono text-white tracking-wider py-1 font-['Sora']"
            >
              {formatTimer(matchState.timerSeconds)}
            </div>

            <div className="flex gap-3 mt-3">
              <button
                type="button"
                id="btnTimerPlayPause"
                onClick={handleToggleTimer}
                aria-label={matchState.isTimerRunning ? 'Pausar Cronômetro' : 'Iniciar Cronômetro'}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all active:scale-95 ${
                  matchState.isTimerRunning
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-orange-500 hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {matchState.isTimerRunning ? 'pause' : 'play_arrow'}
                </span>
              </button>

              <button
                type="button"
                id="btnTimerReset"
                onClick={handleResetTimer}
                aria-label="Zerar Cronômetro"
                className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-slate-700 flex items-center justify-center transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-2xl">restart_alt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Cutting Desk (OBS Scenes) */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-orange-500 text-[18px]">
                movie_edit
              </span>
              Mesa de Corte (Cenas OBS)
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">WebSocket 4455</span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {SCENES_LIST.map((scene) => {
              const isActive = matchState.activeScene === scene.id;
              return (
                <div
                  key={scene.id}
                  onClick={() => handleSceneSelect(scene.id)}
                  className={`relative p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[inset_0_0_12px_rgba(249,115,22,0.12)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-2xl ${
                        isActive ? 'text-orange-500' : 'text-slate-400'
                      }`}
                    >
                      {scene.icon}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold tracking-tight">
                        {scene.label}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {scene.description}
                      </p>
                    </div>
                  </div>

                  {/* Gear icon for Scene Settings Modal */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveModalScene(scene.id);
                    }}
                    aria-label={`Configurar cena ${scene.label}`}
                    className="p-2 rounded-lg bg-slate-800/80 text-slate-400 hover:text-orange-500 hover:bg-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center justify-between">
            <span className="font-mono text-[11px]">Cena Ativa no Stream:</span>
            <span className="text-orange-400 font-semibold font-mono">{matchState.activeScene}</span>
          </div>
        </div>

        {/* Column 3: RTMP Destination Settings */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-orange-500 text-[18px]">
                cast
              </span>
              Destino de Transmissão (RTMP)
            </h3>
            <span className="text-[11px] text-slate-400">YouTube / Twitch</span>
          </div>

          <div className="space-y-3.5 flex-1">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">
                URL do Servidor Ingest
              </label>
              <input
                type="text"
                value={rtmpUrl}
                onChange={(e) => setRtmpUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 outline-none transition-colors"
                placeholder="Ex: rtmp://a.rtmp.youtube.com/live2"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">
                Chave de Transmissão (Stream Key)
              </label>
              <input
                type="password"
                value={rtmpKey}
                onChange={(e) => setRtmpKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 outline-none transition-colors"
                placeholder="••••••••••••••••"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveRtmpConfig}
              disabled={isSavingRtmp}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              {isSavingRtmp && (
                <span className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isSavingRtmp ? 'Sincronizando...' : 'Salvar Parâmetros RTMP'}</span>
            </button>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Resolução OBS:</span>
                <span className="text-slate-200 font-mono">1920x1080 @ 60fps</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Bitrate de Saída:</span>
                <span className="text-slate-200 font-mono">6000 kbps (CBR)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Master Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Master Go Live Button */}
        <div className="md:col-span-2">
          <button
            type="button"
            id="masterGoLiveBtn"
            onClick={handleToggleGoLive}
            className={`w-full py-4 rounded-xl font-bold text-base md:text-lg font-['Sora'] uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-xl ${
              matchState.isLive
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30'
                : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white shadow-orange-500/25'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">
              {matchState.isLive ? 'sensors' : 'podcasts'}
            </span>
            <span>
              {matchState.isLive
                ? 'NO AR • ENCERRAR TRANSMISSÃO'
                : 'INICIAR TRANSMISSÃO AO VIVO'}
            </span>
          </button>
        </div>

        {/* Manual Clip Button */}
        <div>
          <button
            type="button"
            id="btnManualClip"
            onClick={simulateEdgeUpload}
            disabled={isSimulatingUpload}
            className="w-full h-full min-h-[56px] py-3.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-75 active:scale-[0.99] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined text-[20px] ${isSimulatingUpload ? 'animate-spin' : ''}`}>
              {isSimulatingUpload ? 'sync' : 'video_camera_front'}
            </span>
            <span>
              {isSimulatingUpload
                ? 'ENVIANDO WEBHOOK...'
                : 'GRAVAR LANCE MANUAL (30S)'}
            </span>
          </button>
        </div>
      </div>

      {/* Scene Configuration Modal */}
      <SceneConfigModal
        isOpen={Boolean(activeModalScene)}
        sceneName={activeModalScene || ''}
        onClose={() => setActiveModalScene(null)}
        onSync={() => {
          showToast(`Cena "${activeModalScene}" sincronizada com OBS via WebSocket!`, 'success');
        }}
      />
    </div>
  );
}
