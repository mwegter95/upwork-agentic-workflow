import PropertyCard from './PropertyCard.jsx';

export default function PropertyList({ properties, selectedProperty, favorites, onSelectProperty, onToggleFavorite }) {
  if (properties.length === 0) {
    return (
      <div className="list-empty">
        <div className="list-empty-inner">
          <div className="list-empty-icon">&#9634;</div>
          <p className="list-empty-title">No properties found</p>
          <p className="list-empty-sub">Try adjusting your filters to see more results.</p>
        </div>
        <style>{`
          .list-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 40px 24px;
          }
          .list-empty-inner { text-align: center; }
          .list-empty-icon { font-size: 40px; color: var(--border-strong); margin-bottom: 16px; }
          .list-empty-title {
            font-family: var(--font-display);
            font-size: 20px;
            font-weight: 300;
            color: var(--ink);
            margin-bottom: 6px;
          }
          .list-empty-sub { font-size: 13px; color: var(--mid); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="prop-list">
      {properties.map(p => (
        <PropertyCard
          key={p.id}
          property={p}
          isSelected={selectedProperty?.id === p.id}
          isFavorite={favorites.includes(p.id)}
          onSelect={onSelectProperty}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
      <style>{`
        .prop-list {
          overflow-y: auto;
          flex: 1;
        }
      `}</style>
    </div>
  );
}
