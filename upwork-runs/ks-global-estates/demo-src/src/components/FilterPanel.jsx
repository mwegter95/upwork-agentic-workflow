import { useState, useCallback, useRef } from 'react';
import { TYPES, TYPE_LABELS, REGIONS } from '../data/properties.js';

const PRICE_MAX = 25000000;

function formatPriceShort(v) {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)}M`;
  return `$${(v / 1000).toFixed(0)}K`;
}

export default function FilterPanel({ filters, setFilters, resultCount, onClose }) {
  const debounceRef = useRef(null);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const handleSearch = (e) => {
    const val = e.target.value;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFilter('search', val), 200);
  };

  const toggleType = (t) => {
    setFilters(f => {
      const cur = f.type;
      return { ...f, type: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] };
    });
  };

  const reset = () => setFilters({
    type: [], status: 'all', priceMin: 0, priceMax: PRICE_MAX,
    bedsMin: 0, bathsMin: 0, region: 'all', search: '', sort: 'price-desc'
  });

  const hasActive = filters.type.length > 0 || filters.status !== 'all' ||
    filters.priceMax < PRICE_MAX || filters.priceMin > 0 || filters.bedsMin > 0 ||
    filters.bathsMin > 0 || filters.region !== 'all' || filters.search !== '';

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <div>
          <span className="label-caps">Filters</span>
          <span className="filter-count">{resultCount} {resultCount === 1 ? 'property' : 'properties'}</span>
        </div>
        <div className="filter-header-actions">
          {hasActive && <button className="reset-btn" onClick={reset}>Clear all</button>}
          {onClose && <button className="close-filter-btn" onClick={onClose} aria-label="Close filters">x</button>}
        </div>
      </div>

      <div className="filter-section">
        <input
          className="search-input"
          placeholder="City, country, or title..."
          defaultValue={filters.search}
          onChange={handleSearch}
        />
      </div>

      <div className="filter-section">
        <div className="label-caps filter-label">Sort</div>
        <select
          className="sort-select"
          value={filters.sort}
          onChange={e => setFilter('sort', e.target.value)}
        >
          <option value="price-desc">Price: High to Low</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="sqft-desc">Size: Largest First</option>
        </select>
      </div>

      <div className="filter-section">
        <div className="label-caps filter-label">Property type</div>
        <div className="pill-group">
          {TYPES.map(t => (
            <button
              key={t}
              className={`pill${filters.type.includes(t) ? ' active' : ''}`}
              onClick={() => toggleType(t)}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="label-caps filter-label">Status</div>
        <div className="pill-group">
          {['all', 'for-sale', 'sold', 'leased'].map(s => (
            <button
              key={s}
              className={`pill${filters.status === s ? ' active' : ''}`}
              onClick={() => setFilter('status', s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="label-caps filter-label">Region</div>
        <div className="pill-group">
          {REGIONS.map(r => (
            <button
              key={r}
              className={`pill${filters.region === (r === 'All' ? 'all' : r) ? ' active' : ''}`}
              onClick={() => setFilter('region', r === 'All' ? 'all' : r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="label-caps filter-label">
          Price range: {formatPriceShort(filters.priceMin)} to {formatPriceShort(filters.priceMax)}
        </div>
        <div className="price-pills">
          {[
            { label: 'Any', min: 0, max: PRICE_MAX },
            { label: 'Under $5M', min: 0, max: 5000000 },
            { label: '$5M to $10M', min: 5000000, max: 10000000 },
            { label: '$10M to $15M', min: 10000000, max: 15000000 },
            { label: '$15M+', min: 15000000, max: PRICE_MAX },
          ].map(p => (
            <button
              key={p.label}
              className={`pill${filters.priceMin === p.min && filters.priceMax === p.max ? ' active' : ''}`}
              onClick={() => setFilters(f => ({ ...f, priceMin: p.min, priceMax: p.max }))}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="label-caps filter-label">Bedrooms</div>
        <div className="pill-group">
          {[0, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              className={`pill${filters.bedsMin === n ? ' active' : ''}`}
              onClick={() => setFilter('bedsMin', n)}
            >
              {n === 0 ? 'Any' : `${n}+`}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="label-caps filter-label">Bathrooms</div>
        <div className="pill-group">
          {[0, 3, 4, 5].map(n => (
            <button
              key={n}
              className={`pill${filters.bathsMin === n ? ' active' : ''}`}
              onClick={() => setFilter('bathsMin', n)}
            >
              {n === 0 ? 'Any' : `${n}+`}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .filter-panel {
          width: var(--filter-w);
          min-width: var(--filter-w);
          background: var(--surface);
          border-right: 1px solid var(--border);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 12px;
          border-bottom: 1px solid var(--border);
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-count {
          display: block;
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 300;
          color: var(--ink);
          margin-top: 2px;
        }
        .filter-header-actions { display: flex; align-items: center; gap: 8px; }
        .reset-btn {
          background: none;
          border: none;
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 500;
          color: var(--gold);
          cursor: pointer;
          padding: 4px 0;
          letter-spacing: 0.04em;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .close-filter-btn {
          background: none;
          border: 1px solid var(--border);
          color: var(--mid);
          font-size: 12px;
          cursor: pointer;
          border-radius: var(--radius-sm);
          padding: 4px 8px;
          font-family: var(--font-ui);
        }
        .filter-section {
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
        }
        .filter-label { margin-bottom: 8px; }
        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          font-family: var(--font-ui);
          font-size: 13px;
          color: var(--ink);
          background: var(--canvas);
          outline: none;
          transition: border-color var(--transition);
        }
        .search-input:focus { border-color: var(--gold); }
        .sort-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          font-family: var(--font-ui);
          font-size: 13px;
          color: var(--ink);
          background: var(--canvas);
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236B6560'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }
        .pill-group, .price-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .pill {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 500;
          padding: 5px 10px;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--mid);
          cursor: pointer;
          transition: all var(--transition);
          white-space: nowrap;
          letter-spacing: 0.02em;
        }
        .pill:hover { border-color: var(--gold); color: var(--gold); }
        .pill.active {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--surface);
        }
        @media (max-width: 768px) {
          .filter-panel {
            width: 100%;
            min-width: unset;
            border-right: none;
            border-bottom: 1px solid var(--border);
            max-height: 60vh;
          }
        }
      `}</style>
    </div>
  );
}
