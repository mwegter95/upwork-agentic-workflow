import { useState } from 'react';
import { api } from '../api/client.js';

export default function SettingsPanel({ currentHome, onSave, onClose }) {
  const [lat, setLat] = useState(currentHome?.lat ?? '');
  const [lng, setLng] = useState(currentHome?.lng ?? '');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleGeo = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      () => { setError('Could not get location'); setGeoLoading(false); }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) { setError('Enter valid coordinates'); return; }
    if (parsedLat < 43 || parsedLat > 50 || parsedLng < -98 || parsedLng > -89) {
      setError('Coordinates look outside Minnesota. Please check.');
    }
    setLoading(true);
    try {
      await api.put('/mn-parks/user/home', { home_lat: parsedLat, home_lng: parsedLng });
      setSuccess(true);
      onSave({ lat: parsedLat, lng: parsedLng });
      setTimeout(onClose, 800);
    } catch (err) {
      setError('Failed to save home location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <h2 className="settings-title">🏠 Home Location</h2>
        <p className="settings-subtitle">Set your home base to see distances from each park.</p>

        {error && <div className="modal-error" style={{marginBottom:12}}>{error}</div>}
        {success && <div style={{background:'#edf4f0',color:'var(--forest)',borderRadius:5,padding:'8px 12px',fontSize:'0.82rem',marginBottom:12}}>Home location saved!</div>}

        <div className="settings-form">
          <button type="button" className="geo-btn" onClick={handleGeo} disabled={geoLoading}>
            📍 {geoLoading ? 'Getting location...' : 'Use my current location'}
          </button>

          <div style={{textAlign:'center',fontSize:'0.75rem',color:'var(--muted)'}}>or enter coordinates manually</div>

          <form onSubmit={handleSave}>
            <div className="coord-row">
              <div className="form-group">
                <label>Latitude</label>
                <input className="form-input" type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} placeholder="44.9778" />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input className="form-input" type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} placeholder="-93.2650" />
              </div>
            </div>
            <button type="submit" className="btn-navy" disabled={loading} style={{width:'100%',justifyContent:'center',marginTop:4}}>
              {loading ? 'Saving...' : 'Save Home Location'}
            </button>
          </form>
        </div>

        <button className="btn-ghost" onClick={onClose} style={{width:'100%',justifyContent:'center',marginTop:10}}>Cancel</button>
      </div>
    </div>
  );
}
