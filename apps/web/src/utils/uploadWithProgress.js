'use client';

/* =====================================================================
 *  uploadWithProgress — XHR-based file upload with real progress.
 *
 *  fetch() does not expose upload progress, so we use XHR when sending
 *  FormData. On a 401 we refresh the access token once (mirroring the RTK
 *  base query reauth flow) and retry.
 *
 *  Auth source of truth: localStorage['auth'] =
 *    { user, accessToken, refreshToken, role }
 *
 *  Usage:
 *    const data = await uploadWithProgress(url, formData, (pct) => ...);
 *    // data — the server JSON response
 * ===================================================================== */

import { API_URL } from '@/lib/variables';

const STORAGE_KEY = 'auth';

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredAuth(auth) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // Ignore quota / privacy-mode errors.
  }
}

function clearStoredAuthAndRedirect() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
  window.location.href = '/login';
}

/**
 * Refresh the access token using the stored refresh token.
 * Returns the new tokens object `{ accessToken, refreshToken }` or null.
 */
async function refreshTokens() {
  const stored = readStoredAuth();
  const refreshToken = stored?.refreshToken;
  if (!refreshToken) return null;

  const r = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  const body = await r.json().catch(() => null);
  if (!r.ok || !body?.success || !body?.data?.tokens) return null;

  const tokens = body.data.tokens;
  writeStoredAuth({ ...stored, ...tokens });
  return tokens;
}

function xhrUpload(url, formData, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

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

  let token = readStoredAuth()?.accessToken;
  let { status, body } = await xhrUpload(url, formData, token, onProgress);

  if (status === 401) {
    // Access token expired — refresh and retry once.
    const tokens = await refreshTokens();
    if (tokens?.accessToken) {
      token = tokens.accessToken;
      ({ status, body } = await xhrUpload(url, formData, token, onProgress));
    } else {
      clearStoredAuthAndRedirect();
      throw new Error('Session expired');
    }
  }

  if (status < 200 || status >= 300) {
    throw new Error(body?.message || `Upload failed (HTTP ${status})`);
  }
  return body;
}
