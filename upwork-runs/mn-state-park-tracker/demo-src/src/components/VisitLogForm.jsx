import { useState } from 'react';
import { api, resizeImage } from '../api/client.js';

export default function VisitLogForm({ parkId, existingVisit, onSaved, onCancel }) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(existingVisit?.date_visited || today);
  const [attendees, setAttendees] = useState(existingVisit?.attendees || '');
  const [notes, setNotes] = useState(existingVisit?.notes || '');
  const [pendingPhotos, setPendingPhotos] = useState([]);  // {file, preview, blob}
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setError('');
    setProcessing(true);
    // Process each file independently (incl. iPhone HEIC conversion) so one bad
    // file never blocks the rest of a multi-photo selection.
    const added = [];
    const failed = [];
    for (const file of files) {
      try {
        const blob = await resizeImage(file);
        added.push({ file, preview: URL.createObjectURL(blob), blob });
      } catch (err) {
        failed.push(file.name || 'photo');
      }
    }
    if (added.length) setPendingPhotos(prev => [...prev, ...added]);
    if (failed.length) setError(`Couldn't add ${failed.length} photo${failed.length > 1 ? 's' : ''}: ${failed.join(', ')}`);
    setProcessing(false);
  };

  const removePending = (idx) => {
    setPendingPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);
    try {
      let visitId = existingVisit?.id;
      if (!visitId) {
        const res = await api.post('/mn-parks/visits', { park_id: parkId, date_visited: date, attendees, notes }, true);
        visitId = res.id;
      } else {
        await api.patch(`/mn-parks/visits/${visitId}`, { date_visited: date, attendees, notes });
      }
      // Upload pending photos
      for (const p of pendingPhotos) {
        await api.uploadPhoto(visitId, p.blob);
        URL.revokeObjectURL(p.preview);
      }
      onSaved(visitId);
    } catch (err) {
      let msg = err.message || 'Save failed';
      try { const parsed = JSON.parse(msg); msg = parsed.error || msg; } catch {}
      setError(msg);
      setUploading(false);
    }
  };

  return (
    <form className="visit-form" onSubmit={handleSubmit}>
      {error && <div className="modal-error">{error}</div>}

      <div className="form-group">
        <label>Date Visited</label>
        <input className="form-input" type="date" value={date} max={today} onChange={e => setDate(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Who came along?</label>
        <input className="form-input" type="text" value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="e.g. Sarah, Tom, the kids..." />
      </div>

      <div className="form-group">
        <label>Memory note</label>
        <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="What made this visit memorable?" rows={3} />
      </div>

      <div className="form-group">
        <label>Photos</label>
        <label className="photo-upload-label">
          <span>📷</span>
          <span>{processing ? 'Processing photos…' : 'Add photos from camera roll'}</span>
          <input type="file" accept="image/*,.heic,.heif" multiple style={{display:'none'}} onChange={handlePhotoSelect} disabled={processing} />
        </label>
        {pendingPhotos.length > 0 && (
          <div className="upload-preview-grid">
            {pendingPhotos.map((p, i) => (
              <div key={i} className="upload-preview-item" style={{position:'relative'}}>
                <img src={p.preview} alt="" />
                <button type="button" className="photo-delete-btn" style={{opacity:1}} onClick={() => removePending(i)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{display:'flex',gap:8}}>
        <button type="submit" className="btn-gold" disabled={uploading} style={{flex:1,justifyContent:'center'}}>
          {uploading ? 'Saving...' : existingVisit ? 'Update Visit' : '✓ Log Visit'}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={uploading}>Cancel</button>
      </div>
    </form>
  );
}
