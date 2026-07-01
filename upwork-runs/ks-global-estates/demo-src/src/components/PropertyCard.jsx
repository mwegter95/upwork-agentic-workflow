import { useRef, useEffect } from 'react';
import { TYPE_LABELS } from '../data/properties.js';

export default function PropertyCard({ property, isSelected, isFavorite, onSelect, onToggleFavorite }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  const { title, type, status, priceLabel, beds, baths, sqft, city, country, images } = property;

  return (
    <article
      ref={cardRef}
      className={`prop-card${isSelected ? ' selected' : ''}`}
      onClick={() => onSelect(property)}
    >
      <div className="prop-card-img" style={{ backgroundImage: `url(${images[0]})` }}>
        <button
          className={`fav-btn${isFavorite ? ' active' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleFavorite(property.id); }}
          aria-label={isFavorite ? 'Remove from saved' : 'Save property'}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
        <span className={`status-badge ${status}`}>{status === 'for-sale' ? 'For Sale' : status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>

      <div className="prop-card-body">
        <div className="prop-card-meta label-caps">{TYPE_LABELS[type]} · {city}, {country}</div>
        <h3 className="prop-card-title">{title}</h3>
        <div className="prop-card-price">{priceLabel}</div>
        <div className="prop-card-specs">
          <span>{beds} bed</span>
          <span className="spec-dot"></span>
          <span>{baths} bath</span>
          <span className="spec-dot"></span>
          <span>{sqft.toLocaleString()} sqft</span>
        </div>
      </div>

      <style>{`
        .prop-card {
          display: flex;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background var(--transition);
          position: relative;
        }
        .prop-card:hover { background: #FDFAF7; }
        .prop-card.selected {
          background: #FDFAF7;
          box-shadow: inset 3px 0 0 var(--gold);
        }
        .prop-card-img {
          width: 130px;
          min-width: 130px;
          height: 110px;
          background-size: cover;
          background-position: center;
          position: relative;
          flex-shrink: 0;
        }
        .fav-btn {
          position: absolute;
          top: 6px;
          left: 6px;
          background: rgba(255,255,255,0.85);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition);
          color: var(--mid);
          line-height: 1;
        }
        .fav-btn:hover { background: white; color: var(--gold); }
        .fav-btn.active { color: #C0392B; background: white; }
        .prop-card-img .status-badge {
          position: absolute;
          bottom: 6px;
          right: 6px;
          font-size: 9px;
        }
        .prop-card-body {
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          overflow: hidden;
        }
        .prop-card-meta { line-height: 1.4; }
        .prop-card-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 400;
          line-height: 1.3;
          color: var(--ink);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .prop-card-price {
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 600;
          color: var(--gold);
          letter-spacing: 0.02em;
        }
        .prop-card-specs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
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
      `}</style>
    </article>
  );
}
