import ChannelStrip from './ChannelStrip.jsx';

export default function Mixer({ song, stemState, onVolume, onMute, onSolo, onPan }) {
  if (!stemState || !song || Object.keys(stemState).length === 0) {
    return (
      <div className="mixer" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-2)', fontSize: 12 }}>Load a song to see the mixer</span>
      </div>
    );
  }

  return (
    <div className="mixer">
      {song.stems.map(config => {
        const stem = stemState[config.id];
        if (!stem) return null;
        return (
          <ChannelStrip
            key={config.id}
            config={config}
            stem={stem}
            onVolume={val => onVolume(config.id, val)}
            onMute={() => onMute(config.id)}
            onSolo={() => onSolo(config.id)}
            onPan={val => onPan(config.id, val)}
          />
        );
      })}
    </div>
  );
}
