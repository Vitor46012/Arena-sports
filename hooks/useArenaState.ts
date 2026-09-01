'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TelemetryData {
  cpu: number;
  temp: number;
  fps: number;
  bitrateMbps: number;
  brokerConnected: boolean;
  lastPacketTime: string;
}

export interface MatchState {
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
  updateScore: (team: 'home' | 'away', delta: number) => void;
  setTeams: (home: string, away: string) => void;
  toggleLive: () => boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
  toggleOverlay: () => void;
  setActiveScene: (scene: string) => void;
  setActiveCourt: (courtId: string) => void;
  triggerManualClip: () => { success: boolean; clipName: string };
}

const INITIAL_MATCH_STATE: MatchState = {
  courtId: '1',
  courtName: 'Quadra 1 (Society Principal)',
  homeTeam: 'PARANAGUÁ FC',
  awayTeam: 'LITORAL UNITED',
  homeScore: 3,
  awayScore: 2,
  isLive: false,
  showOverlay: true,
  timerSeconds: 1420, // 23:40
  isTimerRunning: false,
  activeScene: 'Jogo Ao Vivo + Placar',
};

export function useArenaState(nodeId: string = 'node-pr-112'): ArenaStateHook {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    cpu: 34,
    temp: 51,
    fps: 60,
    bitrateMbps: 8.4,
    brokerConnected: true,
    lastPacketTime: 'Agora mesmo',
  });

  const [matchState, setMatchState] = useState<MatchState>(INITIAL_MATCH_STATE);

  // Simulated MQTT telemetry stream every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const cpuVariation = Math.floor(Math.random() * 18 + 28);
        const tempVariation = Math.floor(Math.random() * 6 + 48);
        const fpsVariation = Math.random() > 0.92 ? 59.4 : 60.0;
        const bitrateVariation = Number((Math.random() * 0.6 + 8.1).toFixed(2));
        const timestamp = new Date().toLocaleTimeString('pt-BR');

        return {
          ...prev,
          cpu: cpuVariation,
          temp: tempVariation,
          fps: fpsVariation,
          bitrateMbps: bitrateVariation,
          lastPacketTime: timestamp,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [nodeId]);

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

  const updateScore = useCallback((team: 'home' | 'away', delta: number) => {
    setMatchState((prev) => {
      const key = team === 'home' ? 'homeScore' : 'awayScore';
      const nextScore = Math.max(0, prev[key] + delta);
      return {
        ...prev,
        [key]: nextScore,
      };
    });
  }, []);

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
      return {
        ...prev,
        isLive: nextStatus,
      };
    });
    return nextStatus;
  }, []);

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

  const setActiveScene = useCallback((scene: string) => {
    setMatchState((prev) => ({
      ...prev,
      activeScene: scene,
    }));
  }, []);

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
    updateScore,
    setTeams,
    toggleLive,
    toggleTimer,
    resetTimer,
    toggleOverlay,
    setActiveScene,
    setActiveCourt,
    triggerManualClip,
  };
}
