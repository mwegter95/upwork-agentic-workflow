import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const createPricePin = (priceLabel, active = false) => L.divIcon({
  className: '',
  html: `<div style="
    background:${active ? '#B8975A' : '#12100E'};
    color:#fff;
    font-family:'DM Sans',system-ui,sans-serif;
    font-size:11px;
    font-weight:600;
    padding:4px 8px;
    border-radius:3px;
    white-space:nowrap;
    box-shadow:0 2px 8px rgba(0,0,0,${active ? '0.4' : '0.25'});
    letter-spacing:0.02em;
    transform:${active ? 'scale(1.15)' : 'scale(1)'};
    transition:transform 0.15s;
    cursor:pointer;
    border:${active ? '1.5px solid rgba(255,255,255,0.3)' : 'none'};
  ">${priceLabel}</div>`,
  iconSize: [null, null],
  iconAnchor: [0, 0],
});

export default function MapView({ properties, selectedProperty, onSelectProperty }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef({});

  // Init map once
  useEffect(() => {
    if (leafletRef.current) return;
    const map = L.map('ks-map', {
      center: [25, 12],
      zoom: 3,
      zoomControl: true,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
    map.zoomControl.setPosition('bottomright');
    leafletRef.current = map;
    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  // Sync markers when properties change
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    const currentIds = new Set(properties.map(p => p.id));

    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      const numId = parseInt(id);
      if (!currentIds.has(numId)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    properties.forEach(prop => {
      const isActive = selectedProperty?.id === prop.id;
      const icon = createPricePin(prop.priceLabel, isActive);

      if (markersRef.current[prop.id]) {
        markersRef.current[prop.id].setIcon(icon);
        markersRef.current[prop.id]._prop = prop;
        return;
      }

      const marker = L.marker([prop.lat, prop.lng], { icon })
        .addTo(map)
        .on('click', () => onSelectProperty(prop));

      marker._prop = prop;
      markersRef.current[prop.id] = marker;
    });
  }, [properties, selectedProperty]);

  // Fly to selected
  useEffect(() => {
    const map = leafletRef.current;
    if (!map || !selectedProperty) return;

    // Update all pin icons for active state
    Object.values(markersRef.current).forEach(m => {
      if (m._prop) {
        m.setIcon(createPricePin(m._prop.priceLabel, m._prop.id === selectedProperty.id));
      }
    });

    map.flyTo([selectedProperty.lat, selectedProperty.lng], 13, { duration: 0.8 });
  }, [selectedProperty]);

  return (
    <div className="map-container">
      <div id="ks-map" ref={mapRef} />
      <style>{`
        .map-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        #ks-map {
          width: 100%;
          height: 100%;
        }
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255,255,255,0.75) !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }
        .leaflet-control-zoom a {
          font-family: var(--font-ui) !important;
          font-weight: 300 !important;
          color: var(--ink) !important;
          background: var(--surface) !important;
          border-color: var(--border) !important;
        }
        .leaflet-control-zoom a:hover {
          background: var(--canvas) !important;
        }
      `}</style>
    </div>
  );
}
