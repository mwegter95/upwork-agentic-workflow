import { useState, useMemo } from 'react';
import { haversine, formatDist, distColor } from '../utils/haversine.js';

export default function ParkList({ parks, visits, selectedPark, homeLoc, onSelectPark, className }) {
  const [filter, setFilter] = useState('all');  // 'all' | 'visited' | 'unvisited'
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('alpha');  // 'alpha' | 'dist' | 'region'

  const visitedIds = useMemo(() => new Set(visits.map(v => v.park_id)), [visits]);

  const parksWithDist = useMemo(() => parks.map(p => ({
    ...p,
    dist: homeLoc ? haversine(homeLoc.lat, homeLoc.lng, p.lat, p.lng) : null,
    isVisited: visitedIds.has(p.id),
  })), [parks, homeLoc, visitedIds]);

  const filtered = useMemo(() => {
    let list = parksWithDist;
    if (filter === 'visited') list = list.filter(p => p.isVisited);
    if (filter === 'unvisited') list = list.filter(p => !p.isVisited);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.county.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'alpha') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'dist' && homeLoc) list = [...list].sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
    if (sortBy === 'region') list = [...list].sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));
    return list;
  }, [parksWithDist, filter, search, sortBy]);

  return (
    <div className={`list-panel ${className || ''}`}>
      <div className="filter-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Search parks, regions, counties..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-chips">
          {['all','visited','unvisited'].map(f => (
            <button key={f} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${parks.length})` : f === 'visited' ? `Visited (${visitedIds.size})` : `Unvisited (${parks.length - visitedIds.size})`}
            </button>
          ))}
        </div>
        <div className="sort-row">
          <span>Sort:</span>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="alpha">A-Z</option>
            {homeLoc && <option value="dist">Distance</option>}
            <option value="region">Region</option>
          </select>
          <span className="park-count">{filtered.length} parks</span>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="emoji">🔍</div>
          <p>No parks match your search.</p>
        </div>
      )}

      {filtered.map(park => (
        <div
          key={park.id}
          className={`park-row${selectedPark?.id === park.id ? ' active' : ''}`}
          onClick={() => onSelectPark(park)}
        >
          <div className={`pin-dot${park.isVisited ? ' visited' : ' unvisited'}`} />
          <div className="park-row-info">
            <div className="park-row-name">{park.name}</div>
            <div className="park-row-meta">
              <span className="park-row-region">{park.region}</span>
              {park.isVisited && <span className="visited-badge">✓ Visited</span>}
            </div>
          </div>
          {park.dist !== null && (
            <span className="dist-badge" style={{color: distColor(park.dist)}}>
              {formatDist(park.dist)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
