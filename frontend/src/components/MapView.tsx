import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { TeamUpdate } from '../api/types';
import mapStyles from '../pages/MapPage.module.css';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const defaultCenter: [number, number] = [37.8, -95.7];

interface MapViewProps {
  updates: TeamUpdate[];
  onViewInTimeline: (updateId: string) => void;
}

export function MapView({ updates, onViewInTimeline }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    
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

  // Update map markers
  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) return;
    
    markerLayer.clearLayers();

    const locationUpdates = updates.filter((update) => update.location);

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
      const viewButton = document.createElement('button');
      viewButton.type = 'button';
      viewButton.className = 'button button--link';
      viewButton.textContent = 'View in timeline';
      viewButton.addEventListener('click', () => onViewInTimeline(update.id));
      content.appendChild(heading);
      content.appendChild(body);
      content.appendChild(viewButton);

      marker.bindPopup(content);
      marker.addTo(markerLayer);
      bounds.extend(marker.getLatLng());
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { maxZoom: 13, padding: [50, 50] });
    }
  }, [updates, onViewInTimeline]);

  return (
    <div className={mapStyles['map-shell']}>
      <div ref={mapContainerRef} className={mapStyles['map-shell__map']} />
      <p className="text text--muted" style={{ 
        textAlign: 'center', 
        padding: '8px', 
        fontSize: '0.875rem',
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)'
      }}>
        Locations are randomized for privacy
      </p>
    </div>
  );
}
