/**
 * Umnik Audio Engine
 * Generates dynamic, child-friendly sound effects using Web Audio API.
 * Supports mute, persistence, and safe initializations.
 */

const UmnikAudio = (() => {
  let audioCtx = null;
  let isMuted = true;

  // Load initial mute state from safe storage (off/muted by default)
  try {
    const savedMute = window.UmnikStorage ? window.UmnikStorage.getItem('umnik_mute') : null;
    if (savedMute !== null) {
      isMuted = savedMute === 'true';
    } else {
      isMuted = true; // Off by default
    }
  } catch (e) {
    isMuted = true;
  }

  // Lazy initialize AudioContext on user interaction to comply with browser autoplay policies
  const initContext = () => {
    if (!audioCtx) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      } catch (e) {
        console.warn('Web Audio API is not supported in this browser.', e);
      }
    }
    // Resume context if suspended
    if (audioCtx && audioCtx.state === 'suspended') {
      try {
        audioCtx.resume().catch(err => console.warn('AudioContext resume failed:', err));
      } catch (err) {
        console.warn('AudioContext resume exception:', err);
      }
    }
    return audioCtx;
  };

  // Safe sound player helper
  const playTone = (freqs, duration, type = 'sine', slide = false, delayBetween = 0) => {
    try {
      if (isMuted) return;
      
      const ctx = initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      freqs.forEach((freq, index) => {
        const startTime = now + (index * delayBetween);
        const stopTime = startTime + duration;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        
        if (slide && index > 0) {
          // Slide frequency from previous tone to current tone
          osc.frequency.setValueAtTime(freqs[index - 1], startTime);
          osc.frequency.exponentialRampToValueAtTime(freq, stopTime);
        } else {
          osc.frequency.setValueAtTime(freq, startTime);
        }

        // Smooth envelope to prevent clicks
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.05); // low volume for kids' ears
        gainNode.gain.exponentialRampToValueAtTime(0.001, stopTime);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(stopTime);
      });
    } catch (e) {
      console.warn("playTone exception swallowed safely:", e);
    }
  };

  return {
    isMuted: () => isMuted,
    
    setMute: (muted) => {
      isMuted = muted;
      if (window.UmnikStorage) {
        window.UmnikStorage.setItem('umnik_mute', String(muted));
      }
    },
    
    toggleMute: () => {
      isMuted = !isMuted;
      if (window.UmnikStorage) {
        window.UmnikStorage.setItem('umnik_mute', String(isMuted));
      }
      // Play a tiny bubble pop to confirm unmute
      if (!isMuted) {
        setTimeout(() => { UmnikAudio.playPop(); }, 50);
      }
      return isMuted;
    },

    // 1. Success sound (Верен отговор) - Bright upward arpeggio
    playSuccess: () => {
      playTone([523.25, 659.25, 783.99, 1046.50], 0.15, 'triangle', false, 0.08);
    },

    // 2. Encouragement (Опитай пак) - Gentle warm double-tone slide
    playEncourage: () => {
      playTone([392.00, 440.00, 392.00], 0.2, 'sine', true, 0.1);
    },

    // 3. Level Complete (Завършена игра!) - Triumphant child-friendly fanfare
    playLevelComplete: () => {
      // G4 -> C5 -> E5 -> G5 -> C6
      const ctx = initContext();
      if (!ctx || isMuted) return;
      const notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, index) => {
        setTimeout(() => {
          playTone([freq], 0.35, 'triangle', false, 0);
        }, index * 120);
      });
    },

    // 4. Click sound (Клик върху бутон) - Cute bubble pop
    playPop: () => {
      playTone([800, 1500], 0.08, 'sine', true, 0.01);
    },

    // 5. Sparkle/Hint sound (Подсказка) - High magic sparkle
    playSparkle: () => {
      playTone([987.77, 1174.66, 1318.51, 1567.98], 0.1, 'sine', false, 0.05);
    },

    // Initialize on first window interaction
    triggerInit: () => {
      initContext();
    }
  };
})();

// Assign to window for global access
window.UmnikAudio = UmnikAudio;
