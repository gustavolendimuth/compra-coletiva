import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <defs>
      <linearGradient id="pinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ef4444"/>
        <stop offset="100%" stop-color="#b91c1c"/>
      </linearGradient>
    </defs>
    <path d="M16 0C7.16 0 0 7.16 0 16c0 5.09 2.36 9.65 6.04 12.68L14.4 38.4a2 2 0 003.2 0l8.36-9.72C29.64 25.65 32 21.09 32 16c0-8.84-7.16-16-16-16z" fill="url(#pinGrad)" stroke="#991b1b" stroke-width="1"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
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
      const m = L.marker(marker.position, { icon: pinIcon }).addTo(map);
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
