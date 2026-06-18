// Scheduler.js — Chris Wilson lookahead beat scheduler
// Ref: https://web.dev/articles/audio-scheduling

const SCHEDULE_AHEAD = 0.1;  // 100ms lookahead
const TICK_INTERVAL  = 25;   // 25ms setTimeout

export class Scheduler {
  constructor(audioCtx, bpm, callbacks = {}) {
    this.audioCtx = audioCtx;
    this.bpm = bpm;
    this.onBeat = callbacks.onBeat || null;      // (beatIndex, audioTime) => void
    this.onCue  = callbacks.onCue  || null;      // (cue) => void — display cues
    this._nextBeatTime = 0;
    this._currentBeat = 0;
    this._timerId = null;
    this._cues = [];    // [{ timeSec, text, _fired }]
    this._startWallTime = 0;  // performance.now() when scheduler started
    this._startAudioTime = 0; // audioCtx.currentTime when started
    this._running = false;
  }

  setCues(cues) {
    this._cues = cues.map(c => ({ ...c, _fired: false }));
  }

  start(cues) {
    if (this._running) return;
    this._running = true;
    this._nextBeatTime = this.audioCtx.currentTime;
    this._currentBeat = 0;
    this._startAudioTime = this.audioCtx.currentTime;
    this._startWallTime = performance.now();
    if (cues) this.setCues(cues);
    this._tick();
  }

  stop() {
    this._running = false;
    clearTimeout(this._timerId);
    this._timerId = null;
  }

  // Called when seek happens — reset cue firing state
  seekTo(newTimeSec) {
    this._startAudioTime = this.audioCtx.currentTime - newTimeSec;
    const beatDur = 60 / this.bpm;
    this._currentBeat = Math.floor(newTimeSec / beatDur);
    this._nextBeatTime = this.audioCtx.currentTime + (this._currentBeat * beatDur - newTimeSec);
    // Reset cues that haven't fired yet relative to new position
    this._cues.forEach(c => { c._fired = c.timeSec < newTimeSec; });
  }

  currentTimeSec() {
    return this.audioCtx.currentTime - this._startAudioTime;
  }

  _tick() {
    if (!this._running) return;
    const beatDur = 60 / this.bpm;
    while (this._nextBeatTime < this.audioCtx.currentTime + SCHEDULE_AHEAD) {
      if (this.onBeat) {
        this.onBeat(this._currentBeat, this._nextBeatTime);
      }
      this._currentBeat++;
      this._nextBeatTime += beatDur;
    }

    // Cue dispatch — compare audioCtx time to cue times
    if (this.onCue) {
      const nowSec = this.currentTimeSec();
      this._cues.forEach(cue => {
        if (!cue._fired && nowSec >= cue.timeSec) {
          cue._fired = true;
          this.onCue(cue);
        }
      });
    }

    this._timerId = setTimeout(() => this._tick(), TICK_INTERVAL);
  }
}
