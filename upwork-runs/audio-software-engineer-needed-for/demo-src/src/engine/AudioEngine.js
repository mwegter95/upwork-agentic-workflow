// AudioEngine.js — core Web Audio graph + real MP3 stem loading

const BASE = import.meta.env.BASE_URL; // '/demos/audio-software-engineer-needed-for/'

// ------------ COUNT-IN CLICK (synthetic, kept for count-in feature) ------------

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
    this._loadAC = null;     // AbortController for in-flight fetches
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
    // Cancel any in-flight fetches from a previous load
    if (this._loadAC) this._loadAC.abort();
    this._loadAC = new AbortController();
    const signal = this._loadAC.signal;

    this._ensureContext();
    this.stop();
    this.song = song;
    this.totalDuration = song.totalDuration;
    this.pauseOffset = 0;
    this.stems = {};

    let done = 0;
    for (const stemDef of song.stems) {
      const url = `${BASE}audio/${song.slug}/${stemDef.file}`;
      const resp = await fetch(url, { signal });
      const arrayBuffer = await resp.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arrayBuffer);

      const volumeGain = this.ctx.createGain();
      const muteGain   = this.ctx.createGain();
      const panner     = this.ctx.createStereoPanner();
      volumeGain.gain.value = 1.0;
      muteGain.gain.value   = 1.0;
      panner.pan.value      = 0;
      volumeGain.connect(panner);
      panner.connect(muteGain);
      muteGain.connect(this.masterGain);

      this.stems[stemDef.id] = {
        buffer,
        source: null,
        volumeGain,
        muteGain,
        panner,
        volume: 80,
        muted: false,
        soloed: false,
        pan: 0,
      };
      done++;
      if (onProgress) onProgress(done / song.stems.length);
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
      src.loop = false; // real MP3s — play once, no looping
      src.connect(stem.volumeGain);
      // Clamp offset to buffer duration to avoid errors on shorter stems
      const safeOffset = Math.min(offset, stem.buffer.duration - 0.001);
      src.start(t, Math.max(0, safeOffset));
      stem.source = src;
    });
    return t;
  }

  play() {
    if (!this.song || this.isPlaying) return;
    this._ensureContext();
    const startT = this._createSources(this.pauseOffset);
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
  async countIn(bars, bpm) {
    this._ensureContext();
    const beatDur = 60 / bpm;
    const countBeats = bars * 4;
    const startT = this.ctx.currentTime + 0.1;

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
    if (this._loadAC) this._loadAC.abort();
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
