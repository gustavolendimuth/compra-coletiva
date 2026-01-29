import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapMarker {
  position: [number, number];
  popup?: string;
  color?: 'blue' | 'red' | 'green';
}

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  showRoute?: {
    from: [number, number];
    to: [number, number];
  };
  className?: string;
}

export function Map({
  center,
  zoom = 15,
  markers = [],
  showRoute,
  className = '',
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Create map
    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add markers
    markers.forEach((marker) => {
      const m = L.marker(marker.position).addTo(map);
      if (marker.popup) {
        m.bindPopup(marker.popup);
      }
    });

    // Add route line
    if (showRoute) {
      L.polyline([showRoute.from, showRoute.to], {
        color: '#3b82f6',
        weight: 3,
        dashArray: '10, 10',
      }).addTo(map);

      // Fit bounds to show both points
      const bounds = L.latLngBounds([showRoute.from, showRoute.to]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center, zoom, markers, showRoute]);

  return (
    <div
      ref={mapRef}
      className={`h-[200px] md:h-[300px] w-full rounded-lg overflow-hidden ${className}`}
    />
  );
}
