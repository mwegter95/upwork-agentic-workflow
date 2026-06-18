export default function ChannelStrip({ stem, config, onVolume, onMute, onSolo, onPan }) {
  const panLabel = stem.pan === 0 ? 'C' : stem.pan > 0 ? `R${Math.round(stem.pan * 100)}` : `L${Math.round(-stem.pan * 100)}`;

  return (
    <div className={`channel-strip ${stem.muted ? 'muted' : ''} ${stem.soloed ? 'soloed' : ''}`}>
      <div className="channel-color-bar" style={{ background: config.color }} />
      <div className="channel-icon">{config.icon}</div>
      <div className="channel-label" style={{ color: stem.muted ? 'var(--text-2)' : config.color }}>
        {config.label}
      </div>

      <div className="fader-wrap">
        <input
          type="range"
          className="fader"
          min={0} max={100}
          value={stem.volume}
          onChange={e => onVolume(Number(e.target.value))}
          title={`Volume: ${stem.volume}`}
          style={{ accentColor: stem.muted ? 'var(--text-2)' : config.color }}
        />
      </div>

      <div className="vol-readout">{stem.volume}</div>

      <div className="pan-wrap">
        <input
          type="range"
          className="pan-knob"
          min={-100} max={100}
          value={Math.round(stem.pan * 100)}
          onChange={e => onPan(Number(e.target.value) / 100)}
          title={`Pan: ${panLabel}`}
          style={{ accentColor: config.color }}
        />
        <div className="pan-label">{panLabel}</div>
      </div>

      <div className="channel-buttons">
        <button
          className={`btn-mute ${stem.muted ? 'muted' : ''}`}
          onClick={onMute}
          title={stem.muted ? 'Unmute' : 'Mute'}
        >
          M
        </button>
        <button
          className={`btn-solo ${stem.soloed ? 'soloed' : ''}`}
          onClick={onSolo}
          title={stem.soloed ? 'Unsolo' : 'Solo'}
        >
          S
        </button>
      </div>
    </div>
  );
}
