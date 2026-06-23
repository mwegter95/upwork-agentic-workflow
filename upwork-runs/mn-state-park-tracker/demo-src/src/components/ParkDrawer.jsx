import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { haversine, formatDist, distColor } from '../utils/haversine.js';
import VisitLogForm from './VisitLogForm.jsx';

function PhotoGrid({ visit, onPhotoDeleted }) {
  const [lightbox, setLightbox] = useState(null);
  const [loaded, setLoaded] = useState({});

  if (!visit.photo_ids || visit.photo_ids.length === 0) return null;

  return (
    <>
      <div className="photo-grid">
        {visit.photo_ids.map(pid => {
          const url = api.photoUrl(visit.id, pid);
          return (
            <div key={pid} className="photo-grid-item">
              <img
                src={url}
                alt=""
                className={loaded[pid] ? '' : 'loading'}
                onLoad={() => setLoaded(prev => ({...prev, [pid]: true}))}
                onClick={() => setLightbox(url)}
              />
              <button
                className="photo-delete-btn"
                title="Delete photo"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm('Delete this photo?')) return;
                  try {
                    await api.delete(`/mn-parks/visits/${visit.id}/photos/${pid}`);
                    onPhotoDeleted(visit.id, pid);
                  } catch {}
                }}
              >✕</button>
            </div>
          );
        })}
      </div>
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" onClick={e => e.stopPropagation()} />
          <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </>
  );
}

function VisitCard({ visit, onDeleted, onPhotoDeleted }) {
  const [editing, setEditing] = useState(false);

  const dateStr = visit.date_visited
    ? new Date(visit.date_visited + 'T12:00:00').toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    : 'Date unknown';

  if (editing) {
    return (
      <div className="visit-card">
        <VisitLogForm
          parkId={visit.park_id}
          existingVisit={visit}
          onSaved={() => { setEditing(false); onDeleted(visit.id, true); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="visit-card">
      <div className="visit-card-header">
        <div>
          <div className="visit-date">{dateStr}</div>
          {visit.attendees && <div className="visit-attendees">👥 {visit.attendees}</div>}
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <button className="btn-ghost" style={{padding:'3px 8px',fontSize:'0.75rem'}} onClick={() => setEditing(true)}>Edit</button>
          <button className="btn-danger" onClick={async () => {
            if (!confirm('Delete this visit?')) return;
            try {
              await api.delete(`/mn-parks/visits/${visit.id}`);
              onDeleted(visit.id);
            } catch {}
          }}>Delete</button>
        </div>
      </div>
      {visit.notes && <div className="visit-notes">{visit.notes}</div>}
      <PhotoGrid visit={visit} onPhotoDeleted={onPhotoDeleted} />
    </div>
  );
}

export default function ParkDrawer({ park, visits, homeLoc, onClose, onVisitChange }) {
  const [tab, setTab] = useState('info');  // 'info' | 'visits' | 'log'
  const [localVisits, setLocalVisits] = useState([]);

  useEffect(() => {
    if (!park) return;
    const pv = visits.filter(v => v.park_id === park.id);
    setLocalVisits(pv);
    setTab(pv.length > 0 ? 'visits' : 'info');
  }, [park, visits]);

  if (!park) return null;

  const dist = homeLoc ? haversine(homeLoc.lat, homeLoc.lng, park.lat, park.lng) : null;
  const isVisited = localVisits.length > 0;

  const handleVisitSaved = (visitId) => {
    onVisitChange();
    setTab('visits');
  };

  const handleVisitDeleted = (visitId, refresh = false) => {
    if (refresh) { onVisitChange(); return; }
    onVisitChange();
  };

  const handlePhotoDeleted = (visitId, photoId) => {
    setLocalVisits(prev => prev.map(v => {
      if (v.id !== visitId) return v;
      return { ...v, photo_ids: (v.photo_ids || []).filter(pid => pid !== photoId) };
    }));
  };

  const typeLabel = park.type === 'state-recreation-area' ? 'State Recreation Area' : 'State Park';

  return (
    <>
      <div className="drawer-hero">
        <button className="drawer-close" onClick={onClose}>✕</button>
        <div className="drawer-type-badge">{typeLabel}</div>
        <div className="drawer-park-name">{park.name}</div>
        <div className="drawer-meta-row">
          <div className="drawer-meta-item">📍 {park.county} County</div>
          <div className="drawer-meta-item">🗺 {park.region}</div>
          <div className="drawer-meta-item">🌲 {park.acres.toLocaleString()} acres</div>
          {dist !== null && (
            <div className="drawer-dist" style={{color: distColor(dist) === 'var(--muted)' ? 'rgba(255,255,255,0.7)' : '#fff'}}>
              {formatDist(dist)} from home
            </div>
          )}
        </div>
      </div>

      <div className="drawer-tabs">
        <button className={`drawer-tab${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>Info</button>
        <button className={`drawer-tab${tab === 'visits' ? ' active' : ''}`} onClick={() => setTab('visits')}>
          Visits {localVisits.length > 0 ? `(${localVisits.length})` : ''}
        </button>
        <button className={`drawer-tab${tab === 'log' ? ' active' : ''}`} onClick={() => setTab('log')}>
          + Log Visit
        </button>
      </div>

      <div className="drawer-body">
        {tab === 'info' && (
          <>
            <p className="drawer-description">{park.description}</p>
            <div className="drawer-section-label">Amenities</div>
            <div className="amenity-chips">
              {park.amenities.map(a => <span key={a} className="amenity-chip">{a}</span>)}
            </div>
            {!isVisited && (
              <button className="btn-gold" style={{width:'100%',justifyContent:'center'}} onClick={() => setTab('log')}>
                🌲 Log Your First Visit
              </button>
            )}
            {isVisited && (
              <div style={{padding:'10px 14px',background:'#EDF4F0',borderRadius:6,display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:'1.2rem'}}>✅</span>
                <div>
                  <div style={{fontSize:'0.83rem',fontWeight:600,color:'var(--forest)'}}>You've been here!</div>
                  <div style={{fontSize:'0.75rem',color:'var(--muted)'}}>
                    {localVisits.length} visit{localVisits.length !== 1 ? 's' : ''} logged
                  </div>
                </div>
              </div>
            )}
            <a
              href={`https://www.dnr.state.mn.us/state_parks/${park.slug}/index.html`}
              target="_blank"
              rel="noopener noreferrer"
              style={{display:'block',marginTop:12,fontSize:'0.8rem',color:'var(--teal)',textDecoration:'none'}}
            >
              View on MN DNR website ↗
            </a>
          </>
        )}

        {tab === 'visits' && (
          <>
            {localVisits.length === 0 ? (
              <div className="empty-state">
                <div className="emoji">🗺</div>
                <p>No visits logged yet.</p>
                <button className="btn-gold" style={{marginTop:12}} onClick={() => setTab('log')}>Log a Visit</button>
              </div>
            ) : (
              <div className="visit-list">
                {localVisits.map(v => (
                  <VisitCard
                    key={v.id}
                    visit={v}
                    onDeleted={handleVisitDeleted}
                    onPhotoDeleted={handlePhotoDeleted}
                  />
                ))}
                <button className="btn-ghost" style={{justifyContent:'center'}} onClick={() => setTab('log')}>
                  + Add Another Visit
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'log' && (
          <VisitLogForm
            parkId={park.id}
            onSaved={handleVisitSaved}
            onCancel={() => setTab(localVisits.length > 0 ? 'visits' : 'info')}
          />
        )}
      </div>
    </>
  );
}
