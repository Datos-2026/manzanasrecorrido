import { useEffect, useState } from 'react';

export function useGeolocation(autoFetch = true) {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPosition = () => {
    if (!('geolocation' in navigator)) {
      setError('El navegador no soporta geolocalización');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        const messages = {
          1: 'Permiso de ubicación denegado',
          2: 'No se pudo obtener la ubicación',
          3: 'Tiempo de espera agotado',
        };
        setError(messages[err.code] || 'Error al obtener la ubicación');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (autoFetch) fetchPosition();
  }, [autoFetch]);

  return { coords, error, loading, refetch: fetchPosition };
}
