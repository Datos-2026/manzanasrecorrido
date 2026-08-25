/**
 * Utilidades geo: centroide y point-in-polygon (ray casting).
 * Coordenadas GeoJSON: [lng, lat]
 */

export function centroidOfGeometry(geometry) {
  if (!geometry?.coordinates) return null;
  let rings = [];
  if (geometry.type === 'Polygon') rings = [geometry.coordinates[0] || []];
  else if (geometry.type === 'MultiPolygon') {
    rings = geometry.coordinates.map((p) => p[0] || []);
  } else return null;

  let sumLng = 0;
  let sumLat = 0;
  let n = 0;
  for (const ring of rings) {
    for (const c of ring) {
      if (!Array.isArray(c) || c.length < 2) continue;
      sumLng += Number(c[0]);
      sumLat += Number(c[1]);
      n += 1;
    }
  }
  if (!n) return null;
  return { lng: sumLng / n, lat: sumLat / n };
}

function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = Number(ring[i][0]);
    const yi = Number(ring[i][1]);
    const xj = Number(ring[j][0]);
    const yj = Number(ring[j][1]);
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pointInGeometry(lng, lat, geometry) {
  if (!geometry?.coordinates) return false;
  if (geometry.type === 'Polygon') {
    const [outer, ...holes] = geometry.coordinates;
    if (!pointInRing(lng, lat, outer || [])) return false;
    for (const hole of holes) {
      if (pointInRing(lng, lat, hole)) return false;
    }
    return true;
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly) => {
      const [outer, ...holes] = poly;
      if (!pointInRing(lng, lat, outer || [])) return false;
      for (const hole of holes) {
        if (pointInRing(lng, lat, hole)) return false;
      }
      return true;
    });
  }
  return false;
}

export function filterFeaturesByPolygons(features, polygons) {
  if (!features?.length || !polygons?.length) return [];
  return features.filter((f) => {
    const c = centroidOfGeometry(f.geometry);
    if (!c) return false;
    return polygons.some((g) => pointInGeometry(c.lng, c.lat, g));
  });
}

/** Extrae número de comuna desde code "C2" / "2" / "Comuna 2" */
export function communeNumberFromCode(codeOrName) {
  if (!codeOrName) return null;
  const m = String(codeOrName).match(/(\d{1,2})/);
  return m ? String(parseInt(m[1], 10)) : null;
}

/**
 * Código de manzana: "{nroComuna} - {nroManzana}"
 * nroManzana = nombre catastral (ej. 006J) o parte final de sm.
 */
export function buildBlockCode(communeNumber, featureProps = {}) {
  const nro = communeNumber || '?';
  let manzana =
    featureProps.nombre ||
    (featureProps.sm ? String(featureProps.sm).split('-').pop()?.trim() : null) ||
    (featureProps.id != null ? String(featureProps.id) : null) ||
    'S/N';
  return `${nro} - ${manzana}`;
}
