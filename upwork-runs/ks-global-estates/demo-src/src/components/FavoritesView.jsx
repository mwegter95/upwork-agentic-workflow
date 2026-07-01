import PropertyCard from './PropertyCard.jsx';

export default function FavoritesView({ properties, favorites, selectedProperty, onSelectProperty, onToggleFavorite }) {
  const favProperties = properties.filter(p => favorites.includes(p.id));

  if (favProperties.length === 0) {
    return (
      <div className="favs-empty">
        <div className="favs-empty-inner">
          <div className="favs-empty-icon">&#9825;</div>
          <h2 className="favs-empty-title">No saved properties yet</h2>
          <p className="favs-empty-sub">Browse properties and tap the heart icon to save your favourites here.</p>
        </div>
        <style>{`
          .favs-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 60px 24px;
          }
          .favs-empty-inner { text-align: center; max-width: 320px; }
          .favs-empty-icon {
            font-size: 52px;
            color: var(--border-strong);
            display: block;
            margin-bottom: 20px;
            line-height: 1;
          }
          .favs-empty-title {
            font-family: var(--font-display);
            font-size: 26px;
            font-weight: 300;
            color: var(--ink);
            margin-bottom: 10px;
          }
          .favs-empty-sub { font-size: 13px; color: var(--mid); line-height: 1.6; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="favs-view">
      <div className="favs-header">
        <div>
          <span className="label-caps">Saved Properties</span>
          <div className="favs-count">{favProperties.length} {favProperties.length === 1 ? 'property' : 'properties'}</div>
        </div>
      </div>
      <div className="favs-grid">
        {favProperties.map(p => (
          <div key={p.id} className="favs-grid-item">
            <PropertyCard
              property={p}
              isSelected={selectedProperty?.id === p.id}
              isFavorite={true}
              onSelect={onSelectProperty}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>
      <style>{`
        .favs-view {
          overflow-y: auto;
          height: 100%;
          background: var(--canvas);
        }
        .favs-header {
          padding: 20px 24px 16px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .favs-count {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 300;
          color: var(--ink);
          margin-top: 2px;
        }
        .favs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1px;
          background: var(--border);
          padding: 0;
        }
        .favs-grid-item { background: var(--surface); }
        .favs-grid-item .prop-card {
          height: 100%;
          border-bottom: none;
        }
        @media (max-width: 768px) {
          .favs-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
