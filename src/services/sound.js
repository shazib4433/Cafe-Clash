const MUTE_KEY = 'cafe_clash_v1_muted';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try {
      this.muted = window.localStorage.getItem(MUTE_KEY) === 'true';
    } catch {
      this.muted = false;
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      window.localStorage.setItem(MUTE_KEY, String(this.muted));
    } catch {
      // ignore
    }
    if (!this.muted) {
      this.play('click');
    }
    return this.muted;
  }

  ensureContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  tone({ freq = 440, endFreq = null, type = 'sine', duration = 0.1, volume = 0.12, delay = 0 }) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  play(effect) {
    if (this.muted) return;
    switch (effect) {
      case 'click':
        this.tone({ freq: 520, endFreq: 680, type: 'triangle', duration: 0.055, volume: 0.08 });
        break;
      case 'flap':
        this.tone({ freq: 310, endFreq: 560, type: 'sine', duration: 0.085, volume: 0.1 });
        break;
      case 'point':
        this.tone({ freq: 660, type: 'triangle', duration: 0.07, volume: 0.1 });
        this.tone({ freq: 880, type: 'triangle', duration: 0.11, volume: 0.1, delay: 0.06 });
        break;
      case 'eat':
        this.tone({ freq: 480, endFreq: 760, type: 'sine', duration: 0.09, volume: 0.11 });
        break;
      case 'bonus':
        this.tone({ freq: 587, type: 'triangle', duration: 0.08, volume: 0.11 });
        this.tone({ freq: 784, type: 'triangle', duration: 0.08, volume: 0.11, delay: 0.06 });
        this.tone({ freq: 1046, type: 'triangle', duration: 0.14, volume: 0.12, delay: 0.12 });
        break;
      case 'merge':
        this.tone({ freq: 380, endFreq: 620, type: 'sine', duration: 0.08, volume: 0.09 });
        break;
      case 'gameover':
        this.tone({ freq: 330, endFreq: 180, type: 'sawtooth', duration: 0.18, volume: 0.08 });
        this.tone({ freq: 220, endFreq: 110, type: 'sawtooth', duration: 0.25, volume: 0.08, delay: 0.14 });
        break;
      case 'win':
        this.tone({ freq: 523.25, type: 'triangle', duration: 0.1, volume: 0.12, delay: 0 });
        this.tone({ freq: 659.25, type: 'triangle', duration: 0.1, volume: 0.12, delay: 0.09 });
        this.tone({ freq: 783.99, type: 'triangle', duration: 0.1, volume: 0.12, delay: 0.18 });
        this.tone({ freq: 1046.5, type: 'triangle', duration: 0.28, volume: 0.14, delay: 0.27 });
        break;
      default:
        break;
    }
  }
}

export const sound = new SoundEngine();
