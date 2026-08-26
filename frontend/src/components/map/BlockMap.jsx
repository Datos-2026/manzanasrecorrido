import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CABA_CENTER = [-34.6037, -58.3816];
const CABA_BOUNDS = [
  [-34.705, -58.531],
  [-34.526, -58.335],
];

const BASE_STYLE = {
  color: '#153244',
  weight: 0.6,
  opacity: 0.55,
  fillColor: '#007aa7',
  fillOpacity: 0.12,
};

const ASSIGNED_STYLE = {
  color: '#0a7a3e',
  weight: 1.5,
  opacity: 0.9,
  fillColor: '#2ecc71',
  fillOpacity: 0.35,
};

const SELECTED_STYLE = {
  color: '#c45c00',
  weight: 2.5,
  opacity: 1,
  fillColor: '#ffe07d',
  fillOpacity: 0.55,
};

function FitBounds({ geojson, features }) {
  const map = useMap();
  useEffect(() => {
    const source = geojson || (features?.length ? { type: 'FeatureCollection', features } : null);
    if (!source) {
      map.fitBounds(CABA_BOUNDS);
      return;
    }
    try {
      const layer = L.geoJSON(source);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
      } else {
        map.fitBounds(CABA_BOUNDS);
      }
    } catch {
      map.fitBounds(CABA_BOUNDS);
    }
  }, [map, geojson, features]);
  return null;
}

function featureKey(feature) {
  const p = feature?.properties || {};
  return String(p.cadastralId ?? p.id ?? p.sm ?? p.nombre ?? '');
}

/**
 * @param {object} props
 * @param {object|null} props.catalogGeoJson - FeatureCollection del catálogo CABA
 * @param {object[]} [props.assignedFeatures] - Features ya asignadas (con geometry)
 * @param {string|number|null} [props.selectedKey] - id/sm seleccionado (compat)
 * @param {Array<string|number>} [props.selectedKeys] - varias manzanas seleccionadas
 * @param {(feature: object) => void} [props.onSelectFeature]
 * @param {boolean} [props.interactiveCatalog]
 * @param {number|string} [props.height]
 * @param {boolean} [props.fitToAssigned]
 */
export default function BlockMap({
  catalogGeoJson = null,
  assignedFeatures = [],
  selectedKey = null,
  selectedKeys = null,
  onSelectFeature,
  interactiveCatalog = true,
  height = 420,
  fitToAssigned = false,
}) {
  const catalogRef = useRef(null);
  const assignedRef = useRef(null);

  const selectedKeySet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(selectedKeys)) {
      selectedKeys.forEach((k) => {
        if (k != null && k !== '') set.add(String(k));
      });
    } else if (selectedKey != null && selectedKey !== '') {
      set.add(String(selectedKey));
    }
    return set;
  }, [selectedKey, selectedKeys]);

  const isFeatureSelected = (feature) => {
    const key = featureKey(feature);
    const sm = feature?.properties?.sm;
    return (
      (key && selectedKeySet.has(key)) ||
      (sm != null && selectedKeySet.has(String(sm)))
    );
  };

  const assignedCollection = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: assignedFeatures.filter((f) => f?.geometry),
    }),
    [assignedFeatures]
  );

  const assignedKeys = useMemo(() => {
    const set = new Set();
    assignedFeatures.forEach((f) => {
      const k = featureKey(f);
      if (k) set.add(k);
      if (f.properties?.code) set.add(String(f.properties.code));
      if (f.properties?.sm) set.add(String(f.properties.sm));
    });
    return set;
  }, [assignedFeatures]);

  useEffect(() => {
    if (catalogRef.current) {
      catalogRef.current.setStyle((feature) => {
        const key = featureKey(feature);
        const sm = feature?.properties?.sm;
        if (isFeatureSelected(feature)) return SELECTED_STYLE;
        if (assignedKeys.has(key) || (sm && assignedKeys.has(String(sm)))) {
          return ASSIGNED_STYLE;
        }
        return BASE_STYLE;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isFeatureSelected depends on selectedKeySet
  }, [selectedKeySet, assignedKeys]);

  const catalogStyle = (feature) => {
    const key = featureKey(feature);
    const sm = feature?.properties?.sm;
    if (isFeatureSelected(feature)) return SELECTED_STYLE;
    if (assignedKeys.has(key) || (sm && assignedKeys.has(String(sm)))) {
      return ASSIGNED_STYLE;
    }
    return BASE_STYLE;
  };

  const onEachCatalog = (feature, layer) => {
    if (!interactiveCatalog || !onSelectFeature) return;
    layer.on({
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectFeature(feature);
      },
      mouseover: (e) => {
        const target = e.target;
        if (!target || isFeatureSelected(feature)) return;
        target.setStyle({ weight: 1.4, fillOpacity: 0.28 });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          target.bringToFront();
        }
      },
      mouseout: (e) => {
        if (catalogRef.current) {
          catalogRef.current.resetStyle(e.target);
        }
      },
    });
  };

  const onEachAssigned = (feature, layer) => {
    const code = feature.properties?.code || feature.properties?.sm || feature.properties?.nombre;
    const mapsUrl = feature.properties?.mapsUrl;
    const html = [
      `<strong>${code || 'Manzana'}</strong>`,
      mapsUrl
        ? `<br/><a href="${mapsUrl}" target="_blank" rel="noreferrer">Abrir en Google Maps</a>`
        : '',
    ].join('');
    layer.bindPopup(html);
  };

  const fitSource = fitToAssigned && assignedCollection.features.length
    ? assignedCollection
    : catalogGeoJson;

  return (
    <div className="block-map" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      <MapContainer
        center={CABA_CENTER}
        zoom={12}
        minZoom={11}
        maxZoom={18}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        preferCanvas
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds geojson={fitSource} />
        {catalogGeoJson && (
          <GeoJSON
            key={`catalog-${catalogGeoJson.features?.length || 0}`}
            data={catalogGeoJson}
            style={catalogStyle}
            onEachFeature={onEachCatalog}
            ref={catalogRef}
          />
        )}
        {assignedCollection.features.length > 0 && (
          <GeoJSON
            key={`assigned-${assignedCollection.features.length}`}
            data={assignedCollection}
            style={ASSIGNED_STYLE}
            onEachFeature={onEachAssigned}
            ref={assignedRef}
          />
        )}
      </MapContainer>
    </div>
  );
}

export { featureKey, CABA_CENTER, CABA_BOUNDS };
