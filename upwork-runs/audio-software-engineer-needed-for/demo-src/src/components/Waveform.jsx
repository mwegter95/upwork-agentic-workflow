import { useRef, useEffect, useCallback } from 'react';

export default function Waveform({
  song,
  waveformBuffer,  // AudioBuffer for display
  currentTime,
  isLoading,
  loadProgress,
  onSeek,
  loopState,
  activeCue,
}) {
  const canvasRef = useRef(null);
  const waveDataRef = useRef(null);

  // Pre-compute waveform data when buffer changes
  useEffect(() => {
    if (!waveformBuffer) { waveDataRef.current = null; return; }
    const data = waveformBuffer.getChannelData(0);
    waveDataRef.current = data;
  }, [waveformBuffer]);

  // Draw waveform + playhead on every frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !song) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#161619';
    ctx.fillRect(0, 0, W, H);

    const totalDur = song.totalDuration;

    // Loop region
    if (loopState?.loopActive && loopState.loopIn !== null && loopState.loopOut !== null) {
      const x1 = (loopState.loopIn / totalDur) * W;
      const x2 = (loopState.loopOut / totalDur) * W;
      ctx.fillStyle = 'rgba(240, 168, 48, 0.12)';
      ctx.fillRect(x1, 0, x2 - x1, H);
    }

    // Section markers
    if (song.sections) {
      song.sections.forEach(sec => {
        const x = (sec.startSec / totalDur) * W;
        ctx.strokeStyle = sec.color;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Label
        ctx.fillStyle = sec.color;
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(sec.name, Math.min(x + 3, W - 30), 12);
      });
    }

    // Waveform
    if (waveDataRef.current) {
      const data = waveDataRef.current;
      const step = Math.max(1, Math.floor(data.length / W));
      const amp = H / 2;
      ctx.strokeStyle = '#4A9EFF';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const sample = data[x * step] || 0;
        const y = amp + sample * amp * 0.8;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      // Flat line when no waveform data
      ctx.strokeStyle = '#2A2A33';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
    }

    // Playhead
    const px = (currentTime / totalDur) * W;
    ctx.strokeStyle = '#F0A830';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#F0A830';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, H);
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [song, currentTime, waveformBuffer, loopState]);

  const handleClick = useCallback((e) => {
    if (!song || isLoading) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    onSeek(pct * song.totalDuration);
  }, [song, isLoading, onSeek]);

  // Sync canvas size to display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="waveform-area">
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        onClick={handleClick}
        style={{ cursor: 'crosshair' }}
      />

      {/* Guide cue */}
      <div className={`guide-cue-overlay ${activeCue ? 'visible' : ''}`}>
        {activeCue?.text}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-text">Generating audio...</div>
          <div className="loading-progress">
            <div
              className="loading-progress-bar"
              style={{ width: `${Math.round(loadProgress * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
