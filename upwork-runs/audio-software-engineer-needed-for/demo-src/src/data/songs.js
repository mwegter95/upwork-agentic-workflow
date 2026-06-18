// Song registry — all timing derived from BPM
// barDur = 60/bpm*4, loopDuration = barDur*8 (8-bar loops)

export const SONGS = [
  {
    id: 1,
    slug: 'endless-grace',
    title: 'Endless Grace',
    key: 'A',
    bpm: 72,
    timeSignature: [4, 4],
    barDuration: 3.333,    // 60/72*4
    loopDuration: 26.667,  // 8 bars
    totalDuration: 200,    // 60 bars
    sections: [
      { name: 'Intro',    startSec: 0,      color: '#4A9EFF' },
      { name: 'Verse 1',  startSec: 13.33,  color: '#8A8A95' },
      { name: 'Pre-C',    startSec: 40.0,   color: '#F0A830' },
      { name: 'Chorus',   startSec: 53.33,  color: '#F0A830' },
      { name: 'Verse 2',  startSec: 80.0,   color: '#8A8A95' },
      { name: 'Pre-C',    startSec: 106.67, color: '#F0A830' },
      { name: 'Chorus',   startSec: 120.0,  color: '#F0A830' },
      { name: 'Bridge',   startSec: 146.67, color: '#4A9EFF' },
      { name: 'Outro',    startSec: 173.33, color: '#8A8A95' },
    ],
    cues: [
      { timeSec: 0,      text: 'Count in...' },
      { timeSec: 13.33,  text: 'Your grace is endless, your love remains' },
      { timeSec: 40.0,   text: 'Who am I that you would care?' },
      { timeSec: 53.33,  text: 'Endless grace, unending love' },
      { timeSec: 80.0,   text: 'In every season, still you hold' },
      { timeSec: 106.67, text: 'Who am I that you would care?' },
      { timeSec: 120.0,  text: 'Endless grace, unending love' },
      { timeSec: 146.67, text: 'Nothing can separate us now' },
      { timeSec: 173.33, text: 'Repeat and close...' },
    ],
    synthKey: 'A',
  },
  {
    id: 2,
    slug: 'risen-king',
    title: 'Risen King',
    key: 'G',
    bpm: 132,
    timeSignature: [4, 4],
    barDuration: 1.818,
    loopDuration: 14.545,
    totalDuration: 95,
    sections: [
      { name: 'Intro',        startSec: 0,     color: '#4A9EFF' },
      { name: 'Verse 1',      startSec: 7.27,  color: '#8A8A95' },
      { name: 'Pre-C',        startSec: 21.82, color: '#F0A830' },
      { name: 'Chorus',       startSec: 29.09, color: '#F0A830' },
      { name: 'Verse 2',      startSec: 43.64, color: '#8A8A95' },
      { name: 'Bridge',       startSec: 58.18, color: '#4A9EFF' },
      { name: 'Final Chorus', startSec: 72.73, color: '#F0C030' },
      { name: 'Outro',        startSec: 87.27, color: '#8A8A95' },
    ],
    cues: [
      { timeSec: 0,     text: 'Count in...' },
      { timeSec: 7.27,  text: 'Morning light breaks over every chain' },
      { timeSec: 21.82, text: 'He is alive...' },
      { timeSec: 29.09, text: 'Risen King, death is undone!' },
      { timeSec: 43.64, text: 'Every grave gives up its ground' },
      { timeSec: 58.18, text: 'Bridge, build it out!' },
      { timeSec: 72.73, text: 'BIG FINISH, all out!' },
      { timeSec: 87.27, text: 'Tag it out...' },
    ],
    synthKey: 'G',
  },
  {
    id: 3,
    slug: 'holy-ground',
    title: 'Holy Ground',
    key: 'E',
    bpm: 76,
    timeSignature: [4, 4],
    barDuration: 3.158,    // 60/76*4
    loopDuration: 25.263,  // 8 bars
    totalDuration: 190,    // ~60 bars
    sections: [
      { name: 'Intro',    startSec: 0,      color: '#4A9EFF' },
      { name: 'Verse 1',  startSec: 12.63,  color: '#8A8A95' },
      { name: 'Pre-C',    startSec: 37.9,   color: '#F0A830' },
      { name: 'Chorus',   startSec: 50.53,  color: '#F0A830' },
      { name: 'Verse 2',  startSec: 75.79,  color: '#8A8A95' },
      { name: 'Chorus',   startSec: 101.05, color: '#F0A830' },
      { name: 'Bridge',   startSec: 126.32, color: '#4A9EFF' },
      { name: 'Final',    startSec: 163.16, color: '#F0C030' },
    ],
    cues: [
      { timeSec: 0,      text: 'Count in...' },
      { timeSec: 12.63,  text: 'We stand on holy ground' },
      { timeSec: 37.9,   text: 'Your presence fills this place' },
      { timeSec: 50.53,  text: 'Holy, holy, holy ground' },
      { timeSec: 75.79,  text: 'Every step we take is sacred' },
      { timeSec: 101.05, text: 'Holy, holy, holy ground' },
      { timeSec: 126.32, text: 'Let the anthem rise up!' },
      { timeSec: 163.16, text: 'BIG finish, hold it out...' },
    ],
    synthKey: 'E',
  },
];

export const STEM_CONFIG = [
  { id: 'drums',  label: 'Drums',  color: '#FF6B6B', icon: '🥁' },
  { id: 'bass',   label: 'Bass',   color: '#4ECDC4', icon: '🎸' },
  { id: 'keys',   label: 'Keys',   color: '#45B7D1', icon: '🎹' },
  { id: 'pads',   label: 'Pads',   color: '#96CEB4', icon: '🎵' },
  { id: 'click',  label: 'Click',  color: '#F0A830', icon: '🔔' },
  { id: 'guide',  label: 'Guide',  color: '#DDA0DD', icon: '🎤' },
];

export const ROOT_HZ = { A: 110, G: 98, E: 82.4 };
