// Resize an image File to fit within max dimensions and re-encode as JPEG/PNG.
// Returns a base64 data URL well under JSON Server's 100KB body limit.

export async function compressImage(file, {
  maxWidth = 400,
  maxHeight = 200,
  quality = 0.85,
  mimeType,
} = {}) {
  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('Fichier non image');
  }

  const dataUrl = await fileToDataURL(file);
  const img = await loadImage(dataUrl);

  // Compute scaled dimensions preserving aspect ratio
  let { width, height } = img;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width  = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  // Prefer JPEG for photos (smaller); keep PNG only when transparency matters.
  const outputType = mimeType || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
  return canvas.toDataURL(outputType, quality);
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Approximate byte size of a base64 data URL
export function approxBase64Size(dataUrl) {
  if (!dataUrl) return 0;
  const i = dataUrl.indexOf(',');
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  return Math.floor(b64.length * 0.75);
}
