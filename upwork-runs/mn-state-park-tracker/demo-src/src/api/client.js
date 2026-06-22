const API_BASE = 'https://api.michaelwegter.com';

const getToken = () => localStorage.getItem('mn_parks_token');

export const api = {
  post: async (path, body, auth = false) => {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) { const t = getToken(); if (t) headers['Authorization'] = `Bearer ${t}`; }
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) { const txt = await res.text(); throw new Error(txt); }
    return res.json();
  },
  patch: async (path, body) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
    const res = await fetch(`${API_BASE}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  put: async (path, body) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
    const res = await fetch(`${API_BASE}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  delete: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  uploadPhoto: async (visitId, blob) => {
    const fd = new FormData();
    fd.append('photo', blob, 'photo.jpg');
    const res = await fetch(`${API_BASE}/mn-parks/visits/${visitId}/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  photoUrl: (visitId, photoId) =>
    `${API_BASE}/mn-parks/visits/${visitId}/photos/${photoId}?token=${getToken()}`,
};

export const isHeic = (file) =>
  file.type === 'image/heic' || file.type === 'image/heif' ||
  /\.(heic|heif)$/i.test(file.name || '');

// Decode any image — including iPhone HEIC/HEIF — to an ImageBitmap, honoring
// EXIF orientation (iPhone photos are often rotated). createImageBitmap handles
// standard formats everywhere and HEIC natively on Safari 16+; heic2any (WASM,
// loaded on demand) is the HEIC fallback for Chrome/Firefox.
async function decodeImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch { /* fall through */ }
  if (isHeic(file)) {
    const mod = await import('heic2any');
    const heic2any = typeof mod.default === 'function' ? mod.default : mod;
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    const jpeg = Array.isArray(out) ? out[0] : out;
    return await createImageBitmap(jpeg, { imageOrientation: 'from-image' });
  }
  throw new Error('unsupported image');
}

// Resize/normalize any selected photo to a JPEG blob ready for upload. Rejects
// (instead of hanging) if the image can't be decoded, so the UI can report it.
export const resizeImage = async (file, maxDim = 1200, quality = 0.75) => {
  let bitmap;
  try {
    bitmap = await decodeImage(file);
  } catch {
    throw new Error(
      isHeic(file)
        ? "Couldn't read this iPhone photo (HEIC). Re-try, or export it as JPEG in the Photos app."
        : "Couldn't read this image file."
    );
  }
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return await new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))),
      'image/jpeg',
      quality
    )
  );
};
