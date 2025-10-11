// src/utils/leaflet-icons.ts
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// This is a crucial fix for Leaflet's default icon not showing up in some build environments
// It prevents Webpack from trying to process these URLs incorrectly.
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

// Define custom icons based on hotspot types
// IMPORTANT: Replace these icon URLs with your actual icon assets or preferred CDN links.
// Ensure they are publicly accessible images (PNG, SVG, etc.).
export const retailerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2873/2873534.png', // Example: Shopping cart
  iconSize: [32, 32], // Size of the icon
  iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
  popupAnchor: [0, -32], // Point from which the popup should open relative to the iconAnchor
  shadowUrl: shadowUrl,
  shadowSize: [32, 32],
});

export const densityIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1000/1000000.png', // Example: User group
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: shadowUrl,
    shadowSize: [32, 32],
});

export const eventIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2761/2761271.png', // Example: Calendar/Event
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: shadowUrl,
    shadowSize: [32, 32],
});

// Default icon if a specific type doesn't have a custom icon defined
export const defaultHotspotIcon = new L.Icon({
    iconUrl: iconUrl, // Use Leaflet's default blue marker
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});