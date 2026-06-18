export default function SongSelector({ songs, activeSong, onSelect, isLoading }) {
  return (
    <div className="song-selector">
      {songs.map(song => (
        <button
          key={song.id}
          className={`song-chip ${activeSong?.id === song.id ? 'active' : ''}`}
          onClick={() => onSelect(song)}
          disabled={isLoading}
        >
          <span>{song.title}</span>
          <span className="song-meta">&nbsp;{song.key} &middot; {song.bpm} BPM &middot; {song.timeSignature.join('/')}</span>
        </button>
      ))}
    </div>
  );
}
