'use client';
import PermissionGuard from '@/components/auth/PermissionGuard';

import React, { useState, useEffect } from 'react';
import SceneConfigModal from './SceneConfigModal';
import { useArenaState } from '@/hooks/useArenaState';
import { Lock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Radio,
  Video,
  Trophy,
  Film,
  Cast,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Tv,
  PauseCircle,
  Loader2,
} from 'lucide-react';

const SCENES_LIST = [
  {
    id: 'Espera / Pré-jogo',
    label: 'Espera / Pré-jogo',
    description: 'Vinheta de abertura com som ambiente suave',
    icon: Clock,
  },
  {
    id: 'Jogo Ao Vivo + Placar',
    label: 'Jogo Ao Vivo + Placar',
    description: 'Câmera principal 1080p60 com overlay dinâmico',
    icon: Tv,
  },
  {
    id: 'Intervalo / Patrocinadores',
    label: 'Intervalo / Patrocinadores',
    description: 'Carrossel de marcas locais e replays',
    icon: PauseCircle,
  },
];

const COURTS_METADATA = [
  { id: '1', name: 'Quadra 1 (Society Principal)' },
  { id: '2', name: 'Quadra 2 (Futebol 7 Sintética)' },
  { id: '3', name: 'Quadra 3 (Beach Tennis)' },
];

export default function TenantDashboardView({ features = {}, role = "tenant" }: { features?: Record<string, boolean>; role?: string }) {
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
        console.warn('Aviso ao carregar configurações RTMP:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
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

      showToast('Configurações da Live salvas com sucesso!', 'success');
    } catch (err) {
      console.warn('Aviso ao salvar parâmetros RTMP:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
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
        console.warn('Falha ao buscar arenas:', String(fetchErr));
      }

      const payload = {
        machineName: 'LANCE_TESTE_' + Date.now(),
        s3Key: 'replays/test-video.mp4',
        s3Url: 'https://example.com/test-video.mp4',
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

      showToast('Lance gravado com sucesso!', 'success');
    } catch (err: unknown) {
      console.warn('Aviso ao registrar lance:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
      const message = err instanceof Error ? err.message : 'Erro ao processar';
      showToast(`Erro ao gravar lance: ${message}`, 'warn');
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
    showToast(`Tela alterada para "${sceneId}" na live!`, 'success');
  };

  const handleToggleGoLive = () => {
    const nextLive = toggleLive();
    if (nextLive) {
      showToast('TRANSMISSÃO AO VIVO INICIADA! O jogo já está passando no YouTube.', 'success');
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

  const isOnline = telemetry.brokerConnected ?? true;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div
          id="tenantToast"
          className="fixed top-18 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 bg-slate-900 border-slate-700 text-slate-100"
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toastMessage.type === 'warn' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-orange-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-['Sora'] tracking-tight">
            Painel de Transmissão
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Controle do placar, troca de telas na live e gravação de melhores momentos da quadra.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-mono transition-colors ${
              isOnline
                ? 'bg-slate-900 border-slate-800 text-slate-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            ></span>
            <span>
              {isOnline
                ? 'Painel Conectado'
                : 'Equipamento Desconectado - Verifique a energia e internet da quadra'}
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
              <Trophy className="w-4 h-4 text-orange-500 shrink-0" />
              Controle de Partida
            </h3>

            <label className="inline-flex items-center cursor-pointer gap-2">
              <span className="text-[11px] font-semibold text-slate-400">
                Placar na Live
              </span>
              <input
                type="checkbox"
                checked={matchState.showOverlay}
                onChange={() => {
                  toggleOverlay();
                  showToast(
                    !matchState.showOverlay
                      ? 'Placar agora está visível na transmissão.'
                      : 'Placar ocultado da transmissão.',
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
              <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleScoreChange('home', -1)}
                  aria-label="Diminuir gol casa"
                  className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-200 border border-slate-700 flex items-center justify-center transition-all cursor-pointer min-w-[44px] min-h-[44px]"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span
                  id="scoreHomeDisplay"
                  className="w-14 text-center text-4xl sm:text-5xl font-bold font-['Sora'] text-slate-100 select-none"
                >
                  {matchState.homeScore}
                </span>
                <button
                  type="button"
                  onClick={() => handleScoreChange('home', 1)}
                  aria-label="Aumentar gol casa"
                  className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-200 border border-slate-700 flex items-center justify-center transition-all cursor-pointer min-w-[44px] min-h-[44px]"
                >
                  <Plus className="w-5 h-5" />
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-lg px-2 py-2 text-xs text-slate-100 text-center font-bold outline-none transition-colors"
                placeholder="Visitante"
              />
              <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleScoreChange('away', -1)}
                  aria-label="Diminuir gol visitante"
                  className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-200 border border-slate-700 flex items-center justify-center transition-all cursor-pointer min-w-[44px] min-h-[44px]"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span
                  id="scoreAwayDisplay"
                  className="w-14 text-center text-4xl sm:text-5xl font-bold font-['Sora'] text-slate-100 select-none"
                >
                  {matchState.awayScore}
                </span>
                <button
                  type="button"
                  onClick={() => handleScoreChange('away', 1)}
                  aria-label="Aumentar gol visitante"
                  className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-200 border border-slate-700 flex items-center justify-center transition-all cursor-pointer min-w-[44px] min-h-[44px]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chronometer Center */}
          <div className="pt-4 border-t border-slate-800 flex flex-col items-center gap-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Tempo de Jogo
            </p>
            <span
              id="chronometerDisplay"
              className="font-mono text-4xl sm:text-5xl font-black text-slate-100 tracking-wider select-none font-['Sora']"
            >
              {formatTimer(matchState.timerSeconds)}
            </span>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                id="btnTimerPlayPause"
                onClick={handleToggleTimer}
                aria-label={matchState.isTimerRunning ? 'Pausar Cronômetro' : 'Iniciar Cronômetro'}
                className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white shadow-lg transition-transform active:scale-90 cursor-pointer min-w-[48px] min-h-[48px]"
              >
                {matchState.isTimerRunning ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                id="btnTimerReset"
                onClick={handleResetTimer}
                aria-label="Zerar Cronômetro"
                className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer min-w-[48px] min-h-[48px]"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Cutting Desk (OBS Scenes) */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-4 h-4 text-orange-500 shrink-0" />
              Controle da Tela da Live
            </h3>
            <span
              className={`text-[11px] font-mono font-semibold ${
                isOnline ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isOnline ? 'Conexão Ativa' : 'Equipamento Offline'}
            </span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {SCENES_LIST.map((scene) => {
              const isActive = matchState.activeScene === scene.id;
              const SceneIcon = scene.icon;
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
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <SceneIcon className="w-5 h-5" />
                    </div>
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
                    className="p-2 rounded-lg bg-slate-800/80 text-slate-400 hover:text-orange-500 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center justify-between">
            <span className="font-mono text-[11px]">Tela Atual:</span>
            <span className="text-orange-400 font-semibold font-mono">{matchState.activeScene}</span>
          </div>
        </div>

        {/* Column 3: RTMP Destination Settings */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cast className="w-4 h-4 text-orange-500 shrink-0" />
              Configuração da Live / YouTube
            </h3>
            <span className="text-[11px] text-slate-400">YouTube / Twitch</span>
          </div>

          <PermissionGuard 
            permissionKey="transmission.edit_rtmp" 
            role={role} 
            features={features}
            fallback={
              <div className="space-y-3.5 flex-1 relative opacity-50 cursor-not-allowed">
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 rounded-lg backdrop-blur-[1px]">
                  <div className="bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800 flex items-center gap-2 shadow-xl">
                    <Lock className="w-4 h-4 text-orange-500" />
                    <span className="text-[10px] font-bold text-slate-300">Apenas NOC</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">
                    URL de Transmissão do YouTube
                  </label>
                  <input
                    type="text"
                    disabled
                    value={rtmpUrl}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 outline-none transition-colors"
                    placeholder="Ex: rtmp://a.rtmp.youtube.com/live2"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">
                    Chave de Transmissão do YouTube
                  </label>
                  <input
                    type="password"
                    disabled
                    value={rtmpKey}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 outline-none transition-colors"
                    placeholder="••••••••••••••••"
                  />
                </div>
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <span>Salvar Configuração do YouTube</span>
                </button>
              </div>
            }
          >
            <div className="space-y-3.5 flex-1">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">
                  URL de Transmissão do YouTube
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
                  Chave de Transmissão do YouTube
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
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingRtmp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <span>Salvar Configuração do YouTube</span>
                )}
              </button>
            </div>
          </PermissionGuard>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Qualidade de Vídeo:</span>
              <span className="text-slate-200 font-mono">1920x1080 @ 60fps</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Upload Recomendado:</span>
              <span className="text-slate-200 font-mono">6 Mbps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Master Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Master Go Live Button (Primary) */}
        <div className="md:col-span-2">
          <button
            type="button"
            id="masterGoLiveBtn"
            onClick={handleToggleGoLive}
            disabled={!isOnline}
            className={`w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base md:text-lg font-['Sora'] uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-xl ${
              !isOnline
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50 shadow-none'
                : matchState.isLive
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30 cursor-pointer'
                : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white shadow-orange-500/25 cursor-pointer'
            }`}
          >
            <Radio className={`w-5 h-5 ${matchState.isLive ? 'animate-pulse' : ''}`} />
            <span className="whitespace-nowrap">
              {matchState.isLive
                ? 'NO AR • ENCERRAR TRANSMISSÃO'
                : 'INICIAR TRANSMISSÃO AO VIVO'}
            </span>
          </button>
        </div>

        {/* Manual Clip Button (Secondary Outline) */}
        <div>
          <button
            type="button"
            id="btnManualClip"
            onClick={simulateEdgeUpload}
            disabled={!isOnline || isSimulatingUpload}
            className="w-full h-full min-h-[56px] py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border border-orange-500 text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/20"
          >
            {isSimulatingUpload ? (
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            ) : (
              <Video className="w-5 h-5" />
            )}
            <span className="whitespace-nowrap">
              {isSimulatingUpload
                ? 'GRAVANDO LANCE...'
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
          showToast(`Tela "${activeModalScene}" atualizada na live com sucesso!`, 'success');
        }}
      />
    </div>
  );
}
