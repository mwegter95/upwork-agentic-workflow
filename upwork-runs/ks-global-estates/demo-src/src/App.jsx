import { useState, useMemo, useCallback } from 'react';
import { PROPERTIES } from './data/properties.js';
import Navbar from './components/Navbar.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import PropertyList from './components/PropertyList.jsx';
import PropertyDetail from './components/PropertyDetail.jsx';
import MapView from './components/MapView.jsx';
import FavoritesView from './components/FavoritesView.jsx';

const PRICE_MAX = 25000000;

const DEFAULT_FILTERS = {
  type: [],
  status: 'all',
  priceMin: 0,
  priceMax: PRICE_MAX,
  bedsMin: 0,
  bathsMin: 0,
  region: 'all',
  search: '',
  sort: 'price-desc',
};

function applyFilters(properties, filters) {
  let result = properties.filter(p => {
    if (filters.type.length > 0 && !filters.type.includes(p.type)) return false;
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    if (p.price < filters.priceMin || p.price > filters.priceMax) return false;
    if (filters.bedsMin > 0 && p.beds < filters.bedsMin) return false;
    if (filters.bathsMin > 0 && p.baths < filters.bathsMin) return false;
    if (filters.region !== 'all' && p.region !== filters.region) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !p.title.toLowerCase().includes(q) &&
        !p.city.toLowerCase().includes(q) &&
        !p.country.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  if (filters.sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  else if (filters.sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  else if (filters.sort === 'sqft-desc') result.sort((a, b) => b.sqft - a.sqft);

  return result;
}

export default function App() {
  const [view, setView] = useState('browse');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ks_favorites') || '[]'); } catch { return []; }
  });

  // Persist favorites
  useState(() => {
    localStorage.setItem('ks_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const filteredProperties = useMemo(() => applyFilters(PROPERTIES, filters), [filters]);

  const handleSelectProperty = useCallback((prop) => {
    setSelectedProperty(prop);
    setDetailOpen(true);
    if (view === 'favorites') setView('browse');
  }, [view]);

  const handleToggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('ks_favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  return (
    <div className="app-shell">
      <Navbar
        view={view}
        setView={setView}
        favCount={favorites.length}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {view === 'favorites' ? (
        <div className="main-area">
          <FavoritesView
            properties={PROPERTIES}
            favorites={favorites}
            selectedProperty={selectedProperty}
            onSelectProperty={handleSelectProperty}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      ) : (
        <div className="main-area">
          {/* Mobile filter toggle */}
          <div className="mobile-filter-bar mobile-only">
            <button
              className="mobile-filter-btn"
              onClick={() => setMobileFilterOpen(o => !o)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Filters
              {(filters.type.length > 0 || filters.status !== 'all' || filters.bedsMin > 0 || filters.region !== 'all' || filters.priceMax < PRICE_MAX) && (
                <span className="filter-active-dot"></span>
              )}
            </button>
            <span className="mobile-result-count">{filteredProperties.length} properties</span>
          </div>

          <div className="browse-layout">
            {/* Filter sidebar (desktop always, mobile conditionally) */}
            <div className={`filter-sidebar${mobileFilterOpen ? ' mobile-open' : ''}`}>
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                resultCount={filteredProperties.length}
                onClose={() => setMobileFilterOpen(false)}
              />
            </div>

            {/* Right pane: map + list */}
            <div className="browse-right">
              <div className="map-pane">
                <MapView
                  properties={filteredProperties}
                  selectedProperty={selectedProperty}
                  onSelectProperty={handleSelectProperty}
                />
              </div>
              <div className="list-pane">
                <PropertyList
                  properties={filteredProperties}
                  selectedProperty={selectedProperty}
                  favorites={favorites}
                  onSelectProperty={handleSelectProperty}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {detailOpen && selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          isFavorite={favorites.includes(selectedProperty.id)}
          onToggleFavorite={handleToggleFavorite}
          onClose={closeDetail}
        />
      )}

      <style>{`
        .app-shell {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .main-area {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .browse-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .filter-sidebar {
          display: flex;
          flex-shrink: 0;
          overflow: hidden;
        }
        .browse-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .map-pane {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .list-pane {
          height: 340px;
          flex-shrink: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border-top: 1px solid var(--border);
          background: var(--surface);
        }

        .mobile-filter-bar {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .mobile-filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 500;
          color: var(--ink);
          cursor: pointer;
          padding: 6px 12px;
          position: relative;
          letter-spacing: 0.04em;
        }
        .filter-active-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--gold);
          display: inline-block;
          margin-left: 2px;
        }
        .mobile-result-count {
          font-size: 12px;
          color: var(--mid);
          font-family: var(--font-ui);
        }

        @media (max-width: 768px) {
          .mobile-only { display: flex !important; }
          .browse-layout { flex-direction: column; }
          .filter-sidebar {
            display: none;
            position: absolute;
            top: calc(var(--nav-h) + 41px);
            left: 0;
            right: 0;
            z-index: 300;
            box-shadow: 0 4px 20px rgba(18,16,14,0.15);
          }
          .filter-sidebar.mobile-open { display: flex; }
          .map-pane { min-height: 45vh; flex: none; height: 45vh; }
          .list-pane { height: 0; flex: 1; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}
