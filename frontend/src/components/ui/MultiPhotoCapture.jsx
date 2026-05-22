import { useRef, useState } from 'react';

async function resizeImage(file, maxSize = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MultiPhotoCapture({ label, value = [], onChange, max = 10 }) {
  const inputRef = useRef(null);
  const [processing, setProcessing] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setProcessing(true);
    try {
      const remaining = Math.max(0, max - value.length);
      const toProcess = files.slice(0, remaining);
      const dataUrls = await Promise.all(toProcess.map((f) => resizeImage(f)));
      onChange([...value, ...dataUrls]);
    } catch (err) {
      console.error('Error al procesar imagen', err);
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (idx) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  const reachedMax = value.length >= max;

  return (
    <div className="photo-capture">
      {label && (
        <label className="photo-capture__label">
          {label}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>
            {' '}
            ({value.length}/{max})
          </span>
        </label>
      )}

      {value.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: 8,
            marginBottom: 8,
          }}
        >
          {value.map((src, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--border-soft)',
                aspectRatio: '1 / 1',
              }}
            >
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Quitar foto"
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  lineHeight: '22px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {!reachedMax && (
        <button
          type="button"
          className="photo-capture__btn"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
        >
          {processing ? 'Procesando...' : value.length === 0 ? '📷 Sacar fotos' : '📷 Agregar más'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFiles}
        style={{ display: 'none' }}
      />
    </div>
  );
}
