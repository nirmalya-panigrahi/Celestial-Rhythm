import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {soundEngine} from '../audio/soundEngine';
import type {BreathCadence, BreathPhaseLabel} from '../types/astral';
import {computeBreathSnapshot} from '../utils/breathEngine';

export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed';

export interface ActiveSessionConfig {
  sessionId: string;
  label: string;
  durationSec: number;
  frequencyHz: number;
  cadence: BreathCadence;
}

export function useBreathSession() {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [config, setConfig] = useState<ActiveSessionConfig | null>(null);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.55);

  const lastPhaseRef = useRef<BreathPhaseLabel | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const snapshot = useMemo(() => {
    if (!config) return null;
    return computeBreathSnapshot(elapsedSec, config.cadence);
  }, [config, elapsedSec]);

  useEffect(() => {
    if (status !== 'active' || !config) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = lastTickRef.current !== null ? (now - lastTickRef.current) / 1000 : 0.1;
      lastTickRef.current = now;

      setElapsedSec((prev) => {
        const next = prev + dt;
        if (next >= config.durationSec) {
          soundEngine.stopDrone();
          setStatus('completed');
          return config.durationSec;
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [status, config]);

  useEffect(() => {
    if (status !== 'active' || !config || !snapshot) return;
    if (lastPhaseRef.current !== snapshot.phase) {
      lastPhaseRef.current = snapshot.phase;
      void soundEngine.triggerPhaseChime(snapshot.phase, config.frequencyHz);
    }
  }, [status, config, snapshot]);

  const startSession = useCallback(async (nextConfig: ActiveSessionConfig) => {
    lastPhaseRef.current = nextConfig.cadence.steps[0]?.phase ?? 'Inhale';
    setConfig(nextConfig);
    setElapsedSec(0);
    setStatus('active');
    await soundEngine.startDrone(nextConfig.frequencyHz);
    await soundEngine.triggerPhaseChime(lastPhaseRef.current, nextConfig.frequencyHz);
  }, []);

  const pauseSession = useCallback(() => {
    setStatus('paused');
    soundEngine.stopDrone();
  }, []);

  const resumeSession = useCallback(async () => {
    if (!config) return;
    setStatus('active');
    await soundEngine.startDrone(config.frequencyHz);
  }, [config]);

  const stopSession = useCallback(() => {
    setStatus('idle');
    setElapsedSec(0);
    lastPhaseRef.current = null;
    soundEngine.stopDrone();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    soundEngine.setVolume(clamped);
  }, []);

  useEffect(() => {
    return () => {
      soundEngine.stopDrone();
    };
  }, []);

  const remainingSec = config ? Math.max(0, Math.ceil(config.durationSec - elapsedSec)) : 0;

  return {
    status,
    config,
    elapsedSec,
    remainingSec,
    snapshot,
    isMuted,
    volume,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    toggleMute,
    setVolume,
  };
}
