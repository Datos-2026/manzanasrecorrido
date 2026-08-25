/**
 * Calcula un centroide aproximado (promedio de vértices) para un GeoJSON Polygon/MultiPolygon.
 * coordinates GeoJSON: [lng, lat]
 */
function centroidFromGeometry(geometry) {
  if (!geometry || !geometry.coordinates) return null;

  let rings = [];
  if (geometry.type === 'Polygon') {
    rings = [geometry.coordinates[0] || []];
  } else if (geometry.type === 'MultiPolygon') {
    rings = geometry.coordinates.map((poly) => poly[0] || []);
  } else {
    return null;
  }

  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  for (const ring of rings) {
    for (const coord of ring) {
      if (!Array.isArray(coord) || coord.length < 2) continue;
      sumLng += Number(coord[0]);
      sumLat += Number(coord[1]);
      count += 1;
    }
  }

  if (!count) return null;
  return {
    lng: sumLng / count,
    lat: sumLat / count,
  };
}

module.exports = { centroidFromGeometry };
