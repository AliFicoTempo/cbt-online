class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  public playPop(): void {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }

  public playSelect(): void {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.setValueAtTime(680, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }

  public playSuccess(): void {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];

      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'square';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.08, now + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.001, now + (i + 1) * 0.07);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.07);
        osc.stop(now + (i + 1) * 0.07);
      });
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }

  public playAlarm(): void {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      oscillator.type = 'square';
      gain.gain.setValueAtTime(0, now);

      for (let i = 0; i < 8; i++) {
        const beepStart = now + i * 0.45;
        const beepEnd = beepStart + 0.3;
        oscillator.frequency.setValueAtTime(i % 2 === 0 ? 880 : 740, beepStart);
        gain.gain.setValueAtTime(0, beepStart);
        gain.gain.linearRampToValueAtTime(0.18, beepStart + 0.02);
        gain.gain.setValueAtTime(0.18, beepEnd - 0.02);
        gain.gain.linearRampToValueAtTime(0, beepEnd);
      }

      oscillator.connect(gain);
      gain.connect(this.ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + 8 * 0.45);
    } catch (e) {
      console.error('Alarm playback error:', e);
    }
  }
}

export const sounds = new SoundEngine();