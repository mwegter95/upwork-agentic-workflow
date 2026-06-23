import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { haversine, formatDist } from '../utils/haversine.js';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const createParkPin = (visited, active = false) => L.divIcon({
  className: '',
  html: `<svg viewBox="0 0 28 38" width="${active?32:28}" height="${active?42:38}" xmlns="http://www.w3.org/2000/svg" style="filter:${active?'drop-shadow(0 2px 6px rgba(0,0,0,0.4))':'drop-shadow(0 1px 2px rgba(0,0,0,0.25))'}">
    <ellipse cx="14" cy="36" rx="5" ry="2" fill="rgba(0,0,0,0.18)"/>
    <polygon points="14,3 26,21 2,21" fill="${visited ? '#2D5A3D' : '#A8A8A0'}" stroke="${visited ? 'none' : '#888'}" stroke-width="${visited ? 0 : 1.5}"/>
    <rect x="11" y="21" width="6" height="7" rx="1" fill="${visited ? '#2D5A3D' : '#A8A8A0'}"/>
    <polygon points="14,7 20,16 8,16" fill="white" opacity="0.3"/>
    ${visited ? '<circle cx="14" cy="12" r="3" fill="#FFC845" opacity="0.9"/>' : ''}
  </svg>`,
  iconSize: [active?32:28, active?42:38],
  iconAnchor: [active?16:14, active?42:38],
  popupAnchor: [0, -40],
});

const HOME_PIN = L.divIcon({
  className: '',
  html: `<svg viewBox="0 0 32 40" width="32" height="40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="16" cy="38" rx="6" ry="2" fill="rgba(0,0,0,0.18)"/>
    <circle cx="16" cy="18" r="16" fill="#003865" stroke="white" stroke-width="2"/>
    <path d="M16 7 L27 17 V28 H20 V22 H12 V28 H5 V17 Z" fill="white"/>
    <rect x="13" y="22" width="6" height="6" fill="#003865" rx="1"/>
  </svg>`,
  iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -42],
});

export default function MapView({ parks, visits, selectedPark, homeLoc, onSelectPark }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef({});
  const homeMarkerRef = useRef(null);

  const visitedIds = new Set(visits.map(v => v.park_id));

  // Init map
  useEffect(() => {
    if (leafletRef.current) return;
    const map = L.map('leaflet-map', { center: [46.4, -94.5], zoom: 7, zoomControl: true });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
    map.zoomControl.setPosition('bottomleft');
    leafletRef.current = map;
    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  // Sync markers
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      if (!parks.find(p => p.id === parseInt(id))) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    parks.forEach(park => {
      const isVisited = visitedIds.has(park.id);
      const isActive = selectedPark?.id === park.id;
      const icon = createParkPin(isVisited, isActive);

      if (markersRef.current[park.id]) {
        markersRef.current[park.id].setIcon(icon);
        return;
      }

      const dist = homeLoc ? haversine(homeLoc.lat, homeLoc.lng, park.lat, park.lng) : null;
      const distLine = dist !== null ? `<br/><small style="color:#A8A8A0">${formatDist(dist)} from home</small>` : '';

      const marker = L.marker([park.lat, park.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:'Inter',system-ui,sans-serif">
            <div style="font-weight:600;font-size:0.87rem;color:#003865">${park.name}</div>
            <div style="font-size:0.75rem;color:#A8A8A0">${park.region} &bull; ${park.acres.toLocaleString()} acres</div>
            ${isVisited ? '<div style="margin-top:4px;color:#2D5A3D;font-size:0.75rem;font-weight:600">✓ Visited</div>' : ''}
            ${distLine}
          </div>
        `, { closeButton: false })
        .on('click', () => onSelectPark(park));

      markersRef.current[park.id] = marker;
    });
  }, [parks, visits, selectedPark, homeLoc]);

  // Pan to selected park
  useEffect(() => {
    const map = leafletRef.current;
    if (!map || !selectedPark) return;

    // Update marker icons for active state
    parks.forEach(park => {
      const m = markersRef.current[park.id];
      if (m) m.setIcon(createParkPin(visitedIds.has(park.id), park.id === selectedPark.id));
    });

    map.flyTo([selectedPark.lat, selectedPark.lng], Math.max(map.getZoom(), 10), { duration: 0.8 });
  }, [selectedPark]);

  // Home marker
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    if (homeMarkerRef.current) { homeMarkerRef.current.remove(); homeMarkerRef.current = null; }

    if (homeLoc) {
      homeMarkerRef.current = L.marker([homeLoc.lat, homeLoc.lng], { icon: HOME_PIN, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup('<div style="font-family:\'Inter\',system-ui;font-weight:600;color:#003865">🏠 Home</div>', { closeButton: false });
    }
  }, [homeLoc]);

  return <div id="leaflet-map" ref={mapRef} />;
}
