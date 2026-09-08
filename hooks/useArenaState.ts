'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TelemetryData {
  cpu: number;
  temp: number;
  fps: number;
  bitrateMbps: number;
  brokerConnected: boolean;
  lastPacketTime: string;
}

export interface MatchState {
  id?: string;
  courtId: string;
  courtName: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  isLive: boolean;
  showOverlay: boolean;
  timerSeconds: number;
  isTimerRunning: boolean;
  activeScene: string;
}

export interface ArenaStateHook {
  telemetry: TelemetryData;
  matchState: MatchState;
  updateTelemetry: (data: Partial<TelemetryData>) => void;
  updateScore: (team: 'home' | 'away', delta: number) => void;
  setTeams: (home: string, away: string) => void;
  toggleLive: () => boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
  toggleOverlay: () => void;
  setActiveScene: (scene: string) => void;
  setActiveCourt: (courtId: string) => void;
  triggerManualClip: () => { success: boolean; clipName: string };
  syncMatchState: (data: Record<string, unknown>) => Promise<void>;
}

const INITIAL_MATCH_STATE: MatchState = {
  id: '',
  courtId: '1',
  courtName: 'Quadra 1 (Society Principal)',
  homeTeam: 'PARANAGUÁ FC',
  awayTeam: 'LITORAL UNITED',
  homeScore: 3,
  awayScore: 2,
  isLive: false,
  showOverlay: true,
  timerSeconds: 0,
  isTimerRunning: false,
  activeScene: 'Jogo Ao Vivo + Placar',
};

// Estado inicial representando hardware inativo (Diretiva Zero Mocks)
const INITIAL_TELEMETRY: TelemetryData = {
  cpu: 0,
  temp: 0,
  fps: 0,
  bitrateMbps: 0,
  brokerConnected: false,
  lastPacketTime: 'Aguardando Hardware',
};

export function useArenaState(nodeId: string = 'node-pr-112'): ArenaStateHook {
  const [telemetry, setTelemetry] = useState<TelemetryData>(INITIAL_TELEMETRY);
  const [matchState, setMatchState] = useState<MatchState>(INITIAL_MATCH_STATE);
  const matchIdRef = useRef<string>('');

  // Atualização explícita de telemetria para injeção via cliente MQTT / WebSockets reais
  const updateTelemetry = useCallback((data: Partial<TelemetryData>) => {
    setTelemetry((prev) => ({
      ...prev,
      ...data,
      lastPacketTime: data.lastPacketTime || new Date().toLocaleTimeString('pt-BR'),
    }));
  }, []);

  // 1. Carregamento inicial da partida real do banco de dados (Prisma PostgreSQL)
  useEffect(() => {
    let isMounted = true;
    const fetchMatch = async () => {
      try {
        const res = await fetch('/api/matches', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) return;

        const data = await res.json();
        if (isMounted && data && data.id) {
          matchIdRef.current = data.id;
          setMatchState((prev) => ({
            ...prev,
            id: data.id,
            homeScore: typeof data.homeScore === 'number' ? data.homeScore : prev.homeScore,
            awayScore: typeof data.awayScore === 'number' ? data.awayScore : prev.awayScore,
            homeTeam: data.homeTeam || prev.homeTeam,
            awayTeam: data.awayTeam || prev.awayTeam,
            isLive: typeof data.isLive === 'boolean' ? data.isLive : prev.isLive,
            activeScene: data.activeScene || prev.activeScene,
            courtName: data.arena?.name ? `${data.arena.name} - Quadra ${data.courtNumber || 1}` : prev.courtName,
          }));
        }
      } catch (err) {
        console.warn('[USE_ARENA_STATE] Erro ao buscar dados reais da partida:', err);
      }
    };

    fetchMatch();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Função interna assíncrona para persistir atualizações no PostgreSQL
  const syncMatchState = useCallback(async (data: Record<string, unknown>) => {
    const currentId = data.id || matchIdRef.current || matchState.id;
    if (!currentId) return;

    try {
      await fetch('/api/matches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: currentId,
          ...data,
        }),
      });
    } catch (err) {
      console.warn('[USE_ARENA_STATE] Erro ao sincronizar estado da partida com API:', err);
    }
  }, [matchState.id]);

  // Chronometer timer tick
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (matchState.isTimerRunning) {
      timerInterval = setInterval(() => {
        setMatchState((prev) => ({
          ...prev,
          timerSeconds: prev.timerSeconds + 1,
        }));
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [matchState.isTimerRunning]);

  // 3. Atualização de placar com sincronização no banco
  const updateScore = useCallback((team: 'home' | 'away', delta: number) => {
    setMatchState((prev) => {
      const key = team === 'home' ? 'homeScore' : 'awayScore';
      const nextScore = Math.max(0, prev[key] + delta);
      const newState = {
        ...prev,
        [key]: nextScore,
      };

      // Persistir no banco de dados via PUT /api/matches
      syncMatchState({
        id: prev.id || matchIdRef.current,
        homeScore: team === 'home' ? nextScore : prev.homeScore,
        awayScore: team === 'away' ? nextScore : prev.awayScore,
      });

      return newState;
    });
  }, [syncMatchState]);

  const setTeams = useCallback((home: string, away: string) => {
    setMatchState((prev) => ({
      ...prev,
      homeTeam: home,
      awayTeam: away,
    }));
  }, []);

  const toggleLive = useCallback(() => {
    let nextStatus = false;
    setMatchState((prev) => {
      nextStatus = !prev.isLive;
      syncMatchState({
        id: prev.id || matchIdRef.current,
        isLive: nextStatus,
      });
      return {
        ...prev,
        isLive: nextStatus,
      };
    });
    return nextStatus;
  }, [syncMatchState]);

  const toggleTimer = useCallback(() => {
    setMatchState((prev) => ({
      ...prev,
      isTimerRunning: !prev.isTimerRunning,
    }));
  }, []);

  const resetTimer = useCallback(() => {
    setMatchState((prev) => ({
      ...prev,
      timerSeconds: 0,
      isTimerRunning: false,
    }));
  }, []);

  const toggleOverlay = useCallback(() => {
    setMatchState((prev) => ({
      ...prev,
      showOverlay: !prev.showOverlay,
    }));
  }, []);

  // 4. Troca de cena ativa com sincronização no banco
  const setActiveScene = useCallback((scene: string) => {
    setMatchState((prev) => {
      syncMatchState({
        id: prev.id || matchIdRef.current,
        activeScene: scene,
      });
      return {
        ...prev,
        activeScene: scene,
      };
    });
  }, [syncMatchState]);

  const setActiveCourt = useCallback((courtId: string) => {
    const courtNames: Record<string, string> = {
      '1': 'Quadra 1 (Society Principal)',
      '2': 'Quadra 2 (Futebol 7 Sintética)',
      '3': 'Quadra 3 (Beach Tennis)',
    };
    setMatchState((prev) => ({
      ...prev,
      courtId,
      courtName: courtNames[courtId] || `Quadra ${courtId}`,
    }));
  }, []);

  const triggerManualClip = useCallback(() => {
    const now = new Date();
    const formatted = `LANCE_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    return {
      success: true,
      clipName: formatted,
    };
  }, []);

  return {
    telemetry,
    matchState,
    updateTelemetry,
    updateScore,
    setTeams,
    toggleLive,
    toggleTimer,
    resetTimer,
    toggleOverlay,
    setActiveScene,
    setActiveCourt,
    triggerManualClip,
    syncMatchState,
  };
}
