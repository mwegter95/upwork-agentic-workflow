import { useState, useEffect, useRef } from 'react';

function formatTime(sec) {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  const ms = Math.floor((sec - Math.floor(sec)) * 10);
  return `${m}:${String(ss).padStart(2, '0')}.${ms}`;
}

export default function Transport({
  song,
  isPlaying,
  isLoading,
  currentTime,
  onPlay,
  onPause,
  onStop,
  onCountInPlay,
  countInBars,
  onCountInBarsChange,
  masterVolume,
  onMasterVolumeChange,
  beatInfo,        // { beat, isAccent }
  countInState,    // { active, number } or null
}) {
  const pct = song ? Math.min(1, currentTime / song.totalDuration) : 0;

  return (
    <div className="transport-bar">
      <div className="transport-title">
        <span className="app-name">Sanctuary</span>
        <span className="app-sub">Worship Playback Engine</span>
      </div>

      <div className="transport-controls">
        <button
          className={`btn-transport ${isPlaying ? 'active' : ''}`}
          onClick={isPlaying ? onPause : onPlay}
          disabled={isLoading}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="btn-transport"
          onClick={onCountInPlay}
          disabled={isLoading || isPlaying}
          title={`Play with ${countInBars}-bar count-in`}
        >
          🎵
        </button>
        <button
          className="btn-transport"
          onClick={onStop}
          disabled={isLoading}
          title="Stop (Escape)"
        >
          ⏹
        </button>
      </div>

      {/* Beat flash */}
      <div
        className={`beat-flash ${beatInfo?.isAccent ? 'accent' : beatInfo?.flash ? 'beat' : ''}`}
        title="Beat indicator"
      />

      <div className={`time-display ${isPlaying ? 'playing' : ''}`}>
        {formatTime(currentTime)}
      </div>

      {song && (
        <div className="bpm-display">
          {song.bpm} BPM &nbsp;|&nbsp; {song.key}&nbsp;{song.timeSignature.join('/')}
        </div>
      )}

      <div className="count-in-control">
        <span>Count-in:</span>
        <select
          value={countInBars}
          onChange={e => onCountInBarsChange(Number(e.target.value))}
          disabled={isPlaying}
        >
          <option value={1}>1 bar</option>
          <option value={2}>2 bars</option>
          <option value={4}>4 bars</option>
        </select>
      </div>

      <div className="master-vol">
        <span>Master</span>
        <input
          type="range"
          min={0} max={100}
          value={masterVolume}
          onChange={e => onMasterVolumeChange(Number(e.target.value))}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)', minWidth: 26 }}>
          {masterVolume}
        </span>
      </div>

      {/* Count-in overlay */}
      {countInState?.active && (
        <div className="count-in-overlay">
          <div className="count-in-number">
            {countInState.number <= 0 ? 'GO' : countInState.number}
          </div>
          <div className="count-in-label">Count in...</div>
        </div>
      )}
    </div>
  );
}
