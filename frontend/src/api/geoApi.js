import { getToken } from './client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Carga el catálogo catastral: primero desde /geo estático (Vercel/public),
 * si falla intenta el endpoint autenticado del backend.
 */
export async function loadManzanasCatalog() {
  try {
    const res = await fetch('/geo/manzanas_catastrales.geojson');
    if (res.ok) return res.json();
  } catch {
    // fallback al API
  }

  const token = getToken();
  const res = await fetch(`${API_URL}/geo/manzanas`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo cargar el mapa de manzanas');
  }
  return res.json();
}

export function blockToFeature(block) {
  if (!block?.polygon) return null;
  const lat = block.centroidLat != null ? Number(block.centroidLat) : null;
  const lng = block.centroidLng != null ? Number(block.centroidLng) : null;
  const mapsUrl =
    lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : null;

  return {
    type: 'Feature',
    properties: {
      id: block.id,
      code: block.code,
      sm: block.code,
      nombre: block.label || block.code,
      cadastralId: block.id,
      mapsUrl,
      centroidLat: lat,
      centroidLng: lng,
    },
    geometry: block.polygon,
  };
}

export function googleMapsUrl(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
