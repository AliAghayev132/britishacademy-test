'use client';

import { Check, X, Undo2, Loader2 } from 'lucide-react';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

export default function AISuggestion({ suggestion, isLoading, onAccept, onReject, onRevert, hasOriginal }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 mt-1.5 px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg animate-pulse">
        <Loader2 size={14} className="animate-spin text-violet-500" />
        <span className="text-xs text-violet-600">AI işləyir...</span>
      </div>
    );
  }

  if (!suggestion && suggestion !== '') return null;

  const displayText = typeof suggestion === 'string' 
    ? suggestion.length > 200 
      ? suggestion.substring(0, 200) + '...' 
      : suggestion
    : JSON.stringify(suggestion);

  // Check if suggestion is HTML
  const isHtml = typeof suggestion === 'string' && /<[^>]+>/.test(suggestion);

  return (
    <div className="mt-1.5 border border-emerald-200 rounded-lg overflow-hidden bg-emerald-50/50">
      <div className="px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">AI cavabı</span>
            {isHtml ? (
              <div
                className="text-xs text-emerald-800 mt-1 line-clamp-3 prose prose-xs max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayText) }}
              />
            ) : (
              <p className="text-xs text-emerald-800 mt-1 line-clamp-3 break-words">{displayText}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onAccept}
              className="p-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              title="Qəbul et"
            >
              <Check size={12} />
            </button>
            {hasOriginal && onRevert && (
              <button
                type="button"
                onClick={onRevert}
                className="p-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                title="Geri qaytar"
              >
                <Undo2 size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={onReject}
              className="p-1.5 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
              title="Rədd et"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
