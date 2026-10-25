// Sound, all made in the browser: steel whooshing through the air, bones cracking, fire roaring up, ice ringing,
// lightning crackling, coins, a gulp of potion, the boss's roar, and a low drone with wind for the deep.
let ctx = null, master = null, noise = null, amb = null, last = {};
export const sound = {
  on: true,
  init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    const n = ctx.sampleRate * 2; noise = ctx.createBuffer(1, n, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  },
  ambient(on) {
    if (!ctx) return;
    if (on && !amb) {
      const g = ctx.createGain(); g.gain.value = 0; g.connect(master); g.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 3);
      const oscs = [55, 55.4, 82.6].map((f) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; o.connect(lp); lp.connect(g); o.start(); return o; });
      const w = ctx.createBufferSource(); w.buffer = noise; w.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 400; bp.Q.value = 0.6; const wg = ctx.createGain(); wg.gain.value = 0.25; w.connect(bp); bp.connect(wg); wg.connect(g); w.start();
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 250; lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
      amb = { g, stop: () => { g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); setTimeout(() => { oscs.forEach((o) => o.stop()); w.stop(); lfo.stop(); }, 1200); } };
    } else if (!on && amb) { amb.stop(); amb = null; }
  },
  play(name, vol = 1) {
    if (!ctx || !this.on) return; const now = ctx.currentTime;
    // the same sound many times in one moment would just be noise
    if (last[name] && now - last[name] < (name === 'crunch' || name === 'hit' ? 0.05 : 0.03)) return; last[name] = now;
    const out = ctx.createGain(); out.gain.value = vol; out.connect(master);
    const nz = (dur, f, q = 1, type = 'bandpass', g0 = 0.5, f1) => { const s = ctx.createBufferSource(); s.buffer = noise; s.playbackRate.value = 0.8 + Math.random() * 0.4; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, now); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, now + dur); fl.Q.value = q; const g = ctx.createGain(); g.gain.setValueAtTime(g0, now); g.gain.exponentialRampToValueAtTime(0.001, now + dur); s.connect(fl); fl.connect(g); g.connect(out); s.start(now, Math.random()); s.stop(now + dur + 0.05); };
    const tone = (f, dur, type = 'sine', g0 = 0.3, f1, at = 0) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, now + at); if (f1) o.frequency.exponentialRampToValueAtTime(f1, now + at + dur); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now + at); g.gain.linearRampToValueAtTime(g0, now + at + 0.01); g.gain.exponentialRampToValueAtTime(0.001, now + at + dur); o.connect(g); g.connect(out); o.start(now + at); o.stop(now + at + dur + 0.05); };
    switch (name) {
      case 'swing': nz(0.22, 900, 1.2, 'bandpass', 0.35, 2600); break;
      case 'crunch': nz(0.12, 1800, 2, 'bandpass', 0.5); nz(0.08, 3500, 4, 'bandpass', 0.3); tone(110, 0.1, 'triangle', 0.25, 60); break;
      case 'hit': tone(160, 0.12, 'square', 0.12, 70); nz(0.1, 600, 1, 'lowpass', 0.4); break;
      case 'bones': for (let k = 0; k < 4; k++) { const at = k * 0.03 + Math.random() * 0.02; const o = ctx.createBufferSource(); o.buffer = noise; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200 + Math.random() * 2500; f.Q.value = 6; const g = ctx.createGain(); g.gain.setValueAtTime(0.4, now + at); g.gain.exponentialRampToValueAtTime(0.001, now + at + 0.06); o.connect(f); f.connect(g); g.connect(out); o.start(now + at, Math.random()); o.stop(now + at + 0.1); } break;
      case 'hurt': tone(90, 0.25, 'sawtooth', 0.2, 50); nz(0.18, 500, 1, 'lowpass', 0.4); break;
      case 'fire': nz(1.2, 300, 0.7, 'lowpass', 0.6, 1800); nz(0.6, 1200, 0.5, 'bandpass', 0.2); break;
      case 'frost': for (const f of [1760, 2349, 2637, 3520]) tone(f, 0.9, 'sine', 0.06); nz(0.5, 6000, 1, 'highpass', 0.25); break;
      case 'zap': nz(0.25, 3000, 0.5, 'highpass', 0.5); tone(880, 0.15, 'sawtooth', 0.08, 220); break;
      case 'whirl': nz(0.7, 500, 2, 'bandpass', 0.45, 1600); break;
      case 'hammer': tone(660, 0.2, 'triangle', 0.15, 990); nz(0.15, 2000, 3, 'bandpass', 0.15); break;
      case 'meteorIn': nz(1, 200, 0.6, 'lowpass', 0.3, 1200); break;
      case 'boom': tone(60, 0.8, 'sine', 0.6, 30); nz(0.9, 400, 0.5, 'lowpass', 0.8, 80); break;
      case 'coin': tone(1568, 0.15, 'sine', 0.15); tone(2093, 0.25, 'sine', 0.12, undefined, 0.06); break;
      case 'item': tone(523, 0.3, 'triangle', 0.12); tone(784, 0.4, 'triangle', 0.1, undefined, 0.08); break;
      case 'legend': [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, 0.7, 'triangle', 0.1, undefined, k * 0.07)); nz(1.2, 5000, 1, 'highpass', 0.08); break;
      case 'potion': nz(0.3, 400, 3, 'bandpass', 0.3, 200); tone(300, 0.3, 'sine', 0.12, 600); break;
      case 'globe': tone(440, 0.3, 'sine', 0.12, 880); break;
      case 'level': [392, 523, 659, 784].forEach((f, k) => tone(f, 0.6, 'triangle', 0.14, undefined, k * 0.1)); break;
      case 'dash': nz(0.25, 700, 1, 'bandpass', 0.3, 300); break;
      case 'rise': nz(0.5, 200, 1, 'lowpass', 0.4, 600); tone(70, 0.4, 'sawtooth', 0.05, 110); break;
      case 'roar': tone(70, 1.4, 'sawtooth', 0.25, 45); nz(1.4, 300, 0.8, 'lowpass', 0.5, 120); break;
      case 'obelisk': [196, 247, 294].forEach((f) => tone(f, 2.5, 'sawtooth', 0.05)); nz(2, 150, 0.5, 'lowpass', 0.3, 900); break;
      case 'portal': [262, 330, 392, 523].forEach((f, k) => tone(f, 1.2, 'sine', 0.1, f * 2, k * 0.06)); break;
      case 'chest': tone(180, 0.2, 'square', 0.08, 120); nz(0.3, 800, 2, 'bandpass', 0.2); break;
      case 'shrine': [330, 440, 554, 659].forEach((f, k) => tone(f, 1, 'sine', 0.1, undefined, k * 0.05)); break;
      case 'arrow': nz(0.15, 2500, 2, 'bandpass', 0.2, 1200); break;
      case 'bolt2': tone(300, 0.4, 'sine', 0.1, 600); nz(0.3, 1500, 2, 'bandpass', 0.1); break;
      case 'death': tone(220, 1.6, 'sawtooth', 0.15, 55); break;
      case 'click': tone(800, 0.05, 'square', 0.05); break;
    }
  },
};
