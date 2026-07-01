import { useState } from 'react';
import { TYPE_LABELS } from '../data/properties.js';

export default function PropertyDetail({ property, isFavorite, onToggleFavorite, onClose }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [inquirySent, setInquirySent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  if (!property) return null;

  const { title, type, status, priceLabel, beds, baths, sqft, city, country, region, description, features, images } = property;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.name && form.email) setInquirySent(true);
  };

  return (
    <div className="detail-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="detail-panel fade-up">
        <div className="detail-header">
          <button className="detail-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="detail-header-meta">
            <span className="label-caps">{TYPE_LABELS[type]} · {region}</span>
            <button
              className={`detail-fav${isFavorite ? ' active' : ''}`}
              onClick={() => onToggleFavorite(property.id)}
            >
              {isFavorite ? '♥ Saved' : '♡ Save'}
            </button>
          </div>
        </div>

        <div className="detail-gallery">
          <div className="gallery-hero" style={{ backgroundImage: `url(${images[imgIdx]})` }}>
            <span className={`status-badge ${status} gallery-badge`}>
              {status === 'for-sale' ? 'For Sale' : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            {images.length > 1 && (
              <div className="gallery-dots">
                {images.map((_, i) => (
                  <button
                    key={i}
                    className={`gallery-dot${i === imgIdx ? ' active' : ''}`}
                    onClick={() => setImgIdx(i)}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`gallery-thumb${i === imgIdx ? ' active' : ''}`}
                  onClick={() => setImgIdx(i)}
                  style={{ backgroundImage: `url(${img})` }}
                  aria-label={`View image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="detail-body">
          <div className="detail-city label-caps">{city}, {country}</div>
          <h2 className="detail-title">{title}</h2>

          <div className="detail-price-row">
            <span className="detail-price">{priceLabel}</span>
            <div className="detail-specs">
              <span>{beds} bed</span>
              <span className="spec-dot"></span>
              <span>{baths} bath</span>
              <span className="spec-dot"></span>
              <span>{sqft.toLocaleString()} sqft</span>
            </div>
          </div>

          <div className="gold-rule" style={{ margin: '16px 0' }} />

          <p className="detail-desc">{description}</p>

          <div className="detail-features">
            <div className="label-caps" style={{ marginBottom: 10 }}>Property features</div>
            <ul className="feature-list">
              {features.map((f, i) => (
                <li key={i} className="feature-item">
                  <span className="feature-check">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="detail-inquiry">
            <div className="label-caps inquiry-heading">Request information</div>
            {inquirySent ? (
              <div className="inquiry-success">
                <p>Thank you, <strong>{form.name}</strong>. An advisor will contact you at <strong>{form.email}</strong> shortly.</p>
              </div>
            ) : (
              <form className="inquiry-form" onSubmit={handleSubmit}>
                <input
                  className="inquiry-input"
                  placeholder="Full name"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
                <input
                  className="inquiry-input"
                  type="email"
                  placeholder="Email address"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
                <textarea
                  className="inquiry-input inquiry-textarea"
                  placeholder="Your message (optional)"
                  rows={3}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
                <button type="submit" className="btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                  Send Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .detail-overlay {
          position: fixed;
          inset: 0;
          background: rgba(18,16,14,0.45);
          z-index: 500;
          display: flex;
          align-items: stretch;
          justify-content: flex-end;
        }
        .detail-panel {
          width: min(var(--detail-w), 100vw);
          background: var(--surface);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          box-shadow: -8px 0 40px rgba(18,16,14,0.2);
        }
        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--surface);
          z-index: 10;
        }
        .detail-close {
          background: none;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          color: var(--mid);
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition);
        }
        .detail-close:hover { color: var(--ink); border-color: var(--ink); }
        .detail-header-meta { display: flex; align-items: center; gap: 12px; }
        .detail-fav {
          background: none;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 500;
          color: var(--mid);
          cursor: pointer;
          padding: 5px 10px;
          transition: all var(--transition);
          letter-spacing: 0.04em;
        }
        .detail-fav:hover { border-color: var(--gold); color: var(--gold); }
        .detail-fav.active { color: #C0392B; border-color: #C0392B; background: rgba(192,57,43,0.05); }
        .detail-gallery { flex-shrink: 0; }
        .gallery-hero {
          height: 240px;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .gallery-badge { position: absolute; top: 12px; left: 12px; }
        .gallery-dots {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 5px;
        }
        .gallery-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: background var(--transition);
        }
        .gallery-dot.active { background: white; }
        .gallery-thumbs {
          display: flex;
          gap: 2px;
          height: 64px;
          overflow: hidden;
        }
        .gallery-thumb {
          flex: 1;
          background-size: cover;
          background-position: center;
          border: none;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity var(--transition);
          padding: 0;
        }
        .gallery-thumb:hover, .gallery-thumb.active { opacity: 1; }
        .detail-body { padding: 20px; display: flex; flex-direction: column; gap: 0; }
        .detail-city { margin-bottom: 4px; }
        .detail-title {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 400;
          line-height: 1.25;
          color: var(--ink);
          margin-bottom: 12px;
        }
        .detail-price-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .detail-price {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 300;
          color: var(--gold);
          letter-spacing: 0.02em;
        }
        .detail-specs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--mid);
          font-family: var(--font-ui);
        }
        .spec-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--border-strong);
          display: inline-block;
        }
        .detail-desc {
          font-family: var(--font-ui);
          font-size: 13px;
          line-height: 1.7;
          color: var(--mid);
          margin: 16px 0;
        }
        .detail-features { margin-bottom: 20px; }
        .feature-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          font-family: var(--font-ui);
          color: var(--ink);
        }
        .feature-check {
          color: var(--gold);
          font-size: 11px;
          margin-top: 1px;
          flex-shrink: 0;
        }
        .detail-inquiry {
          border-top: 1px solid var(--border);
          padding-top: 20px;
        }
        .inquiry-heading { margin-bottom: 14px; }
        .inquiry-form { display: flex; flex-direction: column; gap: 10px; }
        .inquiry-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          font-family: var(--font-ui);
          font-size: 13px;
          color: var(--ink);
          background: var(--canvas);
          outline: none;
          transition: border-color var(--transition);
          resize: none;
        }
        .inquiry-input:focus { border-color: var(--gold); }
        .inquiry-textarea { resize: vertical; }
        .inquiry-success {
          background: rgba(184,151,90,0.08);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          font-size: 13px;
          color: var(--ink);
          line-height: 1.6;
        }
        @media (max-width: 768px) {
          .detail-overlay { justify-content: stretch; }
          .detail-panel { width: 100vw; }
          .gallery-hero { height: 200px; }
        }
      `}</style>
    </div>
  );
}
