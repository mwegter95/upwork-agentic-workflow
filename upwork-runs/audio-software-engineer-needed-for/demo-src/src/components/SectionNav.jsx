import { useState } from 'react';

function getActiveSectionIndex(sections, currentTime) {
  if (!sections) return -1;
  let idx = 0;
  for (let i = 0; i < sections.length; i++) {
    if (currentTime >= sections[i].startSec) idx = i;
    else break;
  }
  return idx;
}

export default function SectionNav({ song, currentTime, onSeek, loopState, onLoopChange }) {
  if (!song) return <div className="section-nav" />;

  const activeIdx = getActiveSectionIndex(song.sections, currentTime);
  const { loopActive, loopIn, loopOut } = loopState;

  function setLoopIn() {
    // Set loop-in at current section start
    const sec = song.sections[activeIdx]?.startSec ?? currentTime;
    onLoopChange({ loopActive, loopIn: sec, loopOut: loopOut ?? song.totalDuration });
  }

  function setLoopOut() {
    const nextSec = song.sections[activeIdx + 1]?.startSec ?? song.totalDuration;
    onLoopChange({ loopActive, loopIn: loopIn ?? 0, loopOut: nextSec });
  }

  function toggleLoop() {
    onLoopChange({ loopActive: !loopActive, loopIn, loopOut });
  }

  return (
    <div className="section-nav">
      {song.sections.map((sec, i) => (
        <button
          key={i}
          className={`section-chip ${i === activeIdx ? 'active' : ''}`}
          style={i === activeIdx ? { background: sec.color, borderColor: sec.color } : { borderColor: 'transparent' }}
          onClick={() => onSeek(sec.startSec)}
          title={`Jump to ${sec.name} (${sec.startSec.toFixed(1)}s)`}
        >
          {sec.name}
        </button>
      ))}

      <div className="section-nav-spacer" />

      <div className="ab-controls">
        {loopActive && loopIn !== null && loopOut !== null && (
          <span className="ab-label">
            {loopIn.toFixed(0)}s &rarr; {loopOut.toFixed(0)}s
          </span>
        )}
        <button className={`btn-ab set-a ${loopActive ? 'loop-active' : ''}`} onClick={setLoopIn} title="Set loop-in at current section">
          [A
        </button>
        <button className={`btn-ab set-b ${loopActive ? 'loop-active' : ''}`} onClick={setLoopOut} title="Set loop-out at next section">
          B]
        </button>
        <button
          className={`btn-ab ${loopActive ? 'loop-active' : ''}`}
          style={{ color: loopActive ? 'var(--accent)' : 'var(--text-2)', borderColor: loopActive ? 'var(--accent)' : 'var(--border)', minWidth: 36 }}
          onClick={toggleLoop}
          title="Toggle A/B loop"
        >
          {loopActive ? 'LOOP' : 'LOOP'}
        </button>
      </div>
    </div>
  );
}
