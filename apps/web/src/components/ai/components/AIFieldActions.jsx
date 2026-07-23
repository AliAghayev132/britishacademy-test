'use client';

import { Languages, Wand2, Loader2 } from 'lucide-react';

export default function AIFieldActions({ fieldKey, isLoading, onTranslate, onPolish, size = 'sm' }) {
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <div className="inline-flex items-center gap-1 ml-2">
      {onTranslate && (
        <button
          type="button"
          onClick={() => onTranslate(fieldKey)}
          disabled={isLoading}
          className="p-1 rounded text-violet-500 hover:bg-violet-50 hover:text-violet-700 transition-colors disabled:opacity-50"
          title="AI ilə tərcümə et"
        >
          {isLoading ? <Loader2 size={iconSize} className="animate-spin" /> : <Languages size={iconSize} />}
        </button>
      )}
      {onPolish && (
        <button
          type="button"
          onClick={() => onPolish(fieldKey)}
          disabled={isLoading}
          className="p-1 rounded text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-50"
          title="AI ilə səliqəyə sal"
        >
          {isLoading ? <Loader2 size={iconSize} className="animate-spin" /> : <Wand2 size={iconSize} />}
        </button>
      )}
    </div>
  );
}
