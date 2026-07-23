'use client';

/* =====================================================================
 *  CollageCropDialog — kollaj slot-una şəkil əlavə edərkən açılan
 *  yüngül crop dialoqu. react-easy-crop istifadə edir.
 *
 *  Props:
 *    - open       : boolean
 *    - file       : File (yeni seçilmiş)
 *    - aspect     : '4/3' | '16/9' | '1/1' | '3/4' | 'auto' (string)
 *    - onCancel() : dialoqu bağla
 *    - onConfirm(blob) : crop-dan keçmiş Blob qaytarır
 * ===================================================================== */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCw, RotateCcw } from 'lucide-react';

/** "4/3" → 4/3 ; "auto" → undefined (sərbəst crop) */
function aspectToNumber(aspect) {
  if (!aspect || aspect === 'auto') return undefined;
  const [w, h] = String(aspect).split('/').map(Number);
  if (!w || !h) return undefined;
  return w / h;
}

async function cropToBlob(imageSrc, pixelCrop, rotation, quality = 0.88) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  if (rotation) {
    // Rotation üçün ayrı kanvas-da çevir, sonra crop et
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const rW = image.width * cos + image.height * sin;
    const rH = image.width * sin + image.height * cos;

    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = rW;
    rotCanvas.height = rH;
    const rctx = rotCanvas.getContext('2d');
    rctx.translate(rW / 2, rH / 2);
    rctx.rotate(rad);
    rctx.drawImage(image, -image.width / 2, -image.height / 2);

    ctx.drawImage(
      rotCanvas,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height,
    );
  } else {
    ctx.drawImage(
      image,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height,
    );
  }

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality)
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function CollageCropDialog({ open, file, aspect, onCancel, onConfirm }) {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pixelCrop, setPixelCrop] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const cropAspect = useMemo(() => aspectToNumber(aspect) ?? 4 / 3, [aspect]);

  /* File → DataURL */
  useEffect(() => {
    if (!open || !file) {
      setSrc(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result);
    reader.readAsDataURL(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setPixelCrop(null);
  }, [open, file]);

  const handleConfirm = useCallback(async () => {
    if (!src || !pixelCrop) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(src, pixelCrop, rotation);
      if (blob) onConfirm?.(blob);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setBusy(false);
    }
  }, [src, pixelCrop, rotation, onConfirm]);

  if (!open || !mounted) return null;

  const dialog = (
    <div className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">
            Şəkli kollaj üçün kəs
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cropper */}
        <div className="relative w-full h-[60vh] min-h-[300px] bg-gray-900">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={cropAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(_, area) => setPixelCrop(area)}
              showGrid
            />
          )}
        </div>

        {/* Controls */}
        <div className="px-5 py-3 space-y-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <ZoomOut size={14} className="text-gray-400" />
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-secondary h-1.5"
            />
            <ZoomIn size={14} className="text-gray-400" />
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw size={14} className="text-gray-400" />
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 accent-secondary h-1.5"
            />
            <RotateCw size={14} className="text-gray-400" />
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
            >
              +90°
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-3 py-1.5 text-xs rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !pixelCrop}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-secondary text-white hover:opacity-90 disabled:opacity-40"
          >
            <Check size={14} />
            {busy ? 'Kəsilir...' : 'Təsdiqlə'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
