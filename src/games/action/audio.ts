/** 音效由使用者手勢啟動的 Web Audio 合成，不載入音檔；不支援時安靜降級。 */
export class ActionAudio {
  private context: AudioContext | null = null;
  private disposed = false;
  enabled = true;
  unlock() {
    if (this.disposed || !this.enabled) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch {
      this.context = null;
    }
  }
  play(type: 'hit' | 'miss' | 'shoot') {
    const ctx = this.context;
    if (this.disposed || !this.enabled || !ctx || ctx.state !== 'running') return;
    try {
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain(),
        now = ctx.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(type === 'hit' ? 660 : type === 'shoot' ? 420 : 170, now);
      oscillator.frequency.exponentialRampToValueAtTime(type === 'hit' ? 980 : 110, now + 0.11);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.14);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    } catch {
      /* 音效失敗不影響碰撞、倒數與計分。 */
    }
  }
  dispose() {
    this.disposed = true;
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
  }
}
