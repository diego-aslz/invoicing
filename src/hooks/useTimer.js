import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'invoicing_active_timer';

export function useTimer() {
  const [timerState, setTimerState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return { isRunning: false, startTimestamp: null, accumulatedSeconds: 0 };
  });

  const [currentSeconds, setCurrentSeconds] = useState(timerState.accumulatedSeconds);

  // Sync currentSeconds based on startTimestamp
  useEffect(() => {
    let interval;
    if (timerState.isRunning && timerState.startTimestamp) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerState.startTimestamp) / 1000);
        setCurrentSeconds(timerState.accumulatedSeconds + elapsed);
      }, 1000);
    } else {
      setCurrentSeconds(timerState.accumulatedSeconds);
    }
    return () => clearInterval(interval);
  }, [timerState]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState));
  }, [timerState]);

  const startTimer = useCallback(() => {
    if (!timerState.isRunning) {
      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        startTimestamp: Date.now(),
      }));
    }
  }, [timerState.isRunning]);

  const pauseTimer = useCallback(() => {
    if (timerState.isRunning) {
      const elapsed = Math.floor((Date.now() - timerState.startTimestamp) / 1000);
      setTimerState(prev => ({
        isRunning: false,
        startTimestamp: null,
        accumulatedSeconds: prev.accumulatedSeconds + elapsed,
      }));
    }
  }, [timerState.isRunning, timerState.startTimestamp]);

  const resetTimer = useCallback(() => {
    setTimerState({ isRunning: false, startTimestamp: null, accumulatedSeconds: 0 });
    setCurrentSeconds(0);
  }, []);

  // Compute decimal hours from current seconds
  const decimalHours = currentSeconds / 3600;

  // Update document title when timer is running
  const originalTitleRef = useRef(document.title);
  useEffect(() => {
    if (timerState.isRunning) {
      const h = Math.floor(currentSeconds / 3600);
      const m = Math.floor((currentSeconds % 3600) / 60);
      const s = currentSeconds % 60;
      const hhmmss = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      document.title = `▶ ${hhmmss} | Invoicing`;
    } else {
      document.title = originalTitleRef.current || 'Invoicing';
    }
    
    // Cleanup on unmount
    return () => {
      document.title = originalTitleRef.current || 'Invoicing';
    };
  }, [timerState.isRunning, currentSeconds]);

  return {
    isRunning: timerState.isRunning,
    currentSeconds,
    decimalHours,
    startTimer,
    pauseTimer,
    resetTimer,
  };
}
