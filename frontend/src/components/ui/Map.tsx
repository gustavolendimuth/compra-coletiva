import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapMarker {
  position: [number, number];
  popup?: string;
  color?: "blue" | "red" | "green" | "gray";
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

const markerColors: Record<NonNullable<MapMarker["color"]>, string> = {
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  gray: "#4b5563",
};

const pinIconCache = new globalThis.Map<string, L.Icon>();

const getPinIcon = (color: string) => {
  const cached = pinIconCache.get(color);
  if (cached) return cached;

  const svg = `
    <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 1.5C8.268 1.5 2 7.768 2 15.5C2 26.5 16 46.5 16 46.5C16 46.5 30 26.5 30 15.5C30 7.768 23.732 1.5 16 1.5Z" fill="${color}" stroke="#1f2937" stroke-width="2"/>
      <circle cx="16" cy="15.5" r="6" fill="#ffffff"/>
    </svg>
  `.trim();
  const encodedSvg = encodeURIComponent(svg);
  const icon = L.icon({
    iconUrl: `data:image/svg+xml,${encodedSvg}`,
    iconSize: [32, 48],
    iconAnchor: [16, 46],
    popupAnchor: [0, -42],
  });

  pinIconCache.set(color, icon);
  return icon;
};

export function Map({
  center,
  zoom = 15,
  markers = [],
  showRoute,
  className = "",
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Create map
    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add markers
    markers.forEach((marker) => {
      const color = markerColors[marker.color ?? "blue"];
      const m = L.marker(marker.position, {
        icon: getPinIcon(color),
      }).addTo(map);
      if (marker.popup) {
        m.bindPopup(marker.popup);
      }
    });

    // Add route line
    if (showRoute) {
      L.polyline([showRoute.from, showRoute.to], {
        color: "#3b82f6",
        weight: 3,
        dashArray: "10, 10",
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
