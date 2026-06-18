// AudioEngine.js — core Web Audio graph + stem synthesis
import { ROOT_HZ, STEM_CONFIG } from '../data/songs.js';

// ------------ SYNTHESIS HELPERS ------------

function generateNoiseBuffer(offCtx, dur) {
  const frames = Math.ceil(offCtx.sampleRate * dur);
  const buf = offCtx.createBuffer(1, frames, offCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function schedKick(offCtx, t, accent = 1.0) {
  const osc = offCtx.createOscillator();
  const gain = offCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.28);
  gain.gain.setValueAtTime(accent * 0.85, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
  osc.connect(gain); gain.connect(offCtx.destination);
  osc.start(t); osc.stop(t + 0.32);
}

function schedSnare(offCtx, t) {
  const buf = generateNoiseBuffer(offCtx, 0.18);
  const src = offCtx.createBufferSource();
  src.buffer = buf;
  const bpf = offCtx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 1500; bpf.Q.value = 1.8;
  const gain = offCtx.createGain();
  gain.gain.setValueAtTime(0.55, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  src.connect(bpf); bpf.connect(gain); gain.connect(offCtx.destination);
  src.start(t); src.stop(t + 0.18);
}

function schedHihat(offCtx, t, open = false) {
  const buf = generateNoiseBuffer(offCtx, open ? 0.32 : 0.05);
  const src = offCtx.createBufferSource();
  src.buffer = buf;
  const hpf = offCtx.createBiquadFilter();
  hpf.type = 'highpass'; hpf.frequency.value = open ? 7000 : 9000;
  const gain = offCtx.createGain();
  const decayEnd = open ? 0.28 : 0.04;
  gain.gain.setValueAtTime(open ? 0.18 : 0.22, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + decayEnd);
  src.connect(hpf); hpf.connect(gain); gain.connect(offCtx.destination);
  src.start(t); src.stop(t + decayEnd + 0.01);
}

function schedBassNote(offCtx, t, freq, dur) {
  const osc1 = offCtx.createOscillator();
  const osc2 = offCtx.createOscillator();
  osc1.type = 'sine';
  osc2.type = 'triangle';
  osc1.frequency.value = freq;
  osc2.frequency.value = freq;
  const g1 = offCtx.createGain(); g1.gain.value = 1.0;
  const g2 = offCtx.createGain(); g2.gain.value = 0.30;
  const env = offCtx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.72, t + 0.01);
  env.gain.setValueAtTime(0.72, t + 0.08);
  env.gain.linearRampToValueAtTime(0.55, t + 0.12);
  env.gain.setValueAtTime(0.55, Math.max(t + 0.12, t + dur - 0.12));
  env.gain.linearRampToValueAtTime(0, t + dur);
  osc1.connect(g1); osc2.connect(g2);
  g1.connect(env); g2.connect(env); env.connect(offCtx.destination);
  osc1.start(t); osc2.start(t); osc1.stop(t + dur); osc2.stop(t + dur);
}

function schedKeys(offCtx, t, rootFreq) {
  const freqs = [rootFreq * 2, rootFreq * 2 * 1.2599, rootFreq * 2 * 1.4983];
  const gains = [1.0, 0.55, 0.42];
  const lpf = offCtx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 3800; lpf.Q.value = 0.7;
  const env = offCtx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.6, t + 0.015);
  env.gain.exponentialRampToValueAtTime(0.35, t + 0.25);
  env.gain.setValueAtTime(0.35, t + 0.6);
  env.gain.linearRampToValueAtTime(0, t + 1.1);
  lpf.connect(env); env.connect(offCtx.destination);
  freqs.forEach((f, i) => {
    const osc = offCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const g = offCtx.createGain(); g.gain.value = gains[i];
    osc.connect(g); g.connect(lpf);
    osc.start(t); osc.stop(t + 1.2);
  });
}

function schedClickTick(offCtx, t, isAccent) {
  const osc = offCtx.createOscillator();
  const env = offCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = isAccent ? 1300 : 900;
  env.gain.setValueAtTime(isAccent ? 0.85 : 0.45, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + (isAccent ? 0.020 : 0.014));
  osc.connect(env); env.connect(offCtx.destination);
  osc.start(t); osc.stop(t + 0.025);
}

function schedGuideNote(offCtx, t, freq, dur) {
  const osc = offCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq * 4;
  const vibLfo = offCtx.createOscillator();
  const vibGain = offCtx.createGain();
  vibLfo.frequency.value = 5.5;
  vibGain.gain.value = freq * 4 * 0.006;
  vibLfo.connect(vibGain); vibGain.connect(osc.frequency);
  const bpf = offCtx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 700; bpf.Q.value = 8;
  const env = offCtx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.38, t + 0.04);
  env.gain.setValueAtTime(0.38, Math.max(t + 0.04, t + dur - 0.25));
  env.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(bpf); bpf.connect(env); env.connect(offCtx.destination);
  vibLfo.start(t); osc.start(t); osc.stop(t + dur); vibLfo.stop(t + dur);
}

// ------------ STEM RENDERERS ------------

async function renderDrums(song) {
  const sampleRate = 44100;
  const dur = song.loopDuration;
  const offCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * dur), sampleRate);
  const beatDur = song.barDuration / 4;
  const barsCount = 8;
  for (let bar = 0; bar < barsCount; bar++) {
    const barStart = bar * song.barDuration;
    for (let beat = 0; beat < 4; beat++) {
      const t = barStart + beat * beatDur;
      if (beat === 0) schedKick(offCtx, t, 1.0);
      if (beat === 2) schedKick(offCtx, t, 0.8);
      if (beat === 1 || beat === 3) schedSnare(offCtx, t);
      // 8th-note hats
      schedHihat(offCtx, t, false);
      schedHihat(offCtx, t + beatDur / 2, false);
    }
  }
  return offCtx.startRendering();
}

async function renderBass(song) {
  const sampleRate = 44100;
  const dur = song.loopDuration;
  const offCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * dur), sampleRate);
  const root = ROOT_HZ[song.synthKey];
  const p5 = root * 1.4983;
  const beatDur = song.barDuration / 4;
  const noteDur = beatDur * 0.9;
  const pattern = [root, root, p5, root];
  for (let bar = 0; bar < 8; bar++) {
    const barStart = bar * song.barDuration;
    pattern.forEach((freq, beat) => {
      schedBassNote(offCtx, barStart + beat * beatDur, freq, noteDur);
    });
  }
  return offCtx.startRendering();
}

async function renderKeys(song) {
  const sampleRate = 44100;
  const dur = song.loopDuration;
  const offCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * dur), sampleRate);
  const root = ROOT_HZ[song.synthKey];
  const beatDur = song.barDuration / 4;
  for (let bar = 0; bar < 8; bar++) {
    const barStart = bar * song.barDuration;
    schedKeys(offCtx, barStart, root);               // beat 1
    schedKeys(offCtx, barStart + 2 * beatDur, root); // beat 3
  }
  return offCtx.startRendering();
}

async function renderPads(song) {
  const sampleRate = 44100;
  const dur = song.loopDuration;
  const offCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * dur), sampleRate);
  const rootFreq = ROOT_HZ[song.synthKey];
  const chordFreqs = [rootFreq, rootFreq * 1.2599, rootFreq * 1.4983, rootFreq * 2.0];
  const detuneCents = [-14, -4, +4, +14];

  const lpf = offCtx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 900; lpf.Q.value = 0.5;

  const env = offCtx.createGain();
  env.gain.setValueAtTime(0, 0);
  env.gain.linearRampToValueAtTime(0.55, 1.2);
  env.gain.setValueAtTime(0.55, dur - 2.5);
  env.gain.linearRampToValueAtTime(0, dur);

  lpf.connect(env); env.connect(offCtx.destination);

  chordFreqs.forEach((f, i) => {
    const osc = offCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    osc.detune.value = detuneCents[i];
    const g = offCtx.createGain(); g.gain.value = 0.25;
    osc.connect(g); g.connect(lpf);
    osc.start(0); osc.stop(dur);
  });

  return offCtx.startRendering();
}

async function renderClick(song) {
  const sampleRate = 44100;
  const dur = song.loopDuration;
  const offCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * dur), sampleRate);
  const beatDur = song.barDuration / 4;
  const totalBeats = Math.floor(dur / beatDur);
  for (let i = 0; i < totalBeats; i++) {
    schedClickTick(offCtx, i * beatDur, i % 4 === 0);
  }
  return offCtx.startRendering();
}

async function renderGuide(song) {
  const sampleRate = 44100;
  const dur = song.loopDuration;
  const offCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * dur), sampleRate);
  const root = ROOT_HZ[song.synthKey];
  const m3 = root * 1.2599;
  const p5 = root * 1.4983;
  const beatDur = song.barDuration / 4;
  const motif = [root, m3, p5, root];
  for (let bar = 0; bar < 8; bar++) {
    const barStart = bar * song.barDuration;
    motif.forEach((freq, beat) => {
      schedGuideNote(offCtx, barStart + beat * beatDur, freq, beatDur * 0.85);
    });
  }
  return offCtx.startRendering();
}

// ------------ AUDIO ENGINE CLASS ------------

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.stems = {};         // { id: { buffer, source, volumeGain, muteGain, panner } }
    this.isPlaying = false;
    this.pauseOffset = 0;    // seconds into the song
    this.playStartTime = 0;  // audioCtx.currentTime when play started
    this.song = null;
    this.totalDuration = 0;
    this._rafId = null;
    this.onTimeUpdate = null; // callback(currentSec)
    this._loopActive = false;
    this._loopIn = 0;
    this._loopOut = 0;
  }

  _ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  async loadSong(song, onProgress) {
    this._ensureContext();
    this.stop();
    this.song = song;
    this.totalDuration = song.totalDuration;
    this.pauseOffset = 0;
    this.stems = {};

    const renderers = [
      { id: 'drums',  fn: renderDrums },
      { id: 'bass',   fn: renderBass  },
      { id: 'keys',   fn: renderKeys  },
      { id: 'pads',   fn: renderPads  },
      { id: 'click',  fn: renderClick },
      { id: 'guide',  fn: renderGuide },
    ];

    let done = 0;
    for (const r of renderers) {
      const buf = await r.fn(song);
      const volumeGain = this.ctx.createGain();
      const muteGain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();
      volumeGain.gain.value = 1.0;
      muteGain.gain.value = 1.0;
      panner.pan.value = 0;
      volumeGain.connect(panner);
      panner.connect(muteGain);
      muteGain.connect(this.masterGain);
      this.stems[r.id] = {
        buffer: buf,
        source: null,
        volumeGain,
        muteGain,
        panner,
        volume: 80,   // UI value 0-100
        muted: false,
        soloed: false,
        pan: 0,
      };
      done++;
      if (onProgress) onProgress(done / renderers.length);
    }
    return this.stems;
  }

  _createSources(offset) {
    const t = this.ctx.currentTime + 0.05;
    Object.entries(this.stems).forEach(([id, stem]) => {
      if (stem.source) {
        try { stem.source.stop(); } catch (_) {}
        stem.source.disconnect();
      }
      const src = this.ctx.createBufferSource();
      src.buffer = stem.buffer;
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = stem.buffer.duration;
      src.connect(stem.volumeGain);
      const loopOffset = offset % stem.buffer.duration;
      src.start(t, loopOffset);
      stem.source = src;
    });
    return t;
  }

  play() {
    if (!this.song || this.isPlaying) return;
    this._ensureContext();
    const startT = this._createSources(this.pauseOffset);
    this.playStartTime = startT - this.pauseOffset;
    // Adjust: playStartTime = ctx.currentTime + 0.05 - pauseOffset
    // so currentSec = ctx.currentTime - playStartTime
    this.playStartTime = this.ctx.currentTime + 0.05 - this.pauseOffset;
    this.isPlaying = true;
    this._startRaf();
  }

  pause() {
    if (!this.isPlaying) return;
    this.pauseOffset = this.currentTime();
    this._stopSources();
    this.isPlaying = false;
    this._stopRaf();
  }

  stop() {
    this._stopSources();
    this.isPlaying = false;
    this.pauseOffset = 0;
    this._stopRaf();
    if (this.onTimeUpdate) this.onTimeUpdate(0);
  }

  seek(sec) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this._stopSources();
      this.isPlaying = false;
    }
    this.pauseOffset = Math.max(0, Math.min(sec, this.totalDuration));
    if (wasPlaying) {
      this.play();
    } else {
      if (this.onTimeUpdate) this.onTimeUpdate(this.pauseOffset);
    }
  }

  currentTime() {
    if (!this.ctx || !this.isPlaying) return this.pauseOffset;
    return this.ctx.currentTime - this.playStartTime;
  }

  _stopSources() {
    Object.values(this.stems).forEach(stem => {
      if (stem.source) {
        try { stem.source.stop(); } catch (_) {}
        stem.source.disconnect();
        stem.source = null;
      }
    });
  }

  _startRaf() {
    const tick = () => {
      const t = this.currentTime();
      // Loop check
      if (this._loopActive && t >= this._loopOut) {
        this.seek(this._loopIn);
        return;
      }
      // End of song
      if (t >= this.totalDuration) {
        this.stop();
        return;
      }
      if (this.onTimeUpdate) this.onTimeUpdate(t);
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _stopRaf() {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
  }

  setVolume(stemId, value) {
    // value: 0-100
    const stem = this.stems[stemId];
    if (!stem) return;
    stem.volume = value;
    if (!stem.muted) {
      stem.volumeGain.gain.setTargetAtTime(value / 100, this.ctx.currentTime, 0.01);
    }
  }

  setMute(stemId, muted) {
    const stem = this.stems[stemId];
    if (!stem) return;
    stem.muted = muted;
    this._updateMuteGains();
  }

  setSolo(stemId, soloed) {
    const stem = this.stems[stemId];
    if (!stem) return;
    stem.soloed = soloed;
    this._updateMuteGains();
  }

  _updateMuteGains() {
    const anySoloed = Object.values(this.stems).some(s => s.soloed);
    Object.entries(this.stems).forEach(([id, stem]) => {
      const shouldHear = !stem.muted && (!anySoloed || stem.soloed);
      const targetVol = shouldHear ? stem.volume / 100 : 0;
      stem.volumeGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.01);
    });
  }

  setPan(stemId, pan) {
    const stem = this.stems[stemId];
    if (!stem) return;
    stem.pan = pan;
    stem.panner.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.01);
  }

  setMasterVolume(value) {
    if (!this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(value / 100, this.ctx.currentTime, 0.01);
  }

  setLoop(active, inSec, outSec) {
    this._loopActive = active;
    this._loopIn = inSec;
    this._loopOut = outSec;
  }

  // Schedule count-in click ticks using Web Audio scheduler
  // Returns a Promise that resolves when count-in is done and playback should start
  async countIn(bars, bpm) {
    this._ensureContext();
    const beatDur = 60 / bpm;
    const countBeats = bars * 4;
    const startT = this.ctx.currentTime + 0.1;

    // Render a tiny offline click buffer for the count-in
    const sampleRate = 44100;
    const totalDur = countBeats * beatDur + 0.05;
    const offCtx = new OfflineAudioContext(1, Math.ceil(sampleRate * totalDur), sampleRate);
    for (let i = 0; i < countBeats; i++) {
      schedClickTick(offCtx, i * beatDur, i % 4 === 0);
    }
    const buf = await offCtx.startRendering();

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    src.start(startT);

    const countInDurationMs = (totalDur + 0.05) * 1000;
    return { startT, countBeats, beatDur, countInDurationMs };
  }

  destroy() {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
