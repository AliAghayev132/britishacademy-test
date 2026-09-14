'use client';

// Local
import { API_URL } from './variables';
import { uploadWithProgress } from './uploadWithProgress';
import { getImageUrl } from './getImageUrl';

/** Server cavabından mütləq URL — uğursuzluqda istisna. */
function editorUrl(result, fallback) {
  if (!result?.success || !result?.data?.url) {
    throw new Error(result?.message || fallback);
  }
  return getImageUrl(result.data.url);
}

/**
 * Redaktora şəkil yüklə (qalereyaya da düşür).
 * @param {File} file
 * @returns {Promise<string>} şəklin URL-i
 */
export async function uploadImageForEditor(file) {
  const formData = new FormData();
  formData.append('image', file);
  const result = await uploadWithProgress(`${API_URL}/media/upload-image`, formData);
  return editorUrl(result, 'Şəkil yüklənmədi');
}

/**
 * Redaktora video yüklə.
 * @param {File} file
 * @param {(percent:number)=>void} [onProgress]
 * @returns {Promise<string>} videonun URL-i
 */
export async function uploadVideoForEditor(file, onProgress) {
  const formData = new FormData();
  formData.append('video', file);
  const result = await uploadWithProgress(`${API_URL}/media/upload-video`, formData, onProgress);
  return editorUrl(result, 'Video yüklənmədi');
}

/**
 * Upload a document (PDF, Word, Excel, etc.) for the Tiptap editor.
 * @param {File} file
 * @param {string|null} customName  Display name shown in the editor (no extension).
 * @param {(percent:number)=>void} [onProgress]
 * @returns {Promise<{url:string,name:string,size:number,mimetype:string}>}
 */
export async function uploadDocumentForEditor(file, customName, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  if (customName) formData.append('name', String(customName));

  const result = await uploadWithProgress(
    `${API_URL}/media/upload-document`,
    formData,
    onProgress,
  );

  if (!result?.success) {
    throw new Error(result?.message || 'Document upload failed');
  }

  return {
    ...result.data,
    url: getImageUrl(result.data.url),
  };
}
