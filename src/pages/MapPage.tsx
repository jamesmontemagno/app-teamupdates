import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdates } from '../contexts/UpdatesContext';
import { FilterControls } from '../components/FilterControls';
import { filterUpdates } from '../utils/filters';
import type { FilterState } from '../types';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

L.Icon.Default.mergeOptions({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
});

const defaultFilters: FilterState = {
  dayKey: 'all',
  category: 'all',
  media: 'all',
  locationOnly: true,
};

const defaultCenter: [number, number] = [37.8, -95.7];

export function MapPage() {
  const { updates } = useUpdates();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const filtered = useMemo(() => filterUpdates(updates, filters), [updates, filters]);
  const locationUpdates = filtered.filter((update) => update.location);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 4,
      scrollWheelZoom: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const markerLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markerLayerRef.current = markerLayer;

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) return;
    markerLayer.clearLayers();

    if (locationUpdates.length === 0) {
      map.setView(defaultCenter, 4);
      return;
    }

    const bounds = L.latLngBounds([]);

    locationUpdates.forEach((update) => {
      const coords = [update.location!.lat, update.location!.lng] as [number, number];
      const marker = L.marker(coords);
      const content = document.createElement('div');
      const heading = document.createElement('strong');
      heading.textContent = update.userDisplayName;
      const body = document.createElement('p');
      body.textContent = update.text;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button--link';
      button.textContent = 'View in timeline';
      button.addEventListener('click', () => navigate(`/?highlight=${update.id}`));
      content.appendChild(heading);
      content.appendChild(body);
      content.appendChild(button);

      marker.bindPopup(content);
      marker.addTo(markerLayer);
      bounds.extend(marker.getLatLng());
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { maxZoom: 13, padding: [50, 50] });
    }
  }, [locationUpdates, navigate]);

  return (
    <div className="page page--map">
      <div className="page__panel">
        <div className="page__header">
          <h1 className="page__title">Map</h1>
          <p className="text text--muted">{locationUpdates.length} geotagged updates</p>
        </div>
        <FilterControls updates={updates} filters={filters} onChange={setFilters} showLocationToggle={false} />
      </div>
      <div className="map-shell">
        <div ref={mapContainerRef} className="map-shell__map" />
        <p className="text text--muted" style={{ 
          textAlign: 'center', 
          padding: '8px', 
          fontSize: '0.875rem',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderTop: '1px solid #e0e0e0'
        }}>
          Locations are randomized for privacy
        </p>
      </div>
    </div>
  );
}
