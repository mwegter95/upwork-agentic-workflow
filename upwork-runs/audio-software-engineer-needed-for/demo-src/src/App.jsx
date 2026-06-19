import { useState, useEffect, useRef, useCallback } from 'react';
import { SONGS } from './data/songs.js';
import { AudioEngine } from './engine/AudioEngine.js';
import { Scheduler } from './engine/Scheduler.js';
import Transport from './components/Transport.jsx';
import SongSelector from './components/SongSelector.jsx';
import SectionNav from './components/SectionNav.jsx';
import Waveform from './components/Waveform.jsx';
import Mixer from './components/Mixer.jsx';
import './styles/app.css';

const engine = new AudioEngine();

export default function App() {
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [stemState, setStemState] = useState({});
  const [waveformBuffer, setWaveformBuffer] = useState(null);
  const [masterVolume, setMasterVolume] = useState(90);
  const [countInBars, setCountInBars] = useState(2);
  const [countInState, setCountInState] = useState(null);
  const [beatInfo, setBeatInfo] = useState({ beat: 0, isAccent: false, flash: false });
  const [activeCue, setActiveCue] = useState(null);
  const [loopState, setLoopState] = useState({ loopActive: false, loopIn: null, loopOut: null });
  const schedulerRef = useRef(null);
  const cueTimerRef = useRef(null);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  // Wire engine time callback
  useEffect(() => {
    engine.onTimeUpdate = (t) => setCurrentTime(t);
    return () => { engine.onTimeUpdate = null; };
  }, []);

  // Load first song on mount
  useEffect(() => {
    loadSong(SONGS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSong(s) {
    if (isLoading) return;
    stopAll();
    setSong(null);
    setIsLoading(true);
    setLoadProgress(0);
    setActiveCue(null);
    setWaveformBuffer(null);
    setStemState({});

    const stems = await engine.loadSong(s, (p) => setLoadProgress(p));

    setWaveformBuffer(stems['drums']?.buffer ?? stems['pads']?.buffer ?? Object.values(stems)[0]?.buffer ?? null);

    // Build initial stemState for UI, set default volumes
    const state = {};
    Object.keys(stems).forEach(id => {
      state[id] = { volume: 80, muted: false, soloed: false, pan: 0 };
      engine.setVolume(id, 80);
    });
    setStemState(state);
    setSong(s);
    setIsLoading(false);
    setCurrentTime(0);
    setLoopState({ loopActive: false, loopIn: null, loopOut: null });
  }

  function _initScheduler(s) {
    if (!engine.ctx) return;
    if (schedulerRef.current) schedulerRef.current.stop();
    schedulerRef.current = new Scheduler(engine.ctx, s.bpm, {
      onBeat: (beat) => {
        const isAccent = beat % 4 === 0;
        setBeatInfo({ beat, isAccent, flash: true });
        setTimeout(() => setBeatInfo(b => ({ ...b, flash: false })), 80);
      },
      onCue: (cue) => {
        setActiveCue(cue);
        clearTimeout(cueTimerRef.current);
        cueTimerRef.current = setTimeout(() => setActiveCue(null), 3500);
      },
    });
  }

  const handlePlay = useCallback(() => {
    if (!song || isLoading) return;
    engine.play();
    setIsPlaying(true);
    _initScheduler(song);
    schedulerRef.current?.setCues(song.cues);
    schedulerRef.current?.start(song.cues);
    schedulerRef.current?.seekTo(engine.pauseOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song, isLoading]);

  const handlePause = useCallback(() => {
    engine.pause();
    setIsPlaying(false);
    schedulerRef.current?.stop();
  }, []);

  function stopAll() {
    engine.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveCue(null);
    schedulerRef.current?.stop();
  }

  const handleStop = useCallback(() => stopAll(), []);

  const handleCountInPlay = useCallback(async () => {
    if (!song || isLoading || isPlaying) return;
    // Ensure AudioContext exists (user gesture required on iOS/Safari)
    engine._ensureContext();

    const { beatDur, countInDurationMs } = await engine.countIn(countInBars, song.bpm);

    // Animate count-in overlay
    let countdown = countInBars * 4;
    setCountInState({ active: true, number: countInBars });
    const iv = setInterval(() => {
      countdown--;
      setCountInState({ active: true, number: countdown <= 0 ? 0 : Math.ceil(countdown / 4) });
      if (countdown <= 0) { clearInterval(iv); setTimeout(() => setCountInState(null), 200); }
    }, beatDur * 1000);

    setTimeout(() => {
      engine.play();
      setIsPlaying(true);
      _initScheduler(song);
      schedulerRef.current?.setCues(song.cues);
      schedulerRef.current?.start(song.cues);
      schedulerRef.current?.seekTo(0);
    }, countInDurationMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song, isLoading, isPlaying, countInBars]);

  const handleSeek = useCallback((sec) => {
    engine.seek(sec);
    if (isPlayingRef.current && schedulerRef.current) {
      schedulerRef.current.seekTo(sec);
    }
  }, []);

  const handleVolume = useCallback((id, val) => {
    engine.setVolume(id, val);
    setStemState(prev => ({ ...prev, [id]: { ...prev[id], volume: val } }));
  }, []);

  const handleMute = useCallback((id) => {
    setStemState(prev => {
      const muted = !prev[id].muted;
      engine.setMute(id, muted);
      return { ...prev, [id]: { ...prev[id], muted } };
    });
  }, []);

  const handleSolo = useCallback((id) => {
    setStemState(prev => {
      const soloed = !prev[id].soloed;
      engine.setSolo(id, soloed);
      return { ...prev, [id]: { ...prev[id], soloed } };
    });
  }, []);

  const handlePan = useCallback((id, pan) => {
    engine.setPan(id, pan);
    setStemState(prev => ({ ...prev, [id]: { ...prev[id], pan } }));
  }, []);

  const handleMasterVolume = useCallback((val) => {
    engine.setMasterVolume(val);
    setMasterVolume(val);
  }, []);

  const handleLoopChange = useCallback((newLoop) => {
    setLoopState(newLoop);
    engine.setLoop(newLoop.loopActive, newLoop.loopIn ?? 0, newLoop.loopOut ?? 0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        isPlayingRef.current ? handlePause() : handlePlay();
      }
      if (e.code === 'Escape') handleStop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePlay, handlePause, handleStop]);

  // Cleanup
  useEffect(() => {
    return () => {
      schedulerRef.current?.stop();
      engine.destroy();
    };
  }, []);

  return (
    <div className="app-shell">
      <Transport
        song={song}
        isPlaying={isPlaying}
        isLoading={isLoading}
        currentTime={currentTime}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onCountInPlay={handleCountInPlay}
        countInBars={countInBars}
        onCountInBarsChange={setCountInBars}
        masterVolume={masterVolume}
        onMasterVolumeChange={handleMasterVolume}
        beatInfo={beatInfo}
        countInState={countInState}
      />

      <SongSelector
        songs={SONGS}
        activeSong={song}
        onSelect={loadSong}
        isLoading={isLoading}
      />

      <SectionNav
        song={song}
        currentTime={currentTime}
        onSeek={handleSeek}
        loopState={loopState}
        onLoopChange={handleLoopChange}
      />

      <Waveform
        song={song}
        waveformBuffer={waveformBuffer}
        currentTime={currentTime}
        isLoading={isLoading}
        loadProgress={loadProgress}
        onSeek={handleSeek}
        loopState={loopState}
        activeCue={activeCue}
      />

      <Mixer
        song={song}
        stemState={stemState}
        onVolume={handleVolume}
        onMute={handleMute}
        onSolo={handleSolo}
        onPan={handlePan}
      />
    </div>
  );
}
