'use client';

import { uploadWithProgress } from './uploadWithProgress';
import { getImageUrl } from './getImageUrl';
import { API_URL } from '@/lib/variables';

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
