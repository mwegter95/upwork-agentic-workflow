// Haversine distance formula — returns miles between two lat/lng points
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDist(miles) {
  if (miles === null || miles === undefined) return null;
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}

export function distColor(miles) {
  if (miles === null || miles === undefined) return 'var(--muted)';
  if (miles < 50) return 'var(--forest)';
  if (miles < 150) return 'var(--teal)';
  return 'var(--muted)';
}
