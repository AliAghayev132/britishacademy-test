'use client';

/* =====================================================================
 *  uploadWithProgress — XHR-based file upload with real progress.
 *
 *  fetch() does not expose upload progress, so we use XHR when sending
 *  FormData. Sessiya HttpOnly cookie-lərdədir (`withCredentials`); 401-də
 *  RTK Query ilə EYNİ refreshSession() çağırılır və sorğu bir dəfə təkrarlanır.
 *
 *  Usage:
 *    const data = await uploadWithProgress(url, formData, (pct) => ...);
 *    // data — the server JSON response
 * ===================================================================== */

// Local
import { refreshSession, redirectToLogin } from './session';

function xhrUpload(url, formData, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;

    // Ləğv etmək imkanı: böyük video dəqiqələrlə gedə bilər, istifadəçi
    // səhvən yanlış faylı seçibsə gözləməyə məcbur olmamalıdır.
    const onAbortSignal = () => xhr.abort();
    if (signal) {
      if (signal.aborted) { xhr.abort(); return reject(new Error('Upload aborted')); }
      signal.addEventListener('abort', onAbortSignal, { once: true });
    }
    const cleanup = () => signal?.removeEventListener('abort', onAbortSignal);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && typeof onProgress === 'function') {
        // İkinci arqument — bayt sayğacı; çağıran onu göstərmək istəməsə
        // sadəcə yox sayır (köhnə bir-arqumentli istifadələr pozulmur).
        onProgress((evt.loaded / evt.total) * 100, { loaded: evt.loaded, total: evt.total });
      }
    };
    // Bütün baytlar getdi, amma cavab hələ yoxdur: server faylı diskə yazır.
    // Bunu bildirmək lazımdır, əks halda çubuq 100%-də «donmuş» görünür.
    xhr.upload.onload = () => {
      if (typeof onProgress === 'function') onProgress(100, { phase: 'processing' });
    };

    xhr.onload = () => {
      cleanup();
      let body;
      try { body = JSON.parse(xhr.responseText); } catch { body = null; }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => { cleanup(); reject(new Error('Network error during upload')); };
    xhr.onabort = () => { cleanup(); reject(new Error('Yükləmə ləğv edildi')); };

    xhr.send(formData);
  });
}

/**
 * @param {(percent:number, info?:{loaded?:number,total?:number,phase?:"processing"}) => void} [onProgress]
 *   `phase: "processing"` — baytlar getdi, server cavabı gözlənilir.
 * @param {{ signal?: AbortSignal }} [opts] — `signal` ilə yükləmə ləğv edilir.
 *
 * @param {string} url      Full URL
 * @param {FormData} formData
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<any>}  Server JSON body
 */
export async function uploadWithProgress(url, formData, onProgress, { signal } = {}) {
  if (typeof window === 'undefined') {
    throw new Error('uploadWithProgress can only be used in the browser');
  }

  let { status, body } = await xhrUpload(url, formData, onProgress, signal);

  if (status === 401) {
    // Access token expired — refresh and retry once.
    const outcome = await refreshSession();
    if (outcome === 'ok') {
      ({ status, body } = await xhrUpload(url, formData, onProgress, signal));
    } else {
      if (outcome === 'expired') redirectToLogin();
      throw new Error('Session expired');
    }
  }

  if (status < 200 || status >= 300) {
    throw new Error(body?.message || `Upload failed (HTTP ${status})`);
  }
  return body;
}
