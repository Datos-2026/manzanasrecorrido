import { useRef, useState } from 'react';

/**
 * Captura de foto desde la cámara nativa del celular.
 * En mobile, abre directamente la cámara trasera (capture="environment").
 * La imagen se redimensiona a máx 1280px y se convierte a JPEG base64
 * para mantener el tamaño bajo control sin necesidad de upload real al backend.
 */
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

export default function PhotoCapture({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      const dataUrl = await resizeImage(file);
      onChange(dataUrl);
    } catch (err) {
      console.error('Error al procesar imagen', err);
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="photo-capture">
      {label && <label className="photo-capture__label">{label}</label>}

      {value ? (
        <div className="photo-capture__preview">
          <img src={value} alt="Foto capturada" />
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => onChange(null)}
          >
            Quitar foto
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="photo-capture__btn"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
        >
          {processing ? 'Procesando...' : '📷 Sacar foto'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  );
}
