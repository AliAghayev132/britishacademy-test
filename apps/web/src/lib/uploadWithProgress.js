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

function xhrUpload(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && typeof onProgress === 'function') {
        onProgress((evt.loaded / evt.total) * 100);
      }
    };

    xhr.onload = () => {
      let body;
      try { body = JSON.parse(xhr.responseText); } catch { body = null; }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    xhr.send(formData);
  });
}

/**
 * @param {string} url      Full URL
 * @param {FormData} formData
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<any>}  Server JSON body
 */
export async function uploadWithProgress(url, formData, onProgress) {
  if (typeof window === 'undefined') {
    throw new Error('uploadWithProgress can only be used in the browser');
  }

  let { status, body } = await xhrUpload(url, formData, onProgress);

  if (status === 401) {
    // Access token expired — refresh and retry once.
    const outcome = await refreshSession();
    if (outcome === 'ok') {
      ({ status, body } = await xhrUpload(url, formData, onProgress));
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
