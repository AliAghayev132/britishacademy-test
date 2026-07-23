'use client';

import { Languages, Sparkles, Wand2, CheckCheck, Loader2 } from 'lucide-react';

export default function AIToolbar({
  onTranslateAll,
  onPolishAll,
  onAcceptAll,
  isTranslating,
  isPolishing,
  hasSuggestions,
  sourceLang,
  targetLang,
}) {
  const langLabels = { az: 'AZ', en: 'EN' };

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200/60 rounded-xl">
      <Sparkles size={16} className="text-violet-500 shrink-0" />
      <span className="text-xs font-semibold text-violet-700 mr-1">AI</span>

      <button
        type="button"
        onClick={onTranslateAll}
        disabled={isTranslating || isPolishing}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {isTranslating ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Languages size={14} />
        )}
        Tərcümə ({langLabels[sourceLang]}→{langLabels[targetLang]})
      </button>

      <button
        type="button"
        onClick={onPolishAll}
        disabled={isTranslating || isPolishing}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {isPolishing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Wand2 size={14} />
        )}
        Səliqəyə sal
      </button>

      {hasSuggestions && (
        <button
          type="button"
          onClick={onAcceptAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm ml-auto"
        >
          <CheckCheck size={14} />
          Hamısını qəbul et
        </button>
      )}
    </div>
  );
}
