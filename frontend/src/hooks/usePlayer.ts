import { useRef, useState, useCallback, useEffect } from 'react';
import type { PlayerData, PlayerState, PlaybackSpeed, SubtitleMode, TabId, Sentence } from '../types/player';
import { updateSentenceStatus, updateVideoProgress, updatePatternMastery } from '../api/player';

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
  toggleAudioMode: () => void;
  toggleLoop: () => void;
  setSubtitleMode: (mode: SubtitleMode) => void;
  setActiveTab: (tab: TabId) => void;
  selectEpisode: (ep: number) => void;
  setStage: (stage: number) => void;
  incrementRepetition: () => void;
  toggleShadowingMode: () => void;
  setVolume: (val: number) => void;
}

export function usePlayer(data: PlayerData | null, onXpGain?: (amount: number) => void): UsePlayerReturn {
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const [state, setState] = useState<PlayerState>({
    isPlaying: true,
    currentSpeed: '1.0x',
    currentSentenceIndex: 0,
    subtitleMode: 'bilingual',
    isLoopSentence: false,
    activeTab: data ? 'player' : 'subtitles',
    currentTime: 0,
    abLoop: { active: false, startTime: 0, endTime: 0 },
    currentStage: 1,
    repetitionCount: 0,
    isAudioMode: false,
    isLooping: true,
    shadowingMode: false,
    isWaitingForShadowing: false,
    volume: 1.0,
  });

  const [hasInitialSeeked, setHasInitialSeeked] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  const currentSentence = data ? data.sentences[state.currentSentenceIndex] ?? null : null;

  // Automatically switch to player tab when a video is loaded and reset initial seek flag
  useEffect(() => {
    if (data) {
      if (state.activeTab === 'subtitles') {
        setState(prev => ({ ...prev, activeTab: 'player' }));
      }
      setHasInitialSeeked(false);
    }
  }, [data?.videoId]);

  // Init progress and state from data
  useEffect(() => {
    if (data) {
      setState(prev => ({
        ...prev,
        abLoop: { ...data.abLoop },
        currentStage: data.stageInfo.currentStage,
        repetitionCount: data.repetitionCount,
        // Auto set subtitle mode based on stage
        subtitleMode: data.stageInfo.currentStage === 1 ? 'bilingual' : 
                      data.stageInfo.currentStage === 2 ? 'pure-en' : 'none'
      }));
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

  // Persistence: Save position every 5s or on pause
  useEffect(() => {
    if (!data?.videoId) return;
    
    const saveProgress = async () => {
      try {
        await updateVideoProgress(data.videoId, { 
          lastPosition: stateRef.current.currentTime 
        });
      } catch (err) {
        console.error('Failed to save progress', err);
      }
    };

    if (!state.isPlaying && state.currentTime > 0) {
      saveProgress();
    }

    const interval = setInterval(() => {
      if (state.isPlaying) saveProgress();
    }, 5000);

    return () => clearInterval(interval);
  }, [state.isPlaying, data?.videoId]);

  // Initial Seek (Handles last position and URL parameter ?t=)
  useEffect(() => {
    if (videoElRef.current && !hasInitialSeeked && data) {
      const video = videoElRef.current;
      
      const performInitialSeek = () => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('t');
        let time = 0;
        
        if (t) {
          time = parseFloat(t);
        } else if (data.stageInfo.lastPosition) {
          time = data.stageInfo.lastPosition;
        }

        if (time > 0) {
          video.currentTime = time;
          setState(prev => ({ ...prev, currentTime: time }));
        }

        // Universal auto-play trigger
        video.play().catch((err) => {
          console.warn('Auto-play blocked by browser or failed:', err);
          setState(prev => ({ ...prev, isPlaying: false }));
        });
        
        setHasInitialSeeked(true);
      };

      if (video.readyState >= 1) { // 1 = HAVE_METADATA
        performInitialSeek();
      } else {
        video.addEventListener('loadedmetadata', performInitialSeek, { once: true });
      }
    }
  }, [data, hasInitialSeeked]);

  // Sync video time on mount (useful for tab switching)
  useEffect(() => {
    if (videoElRef.current) {
      videoElRef.current.currentTime = state.currentTime;
    }
  }, [videoElRef.current, state.activeTab]);

  function handleTimeUpdate() {
    const video = videoElRef.current;
    if (!video) return;
    const ct = video.currentTime;
    const d = dataRef.current;

    setState(prev => {
      let newSentenceIdx = prev.currentSentenceIndex;

      // Auto-track sentence
      if (d) {
        // Only track new sentence if NOT waiting for shadowing or if it's a significant move
        const idx = d.sentences.findIndex(
          (sen) => ct >= sen.startTime && ct < sen.endTime
        );
        if (idx !== -1) newSentenceIdx = idx;
      }

      // AB Loop enforcement
      if (prev.abLoop.active && prev.abLoop.endTime > prev.abLoop.startTime && ct >= prev.abLoop.endTime) {
        video.currentTime = prev.abLoop.startTime;
        return { ...prev, currentTime: prev.abLoop.startTime, currentSentenceIndex: newSentenceIdx };
      }

      // Sentence loop enforcement
      if (prev.isLoopSentence && d) {
        const sentence = d.sentences[prev.currentSentenceIndex];
        if (sentence && ct >= sentence.endTime) {
          video.currentTime = sentence.startTime;
          return { ...prev, currentTime: sentence.startTime };
        }
      }

      // Shadowing mode enforcement
      if (prev.shadowingMode && d) {
        const sentence = d.sentences[prev.currentSentenceIndex];
        // If we reached the end of the current sentence, pause and WAIT
        if (sentence && ct >= sentence.endTime - 0.05 && !prev.isWaitingForShadowing) {
          video.pause();
          return { ...prev, currentTime: ct, isPlaying: false, isWaitingForShadowing: true };
        }
      }

      // If we are waiting for shadowing, lock the index to the current one
      if (prev.isWaitingForShadowing) {
        return { ...prev, currentTime: ct };
      }

      return {
        ...prev,
        currentTime: ct,
        currentSentenceIndex: newSentenceIdx,
      };
    });
  }

  // Handle auto-resume for shadowing mode
  useEffect(() => {
    if (state.isWaitingForShadowing && state.shadowingMode && data) {
      const sentence = data.sentences[state.currentSentenceIndex];
      if (!sentence) return;

      const sentenceDuration = sentence.endTime - sentence.startTime;
      const pauseDuration = Math.max(2000, sentenceDuration * 1500); // 1.5x duration or min 2s

      const timer = setTimeout(() => {
        const video = videoElRef.current;
        if (video && stateRef.current.isWaitingForShadowing) {
          // Go to next sentence before playing
          const nextIdx = stateRef.current.currentSentenceIndex + 1;
          if (nextIdx < data.sentences.length) {
            const nextSentence = data.sentences[nextIdx];
            video.currentTime = nextSentence.startTime;
            setState(prev => ({ 
              ...prev, 
              currentSentenceIndex: nextIdx, 
              currentTime: nextSentence.startTime,
              isWaitingForShadowing: false,
              isPlaying: true 
            }));
            video.play().catch(() => {});
          } else {
            setState(prev => ({ ...prev, isWaitingForShadowing: false }));
          }
        }
      }, pauseDuration);

      return () => clearTimeout(timer);
    }
  }, [state.isWaitingForShadowing, state.shadowingMode, state.currentSentenceIndex, data]);

  function handlePlay() {
    setState(prev => ({ ...prev, isPlaying: true }));
  }

  function handlePause() {
    setState(prev => ({ ...prev, isPlaying: false }));
  }

  function handleEnded() {
    const video = videoElRef.current;
    if (!video) return;

    // Automatic check-in logic
    incrementRepetition();

    if (stateRef.current.isLooping) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }

  // --- Controls ---
  const togglePlayPause = useCallback(() => {
    const video = videoElRef.current;
    if (!video) return;

    if (video.paused) {
      const s = stateRef.current;
      const d = dataRef.current;
      
      // If was waiting for shadowing, advance to next sentence manually
      if (s.isWaitingForShadowing && d) {
        const nextIdx = s.currentSentenceIndex + 1;
        if (nextIdx < d.sentences.length) {
          const nextSentence = d.sentences[nextIdx];
          video.currentTime = nextSentence.startTime;
          setState(prev => ({ 
            ...prev, 
            currentSentenceIndex: nextIdx, 
            currentTime: nextSentence.startTime,
            isWaitingForShadowing: false,
            isPlaying: true 
          }));
        } else {
          setState(prev => ({ ...prev, isWaitingForShadowing: false }));
        }
      } else {
        setState(prev => ({ ...prev, isWaitingForShadowing: false }));
      }
      
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoElRef.current;
    if (video) {
      video.currentTime = time;
      video.play().catch(() => {});
    }
    setState(prev => ({ ...prev, currentTime: time, isPlaying: true }));
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
    setState(prev => {
      const isEnabling = !prev.isLoopSentence;
      // Award small XP when starting to loop a sentence (intensive study)
      if (isEnabling && currentSentence?.patterns) {
        currentSentence.patterns.forEach(p => {
          updatePatternMastery(p.patternId, 2).catch(() => {});
        });
        onXpGain?.(currentSentence.patterns.length * 2);
      }
      return { ...prev, isLoopSentence: isEnabling };
    });
  }, [currentSentence]);

  const toggleKeySentence = useCallback(() => {
    const d = dataRef.current;
    const s = stateRef.current;
    if (!d) return;
    
    const sentence = d.sentences[s.currentSentenceIndex];
    const newStatus = !sentence.isKey;
    sentence.isKey = newStatus;
    
    // Update UI immediately
    setState(prev => ({ ...prev }));
    
    // Persist to backend asynchronously
    updateSentenceStatus(d.videoId, sentence.id, { isKey: newStatus }).catch(err => {
      console.error('Failed to persist sentence status', err);
      // Revert UI if API fails
      sentence.isKey = !newStatus;
      setState(prev => ({ ...prev }));
    });

    // Award XP if marking as key
    if (newStatus && sentence.patterns) {
      sentence.patterns.forEach(p => {
        updatePatternMastery(p.patternId, 10).catch(() => {});
      });
      onXpGain?.(sentence.patterns.length * 10);
    }
  }, []);

  const setSubtitleMode = useCallback((mode: SubtitleMode) => {
    setState(prev => ({ ...prev, subtitleMode: mode }));
  }, []);

  const setStage = useCallback((stage: number) => {
    setState(prev => {
      const videoId = dataRef.current?.videoId;
      if (videoId) {
        updateVideoProgress(videoId, { currentStage: stage }).catch(err => {
          console.error('Failed to update stage', err);
        });
      }

      // Automatic subtitle mode switching logic
      let subtitleMode: SubtitleMode = prev.subtitleMode;
      if (stage === 1) subtitleMode = 'bilingual';
      else if (stage === 2) subtitleMode = 'pure-en';
      else if (stage >= 3) subtitleMode = 'none';

      return { ...prev, currentStage: stage, subtitleMode };
    });
  }, []);

  const incrementRepetition = useCallback(() => {
    setState(prev => {
      const newCount = prev.repetitionCount + 1;
      const videoId = dataRef.current?.videoId;
      if (videoId) {
        updateVideoProgress(videoId, { repetitionCount: newCount }).catch(err => {
          console.error('Failed to update repetition count', err);
        });

        // Award XP to patterns in current sentence when checking in
        if (currentSentence?.patterns) {
          currentSentence.patterns.forEach(p => {
            updatePatternMastery(p.patternId, 5).catch(() => {});
          });
          onXpGain?.(currentSentence.patterns.length * 5);
        }
      }
      return { ...prev, repetitionCount: newCount };
    });
  }, [currentSentence]);

  const toggleAudioMode = useCallback(() => {
    setState(prev => ({ ...prev, isAudioMode: !prev.isAudioMode }));
  }, []);

  const toggleLoop = useCallback(() => {
    setState(prev => ({ ...prev, isLooping: !prev.isLooping }));
  }, []);

  const setActiveTab = useCallback((tab: TabId) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const toggleShadowingMode = useCallback(() => {
    setState(prev => ({ ...prev, shadowingMode: !prev.shadowingMode, isWaitingForShadowing: false }));
  }, []);

  const setVolume = useCallback((val: number) => {
    const v = Math.max(0, Math.min(1, val));
    if (videoElRef.current) videoElRef.current.volume = v;
    setState(prev => ({ ...prev, volume: v }));
  }, []);

  const selectEpisode = useCallback((_ep: number) => {}, []);

  return {
    videoRef,
    state,
    currentSentence,
    togglePlayPause, seek, replay,
    cycleSpeed,
    setPointA, setPointB, toggleABLoop,
    goToPrevSentence, goToNextSentence, goToSentence, toggleLoopSentence,
    toggleKeySentence,
    toggleAudioMode,
    toggleLoop,
    setSubtitleMode,
    setActiveTab,
    selectEpisode,
    setStage,
    incrementRepetition,
    toggleShadowingMode,
    setVolume,
  };
}
