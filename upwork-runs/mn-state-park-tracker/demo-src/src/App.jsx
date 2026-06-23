import { useState, useEffect, useCallback } from 'react';
import { MN_PARKS } from './data/parks.js';
import { api } from './api/client.js';
import AuthModal from './components/AuthModal.jsx';
import MapView from './components/MapView.jsx';
import ParkList from './components/ParkList.jsx';
import ParkDrawer from './components/ParkDrawer.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('mn_parks_token'));
  const [email, setEmail] = useState(() => localStorage.getItem('mn_parks_email') || '');
  const [visits, setVisits] = useState([]);
  const [homeLoc, setHomeLoc] = useState(null);
  const [selectedPark, setSelectedPark] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileView, setMobileView] = useState('map');
  const [loading, setLoading] = useState(true);

  const handleAuth = (tok, em) => {
    setToken(tok);
    setEmail(em);
  };

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [visitsData, homeData] = await Promise.all([
        api.get('/mn-parks/visits'),
        api.get('/mn-parks/user/home'),
      ]);
      setVisits(visitsData);
      if (homeData.home_lat !== null) {
        setHomeLoc({ lat: homeData.home_lat, lng: homeData.home_lng });
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid token') || msg.includes('expired')) {
        localStorage.removeItem('mn_parks_token');
        localStorage.removeItem('mn_parks_email');
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSignOut = () => {
    localStorage.removeItem('mn_parks_token');
    localStorage.removeItem('mn_parks_email');
    setToken(null);
    setEmail('');
    setVisits([]);
    setHomeLoc(null);
    setSelectedPark(null);
  };

  const handleSelectPark = (park) => {
    setSelectedPark(park);
    if (mobileView === 'list') setMobileView('map');
  };

  const handleVisitChange = () => loadData();

  const handleHomeSave = (loc) => {
    setHomeLoc(loc);
    setShowSettings(false);
  };

  if (!token) return <AuthModal onAuth={handleAuth} />;

  const visitedIds = new Set(visits.map(v => v.park_id));
  const visitedCount = visitedIds.size;
  const totalParks = MN_PARKS.length;
  const pct = Math.round((visitedCount / totalParks) * 100);

  return (
    <div className="app-root">
      <header className="app-header">
        <span className="header-logo">🌲</span>
        <h1 className="header-title">MN Park <span>Tracker</span></h1>
        <div className="header-stats">
          <div className="header-stat"><strong>{visitedCount}</strong> / {totalParks} parks</div>
          <div className="header-stat"><strong>{pct}%</strong> explored</div>
        </div>
        <div className="header-actions">
          <button className="btn-icon" title="Set home location" onClick={() => setShowSettings(true)}>🏠</button>
          <button className="btn-icon" title={`Signed in as ${email} — click to sign out`} onClick={handleSignOut}>👤</button>
        </div>
      </header>

      <ParkList
        parks={MN_PARKS}
        visits={visits}
        selectedPark={selectedPark}
        homeLoc={homeLoc}
        onSelectPark={handleSelectPark}
        className={mobileView === 'list' ? 'mobile-visible' : ''}
      />

      <div className="map-panel">
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',background:'var(--page-bg)'}}>
            <div className="spinner" />
          </div>
        ) : (
          <MapView
            parks={MN_PARKS}
            visits={visits}
            selectedPark={selectedPark}
            homeLoc={homeLoc}
            onSelectPark={handleSelectPark}
          />
        )}

        <div className={`park-drawer${selectedPark ? ' open' : ''}`}>
          {selectedPark && (
            <ParkDrawer
              park={selectedPark}
              visits={visits}
              homeLoc={homeLoc}
              onClose={() => setSelectedPark(null)}
              onVisitChange={handleVisitChange}
            />
          )}
        </div>
      </div>

      <nav className="mobile-tab-bar">
        <button className={`mobile-tab${mobileView === 'map' ? ' active' : ''}`} onClick={() => setMobileView('map')}>
          <span className="icon">🗺</span><span>Map</span>
        </button>
        <button className={`mobile-tab${mobileView === 'list' ? ' active' : ''}`} onClick={() => { setMobileView('list'); setSelectedPark(null); }}>
          <span className="icon">📋</span><span>List</span>
        </button>
        <button className="mobile-tab" onClick={() => setShowSettings(true)}>
          <span className="icon">🏠</span><span>Home</span>
        </button>
        <button className="mobile-tab" onClick={handleSignOut}>
          <span className="icon">👤</span><span>Sign Out</span>
        </button>
      </nav>

      {showSettings && (
        <SettingsPanel
          currentHome={homeLoc}
          onSave={handleHomeSave}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
