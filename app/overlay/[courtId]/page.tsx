'use client';

import React, { useEffect, useState, useRef, use, useTransition } from 'react';
import {
  QrCode,
  Radio,
  Trophy,
  Sparkles,
  Clock,
  Zap,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface MatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  isLive: boolean;
  activeScene: string;
  courtNumber: number;
  startTime?: string | null;
  updatedAt?: string | null;
}

interface OverlayData {
  court: {
    id: string;
    name: string;
    identifier: string;
  };
  arena: {
    id: string;
    name: string;
    logoUrl: string | null;
    sponsors: string[];
    overlayText: string;
  };
  match?: MatchData | null;
  updatedAt: string;
}

// Patrocinadores padrão com logos e slogans estilizados para transmissão esportiva
const DEFAULT_BROADCAST_SPONSORS = [
  {
    name: 'SPORTS REVIEW PRO',
    tagline: 'Automação & Transmissão Edge N100',
    accentColor: 'from-orange-500 to-amber-500',
    logoText: 'SR',
    type: 'Master Partner',
  },
  {
    name: 'FASTREPLAY AI',
    tagline: 'Clips em 30s • Cloudflare R2 Speed',
    accentColor: 'from-cyan-500 to-blue-600',
    logoText: 'FR',
    type: 'Tech Partner',
  },
  {
    name: 'ARENA TECH IOT',
    tagline: 'Botoeiras ESP32 & Scoreboards Inteligentes',
    accentColor: 'from-emerald-500 to-teal-600',
    logoText: 'AT',
    type: 'Official Sponsor',
  },
  {
    name: 'EDGEVISION 4K',
    tagline: 'Visão Computacional & Análise Tática',
    accentColor: 'from-purple-500 to-indigo-600',
    logoText: 'EV',
    type: 'Official Partner',
  },
];

export default function ObsOverlayPage({
  params,
}: {
  params: Promise<{ courtId: string }>;
}) {
  const resolvedParams = use(params);
  const courtId = resolvedParams.courtId;

  const [data, setData] = useState<OverlayData | null>(null);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [sponsorAnimationState, setSponsorAnimationState] = useState<'visible' | 'exiting' | 'entering'>('visible');
  const [currentTime, setCurrentTime] = useState('');
  const [gameElapsedSeconds, setGameElapsedSeconds] = useState(1354); // ~22:34 de partida

  // Estados de animação de atualização de metadados
  const [isMetadataUpdating, setIsMetadataUpdating] = useState(false);
  const [homeScoreBump, setHomeScoreBump] = useState(false);
  const [awayScoreBump, setAwayScoreBump] = useState(false);
  const [activeSceneMorph, setActiveSceneMorph] = useState(false);

  // Armazena pontuações anteriores para disparar burst CSS em mudanças
  const prevHomeScoreRef = useRef<number | null>(null);
  const prevAwayScoreRef = useRef<number | null>(null);
  const prevSceneRef = useRef<string | null>(null);
  const prevUpdatedAtRef = useRef<string | null>(null);

  // Barra de progresso do patrocinador
  const [sponsorProgress, setSponsorProgress] = useState(0);
  const sponsorIntervalDuration = 7000; // 7 segundos

  // Polling suave dos dados do overlay
  useEffect(() => {
    let isMounted = true;

    const fetchOverlay = async () => {
      try {
        const res = await fetch(`/api/overlay/${courtId}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json: OverlayData = await res.json();
          if (isMounted) {
            setData((prevData) => {
              // Checa se houve atualização de dados
              if (prevData && prevData.updatedAt !== json.updatedAt) {
                setIsMetadataUpdating(true);
                setTimeout(() => setIsMetadataUpdating(false), 1400);
              }
              return json;
            });

            // Dispara animações de burst de score se os números mudaram
            if (json.match) {
              if (
                prevHomeScoreRef.current !== null &&
                json.match.homeScore !== prevHomeScoreRef.current
              ) {
                setHomeScoreBump(true);
                setTimeout(() => setHomeScoreBump(false), 800);
              }
              if (
                prevAwayScoreRef.current !== null &&
                json.match.awayScore !== prevAwayScoreRef.current
              ) {
                setAwayScoreBump(true);
                setTimeout(() => setAwayScoreBump(false), 800);
              }
              if (
                prevSceneRef.current !== null &&
                json.match.activeScene !== prevSceneRef.current
              ) {
                setActiveSceneMorph(true);
                setTimeout(() => setActiveSceneMorph(false), 600);
              }

              prevHomeScoreRef.current = json.match.homeScore;
              prevAwayScoreRef.current = json.match.awayScore;
              prevSceneRef.current = json.match.activeScene;
            }

            prevUpdatedAtRef.current = json.updatedAt;
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do overlay OBS:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
      }
    };

    fetchOverlay();
    const interval = setInterval(fetchOverlay, 15000); // Polling a cada 15s para captar atualizações de jogo

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [courtId]);

  // Relógio do dia e cronômetro de partida
  useEffect(() => {
    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setGameElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Lista de patrocinadores ativa (se a arena não possuir, usa patrocinadores de alta resolução padrão)
  const rawSponsors = data?.arena?.sponsors || [];
  const hasCustomSponsors = rawSponsors.length > 0;
  const sponsorsCount = hasCustomSponsors ? rawSponsors.length : DEFAULT_BROADCAST_SPONSORS.length;

  // Carrossel de patrocinadores com transição CSS broadcast fluida e barra de progresso
  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / sponsorIntervalDuration) * 100, 100);
      setSponsorProgress(progress);

      if (elapsed < sponsorIntervalDuration) {
        progressTimer = setTimeout(updateProgress, 50);
      }
    };

    updateProgress();

    // Quando faltam 450ms para a rotação, inicia a transição de saída
    const exitTimer = setTimeout(() => {
      setSponsorAnimationState('exiting');
    }, sponsorIntervalDuration - 450);

    // No tempo exato da troca, atualiza índice e dispara transição de entrada
    const switchTimer = setTimeout(() => {
      setCurrentSponsorIndex((prev) => (prev + 1) % sponsorsCount);
      setSponsorAnimationState('entering');

      // Após a entrada, estabiliza no estado visível
      setTimeout(() => {
        setSponsorAnimationState('visible');
      }, 500);
    }, sponsorIntervalDuration);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(exitTimer);
      clearTimeout(switchTimer);
    };
  }, [currentSponsorIndex, sponsorsCount]);

  // Formatação do tempo de partida (MM:SS)
  const formatGameClock = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Funções de simulação de atualização para testes manuais no navegador
  const simulateGoal = (team: 'home' | 'away') => {
    setData((prev) => {
      if (!prev) return prev;
      const currentMatch = prev.match || {
        id: 'sim-match',
        homeTeam: 'Time Casa',
        awayTeam: 'Time Visitante',
        homeScore: 8,
        awayScore: 5,
        isLive: true,
        activeScene: 'Jogo Ao Vivo + Placar',
        courtNumber: 1,
      };

      const nextHome = team === 'home' ? currentMatch.homeScore + 1 : currentMatch.homeScore;
      const nextAway = team === 'away' ? currentMatch.awayScore + 1 : currentMatch.awayScore;

      if (team === 'home') {
        setHomeScoreBump(true);
        setTimeout(() => setHomeScoreBump(false), 800);
      } else {
        setAwayScoreBump(true);
        setTimeout(() => setAwayScoreBump(false), 800);
      }

      setIsMetadataUpdating(true);
      setTimeout(() => setIsMetadataUpdating(false), 1200);

      return {
        ...prev,
        match: {
          ...currentMatch,
          homeScore: nextHome,
          awayScore: nextAway,
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const simulateSceneChange = () => {
    const scenes = ['Jogo Ao Vivo + Placar', 'Intervalo - Destaques', '2º Tempo', 'Match Point'];
    setData((prev) => {
      if (!prev) return prev;
      const currentMatch = prev.match || {
        id: 'sim-match',
        homeTeam: 'Time Casa',
        awayTeam: 'Time Visitante',
        homeScore: 8,
        awayScore: 5,
        isLive: true,
        activeScene: 'Jogo Ao Vivo + Placar',
        courtNumber: 1,
      };

      const nextIdx = (scenes.indexOf(currentMatch.activeScene) + 1) % scenes.length;
      setActiveSceneMorph(true);
      setTimeout(() => setActiveSceneMorph(false), 600);
      setIsMetadataUpdating(true);
      setTimeout(() => setIsMetadataUpdating(false), 1200);

      return {
        ...prev,
        match: {
          ...currentMatch,
          activeScene: scenes[nextIdx],
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const nextSponsorManually = () => {
    setSponsorAnimationState('exiting');
    setTimeout(() => {
      setCurrentSponsorIndex((prev) => (prev + 1) % sponsorsCount);
      setSponsorAnimationState('entering');
      setTimeout(() => setSponsorAnimationState('visible'), 500);
    }, 250);
  };

  const arenaName = data?.arena?.name || 'Arena Esportiva';
  const courtName = data?.court?.name || 'Quadra Principal';
  const logoUrl = data?.arena?.logoUrl;
  const overlayText = data?.arena?.overlayText || 'AO VIVO • SPORTS REVIEW';

  // Metadados da partida
  const match = data?.match || {
    id: 'default-match',
    homeTeam: 'Paranaguá FC',
    awayTeam: 'Litoral United',
    homeScore: 3,
    awayScore: 2,
    isLive: true,
    activeScene: 'Jogo Ao Vivo + Placar',
    courtNumber: 1,
  };

  return (
    <div
      id="obsBrowserSourceOverlay"
      className="w-screen h-screen bg-transparent select-none overflow-hidden relative font-sans text-slate-100 pointer-events-none"
      style={{ minWidth: '1920px', minHeight: '1080px' }}
    >
      {/* ========================================================================= */}
      {/* CANTO SUPERIOR ESQUERDO: BRANDING DA ARENA & SCOREBUG DE METADADOS        */}
      {/* ========================================================================= */}
      <div className="absolute top-7 left-10 flex flex-col gap-3">
        {/* LINHA 1: SCOREBUG BROADCAST COM METADADOS DO JOGO */}
        <div
          id="matchMetadataDisplay"
          className={`relative overflow-hidden flex items-stretch rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isMetadataUpdating ? 'border-orange-500/80 shadow-[0_0_30px_rgba(249,115,22,0.35)] animate-meta-flash' : ''
          }`}
        >
          {/* Brilho broadcast horizontal que varre o scorebug em atualizações */}
          {isMetadataUpdating && (
            <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-broadcast-sheen" />
          )}

          {/* Logo da Arena ou Marca */}
          <div className="w-14 bg-slate-900/90 border-r border-slate-800 flex items-center justify-center p-2 shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={arenaName}
                className="w-full h-full object-contain filter drop-shadow"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-inner">
                SR
              </div>
            )}
          </div>

          {/* Nome da Arena & Quadra (Compacto e Elegante) */}
          <div className="px-3.5 py-2 flex flex-col justify-center border-r border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs tracking-wider text-white uppercase font-['Sora'] drop-shadow-sm truncate max-w-[140px]">
                {arenaName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <span className="inline-flex items-center text-orange-400 font-bold">
                {courtName}
              </span>
            </div>
          </div>

          {/* Placar de Metadados da Partida (Home Team, Scores, Away Team) */}
          <div className="flex items-center px-4 py-1.5 gap-3 bg-slate-950/60">
            {/* Status Ao Vivo / Radar */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>AO VIVO</span>
            </div>

            {/* Time Casa */}
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100 drop-shadow transition-all duration-500 ease-out max-w-[120px] truncate">
                {match.homeTeam}
              </span>
            </div>

            {/* Caixa de Dígitos do Placar com Transição Burst de Animação CSS */}
            <div className="flex items-center gap-1.5 mx-1 font-mono">
              {/* Pontuação Time Casa */}
              <div
                id="homeScoreDigit"
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-base transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  homeScoreBump
                    ? 'scale-125 bg-orange-500 text-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.9)] animate-score-burst font-extrabold'
                    : 'bg-slate-900 border border-slate-700/80 text-orange-400 shadow-inner'
                }`}
              >
                <span className="transition-transform duration-300 transform">
                  {match.homeScore}
                </span>
              </div>

              {/* Separador */}
              <span className="text-slate-600 font-bold text-xs select-none">
                :
              </span>

              {/* Pontuação Time Visitante */}
              <div
                id="awayScoreDigit"
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-base transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  awayScoreBump
                    ? 'scale-125 bg-orange-500 text-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.9)] animate-score-burst font-extrabold'
                    : 'bg-slate-900 border border-slate-700/80 text-orange-400 shadow-inner'
                }`}
              >
                <span className="transition-transform duration-300 transform">
                  {match.awayScore}
                </span>
              </div>
            </div>

            {/* Time Visitante */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100 drop-shadow transition-all duration-500 ease-out max-w-[120px] truncate">
                {match.awayTeam}
              </span>
              <span className="w-1.5 h-6 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50" />
            </div>

            {/* Cena Ativa / Período da Partida (com Morph de Transição CSS) */}
            <div
              className={`ml-2 px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all duration-500 ease-out ${
                activeSceneMorph
                  ? 'scale-105 bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              {match.activeScene}
            </div>

            {/* Cronômetro do Jogo */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs font-semibold text-slate-200">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>{formatGameClock(gameElapsedSeconds)}</span>
            </div>
          </div>
        </div>

        {/* LINHA 2: BADGE DISCRETO DE GRAVAÇÃO REC & CLOUD SYNC */}
        <div className="flex items-center gap-2.5">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase">
              REC / REPLAY 30s
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] font-mono text-slate-400">{currentTime}</span>
          </div>

          <div className="bg-slate-950/70 backdrop-blur-md border border-slate-800/80 px-2.5 py-1.5 rounded-xl text-[10px] font-mono text-orange-300/90 flex items-center gap-1.5 shadow-lg">
            <Zap className="w-3 h-3 text-orange-400" />
            <span>{overlayText}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CANTO SUPERIOR DIREITO: WATERMARK TECNOLÓGICO EDGE                        */}
      {/* ========================================================================= */}
      <div className="absolute top-7 right-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl text-slate-300 text-xs font-mono shadow-2xl">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[11px] font-bold text-slate-200">1080p 60FPS</span>
        <span className="text-slate-600">|</span>
        <span className="text-[11px] text-slate-400">Cloudflare Edge R2</span>
        <span className="text-slate-600">|</span>
        <span className="text-[11px] text-orange-400 font-bold">N100 ACCEL</span>
      </div>

      {/* ========================================================================= */}
      {/* CANTO INFERIOR: ALAMBRADO QR CODE & CARROSSEL DE PATROCINADORES COM CSS    */}
      {/* ========================================================================= */}
      <div className="absolute bottom-8 inset-x-12 flex items-end justify-between pointer-events-none">
        {/* ESQUERDA INFERIOR: CHAMADA PARA QR CODE */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>Reveja seus lances no celular</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 font-mono font-bold">
                INSTANTÂNEO
              </span>
            </p>
            <p className="text-[11px] text-slate-400">
              Escaneie o QR Code fixado no alambrado desta quadra
            </p>
          </div>
        </div>

        {/* DIREITA INFERIOR: CARROSSEL DE PATROCINADORES COM TRANSIÇÃO CSS BROADCAST */}
        <div
          id="sponsorCarouselContainer"
          className="relative overflow-hidden bg-slate-950/90 backdrop-blur-md border border-slate-700/90 rounded-2xl shadow-2xl p-3 min-w-[340px] max-w-[420px] flex flex-col gap-2 transition-all duration-500"
        >
          {/* Brilho broadcast no carrossel durante a troca de patrocinador */}
          {sponsorAnimationState === 'entering' && (
            <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-broadcast-sheen" />
          )}

          {/* Cabeçalho do Card de Patrocínio */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 font-['Sora']">
                {hasCustomSponsors ? 'Patrocínio Oficial' : 'Parceiro da Transmissão'}
              </span>
            </div>

            {/* Indicadores de Passo de Patrocinador */}
            <div className="flex items-center gap-1">
              {Array.from({ length: sponsorsCount }).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                    idx === currentSponsorIndex % sponsorsCount
                      ? 'w-5 bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm shadow-orange-500/50'
                      : 'w-1.5 bg-slate-700/80'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Slot de Exibição do Patrocinador com Transição CSS Suave */}
          <div className="relative h-12 flex items-center justify-center overflow-hidden">
            {hasCustomSponsors ? (
              // Modo Patrocinador com Imagem/URL customizada
              <div
                key={currentSponsorIndex}
                className={`w-full h-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  sponsorAnimationState === 'exiting'
                    ? 'opacity-0 -translate-x-6 scale-95 blur-sm'
                    : sponsorAnimationState === 'entering'
                    ? 'opacity-0 translate-x-6 scale-95 blur-sm'
                    : 'opacity-100 translate-x-0 scale-100 blur-0 animate-sponsor-wipe'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rawSponsors[currentSponsorIndex % rawSponsors.length]}
                  alt={`Patrocinador ${currentSponsorIndex + 1}`}
                  className="max-h-10 max-w-[280px] object-contain filter drop-shadow-md transition-transform duration-500 hover:scale-105"
                />
              </div>
            ) : (
              // Modo Patrocinadores Tecnológicos Estilizados (Fallback broadcast de alta fidelidade)
              (() => {
                const sp = DEFAULT_BROADCAST_SPONSORS[currentSponsorIndex % DEFAULT_BROADCAST_SPONSORS.length];
                return (
                  <div
                    key={currentSponsorIndex}
                    className={`w-full flex items-center justify-between gap-3 px-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      sponsorAnimationState === 'exiting'
                        ? 'opacity-0 -translate-x-6 scale-95 blur-sm'
                        : sponsorAnimationState === 'entering'
                        ? 'opacity-0 translate-x-6 scale-95 blur-sm'
                        : 'opacity-100 translate-x-0 scale-100 blur-0 animate-sponsor-wipe'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sp.accentColor} flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-lg shadow-orange-500/20 shrink-0 border border-white/20`}
                      >
                        {sp.logoText}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-white tracking-wider font-['Sora']">
                            {sp.name}
                          </h4>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                            {sp.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[230px]">
                          {sp.tagline}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Barra de Progresso Contínua com Transição CSS do Próximo Ciclo */}
          <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 shadow-sm transition-[width] duration-75 ease-linear"
              style={{ width: `${sponsorProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DOCK INTERATIVO DISCRETO PARA TESTES (Visível ao passar o mouse em preview) */}
      {/* ========================================================================= */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-auto opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-50">
        <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 text-xs">
          <span className="text-[11px] font-mono text-orange-400 font-bold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Controle de Testes do Overlay:
          </span>
          <button
            type="button"
            onClick={() => simulateGoal('home')}
            className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 border border-orange-500/40 font-semibold transition-colors cursor-pointer"
          >
            +1 Gol Casa
          </button>
          <button
            type="button"
            onClick={() => simulateGoal('away')}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/40 font-semibold transition-colors cursor-pointer"
          >
            +1 Gol Visitante
          </button>
          <button
            type="button"
            onClick={simulateSceneChange}
            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/40 font-semibold transition-colors cursor-pointer"
          >
            Trocar Cena
          </button>
          <button
            type="button"
            onClick={nextSponsorManually}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold transition-colors cursor-pointer flex items-center gap-1"
          >
            Próximo Patrocinador
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
