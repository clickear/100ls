import { useRef, useState, useCallback, useEffect } from 'react';
import type { PlayerData, PlayerState, PlaybackSpeed, SubtitleMode, TabId, Sentence } from '../types/player';

const SPEEDS: PlaybackSpeed[] = ['0.5x', '0.75x', '1.0x', '1.25x', '1.5x'];
const SPEED_VALUES: Record<PlaybackSpeed, number> = {
  '0.5x': 0.5, '0.75x': 0.75, '1.0x': 1.0, '1.25x': 1.25, '1.5x': 1.5,
};

export interface UsePlayerReturn {
  videoRef: React.RefCallback<HTMLVideoElement>;
  state: PlayerState;
  currentSentence: Sentence | null;

  togglePlayPause: () => void;
  seek: (time: number) => void;
  replay: () => void;
  cycleSpeed: () => void;
  setPointA: () => void;
  setPointB: () => void;
  toggleABLoop: () => void;
  goToPrevSentence: () => void;
  goToNextSentence: () => void;
  goToSentence: (index: number) => void;
  toggleLoopSentence: () => void;
  toggleKeySentence: () => void;
  setSubtitleMode: (mode: SubtitleMode) => void;
  setActiveTab: (tab: TabId) => void;
  selectEpisode: (ep: number) => void;
}

export function usePlayer(data: PlayerData | null): UsePlayerReturn {
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentSpeed: '1.0x',
    currentSentenceIndex: 0,
    subtitleMode: 'bilingual',
    isLoopSentence: false,
    activeTab: 'player',
    currentTime: 0,
    abLoop: { active: false, startTime: 0, endTime: 0 },
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Init AB loop from data
  useEffect(() => {
    if (data?.abLoop) {
      setState(prev => ({ ...prev, abLoop: { ...data.abLoop } }));
    }
  }, [data]);

  // Ref callback — binds event listeners when video element mounts
  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    // Cleanup old element
    const old = videoElRef.current;
    if (old) {
      old.removeEventListener('timeupdate', handleTimeUpdate);
      old.removeEventListener('play', handlePlay);
      old.removeEventListener('pause', handlePause);
      old.removeEventListener('ended', handleEnded);
    }

    videoElRef.current = el;

    // Bind new element
    if (el) {
      el.addEventListener('timeupdate', handleTimeUpdate);
      el.addEventListener('play', handlePlay);
      el.addEventListener('pause', handlePause);
      el.addEventListener('ended', handleEnded);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTimeUpdate() {
    const video = videoElRef.current;
    if (!video) return;
    const ct = video.currentTime;
    const d = dataRef.current;
    const s = stateRef.current;

    let newSentenceIdx = s.currentSentenceIndex;

    // Auto-track sentence
    if (d) {
      const idx = d.sentences.findIndex(
        (sen) => ct >= sen.startTime && ct < sen.endTime
      );
      if (idx !== -1) newSentenceIdx = idx;
    }

    // AB Loop enforcement
    if (s.abLoop.active && s.abLoop.endTime > s.abLoop.startTime && ct >= s.abLoop.endTime) {
      video.currentTime = s.abLoop.startTime;
      setState(prev => ({ ...prev, currentTime: s.abLoop.startTime, currentSentenceIndex: newSentenceIdx }));
      return;
    }

    // Sentence loop enforcement
    if (s.isLoopSentence && d) {
      const sentence = d.sentences[s.currentSentenceIndex];
      if (sentence && ct >= sentence.endTime) {
        video.currentTime = sentence.startTime;
        setState(prev => ({ ...prev, currentTime: sentence.startTime }));
        return;
      }
    }

    setState(prev => ({
      ...prev,
      currentTime: ct,
      currentSentenceIndex: newSentenceIdx,
    }));
  }

  function handlePlay() {
    setState(prev => ({ ...prev, isPlaying: true }));
  }

  function handlePause() {
    setState(prev => ({ ...prev, isPlaying: false }));
  }

  function handleEnded() {
    setState(prev => ({ ...prev, isPlaying: false }));
  }

  // --- Controls ---
  const togglePlayPause = useCallback(() => {
    const video = videoElRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => { /* browser may block autoplay */ });
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoElRef.current;
    if (!video) return;
    video.currentTime = time;
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  const replay = useCallback(() => {
    const video = videoElRef.current;
    const d = dataRef.current;
    const s = stateRef.current;
    if (!video) return;

    if (s.abLoop.active && s.abLoop.startTime < s.abLoop.endTime) {
      video.currentTime = s.abLoop.startTime;
    } else if (d) {
      const sentence = d.sentences[s.currentSentenceIndex];
      if (sentence) video.currentTime = sentence.startTime;
    }
    video.play().catch(() => {});
  }, []);

  const cycleSpeed = useCallback(() => {
    setState(prev => {
      const idx = SPEEDS.indexOf(prev.currentSpeed);
      const next = SPEEDS[(idx + 1) % SPEEDS.length];
      if (videoElRef.current) videoElRef.current.playbackRate = SPEED_VALUES[next];
      return { ...prev, currentSpeed: next };
    });
  }, []);

  const setPointA = useCallback(() => {
    const video = videoElRef.current;
    if (!video) return;
    setState(prev => ({
      ...prev,
      abLoop: { ...prev.abLoop, startTime: video.currentTime, active: true },
    }));
  }, []);

  const setPointB = useCallback(() => {
    const video = videoElRef.current;
    if (!video) return;
    setState(prev => ({
      ...prev,
      abLoop: { ...prev.abLoop, endTime: video.currentTime, active: true },
    }));
  }, []);

  const toggleABLoop = useCallback(() => {
    setState(prev => ({
      ...prev,
      abLoop: { ...prev.abLoop, active: !prev.abLoop.active },
    }));
  }, []);

  const goToSentence = useCallback((index: number) => {
    const d = dataRef.current;
    if (!d) return;
    const sentence = d.sentences[index];
    if (!sentence) return;
    if (videoElRef.current) videoElRef.current.currentTime = sentence.startTime;
    setState(prev => ({ ...prev, currentSentenceIndex: index, currentTime: sentence.startTime }));
  }, []);

  const goToPrevSentence = useCallback(() => {
    setState(prev => {
      if (prev.currentSentenceIndex <= 0) return prev;
      const newIdx = prev.currentSentenceIndex - 1;
      const d = dataRef.current;
      if (d) {
        const sentence = d.sentences[newIdx];
        if (sentence && videoElRef.current) videoElRef.current.currentTime = sentence.startTime;
      }
      return { ...prev, currentSentenceIndex: newIdx };
    });
  }, []);

  const goToNextSentence = useCallback(() => {
    setState(prev => {
      const d = dataRef.current;
      if (!d || prev.currentSentenceIndex >= d.sentences.length - 1) return prev;
      const newIdx = prev.currentSentenceIndex + 1;
      const sentence = d.sentences[newIdx];
      if (sentence && videoElRef.current) videoElRef.current.currentTime = sentence.startTime;
      return { ...prev, currentSentenceIndex: newIdx };
    });
  }, []);

  const toggleLoopSentence = useCallback(() => {
    setState(prev => ({ ...prev, isLoopSentence: !prev.isLoopSentence }));
  }, []);

  const toggleKeySentence = useCallback(() => {
    const d = dataRef.current;
    const s = stateRef.current;
    if (!d) return;
    d.sentences[s.currentSentenceIndex].isKey = !d.sentences[s.currentSentenceIndex].isKey;
    setState(prev => ({ ...prev }));
  }, []);

  const setSubtitleMode = useCallback((mode: SubtitleMode) => {
    setState(prev => ({ ...prev, subtitleMode: mode }));
  }, []);

  const setActiveTab = useCallback((tab: TabId) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const selectEpisode = useCallback((_ep: number) => {}, []);

  const currentSentence = data ? data.sentences[state.currentSentenceIndex] ?? null : null;

  return {
    videoRef,
    state,
    currentSentence,
    togglePlayPause, seek, replay,
    cycleSpeed,
    setPointA, setPointB, toggleABLoop,
    goToPrevSentence, goToNextSentence, goToSentence, toggleLoopSentence, toggleKeySentence,
    setSubtitleMode,
    setActiveTab,
    selectEpisode,
  };
}
