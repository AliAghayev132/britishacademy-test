'use client';

import { useState, useCallback } from 'react';
import { useAI } from '@/hooks/useAI';
import { toast } from '@/lib/toast';

/**
 * useAIHandlers — Shared AI handler logic for form pages.
 *
 * @param {Object} options
 * @param {Function} options.getTranslatableFields - Returns fields map for current step
 * @param {Function} options.updateLocalizedField - (key, lang, value) => void
 * @param {Function} options.updateSeoField - (key, lang, value) => void (optional)
 * @param {Function} options.updateField - (key, value) => void (optional)
 * @param {string} options.currentLang - 'az' | 'en'
 * @param {Object} options.formData - Form data object
 * @param {string[]} options.seoFields - Fields that are SEO (default: ['metaTitle', 'metaDescription'])
 * @param {string[]} options.htmlFields - Fields that are HTML (default: ['content'])
 */
export function useAIHandlers({
  getTranslatableFields,
  updateLocalizedField,
  updateSeoField,
  updateField,
  currentLang,
  formData,
  seoFields = ['metaTitle', 'metaDescription'],
  htmlFields = ['content'],
}) {
  const ai = useAI();
  const [aiTranslating, setAiTranslating] = useState(false);
  const [aiPolishing, setAiPolishing] = useState(false);

  const targetLang = currentLang === 'az' ? 'en' : 'az';

  const handleTranslateAll = useCallback(async () => {
    setAiTranslating(true);
    await ai.translateFields(getTranslatableFields(), currentLang, targetLang);
    setAiTranslating(false);
    toast.success('Tərcümə hazırdır');
  }, [ai, getTranslatableFields, currentLang, targetLang]);

  const handlePolishAll = useCallback(async () => {
    setAiPolishing(true);
    await ai.polishFields(getTranslatableFields(), currentLang);
    setAiPolishing(false);
    toast.success('Düzəlişlər hazırdır');
  }, [ai, getTranslatableFields, currentLang]);

  const handleAcceptAll = useCallback(() => {
    const all = ai.acceptAllSuggestions();
    for (const [key, value] of Object.entries(all)) {
      if (seoFields.includes(key) && updateSeoField) {
        updateSeoField(key, targetLang, value);
      } else {
        updateLocalizedField(key, targetLang, value);
      }
    }
    toast.success('Hamısı qəbul edildi');
  }, [ai, seoFields, updateSeoField, updateLocalizedField, targetLang]);

  const handleAcceptField = useCallback((fieldKey, lang) => {
    const value = ai.acceptSuggestion(fieldKey);
    if (value !== undefined) {
      if (seoFields.includes(fieldKey) && updateSeoField) {
        updateSeoField(fieldKey, lang, value);
      } else {
        updateLocalizedField(fieldKey, lang, value);
      }
    }
  }, [ai, seoFields, updateSeoField, updateLocalizedField]);

  const handleRevertField = useCallback((fieldKey) => {
    const value = ai.revertField(fieldKey);
    if (value !== undefined) {
      if (seoFields.includes(fieldKey) && updateSeoField) {
        updateSeoField(fieldKey, currentLang, value);
      } else {
        updateLocalizedField(fieldKey, currentLang, value);
      }
    }
  }, [ai, seoFields, updateSeoField, updateLocalizedField, currentLang]);

  const handleTranslateField = useCallback(async (fieldKey) => {
    if (seoFields.includes(fieldKey) && formData?.seo) {
      await ai.translateField(fieldKey, formData.seo[fieldKey]?.[currentLang], currentLang, targetLang);
    } else {
      const isHtml = htmlFields.includes(fieldKey);
      await ai.translateField(fieldKey, formData[fieldKey]?.[currentLang], currentLang, targetLang, isHtml);
    }
  }, [ai, seoFields, htmlFields, formData, currentLang, targetLang]);

  const handlePolishField = useCallback(async (fieldKey) => {
    if (seoFields.includes(fieldKey) && formData?.seo) {
      await ai.polishField(fieldKey, formData.seo[fieldKey]?.[currentLang], currentLang);
    } else {
      const isHtml = htmlFields.includes(fieldKey);
      await ai.polishField(fieldKey, formData[fieldKey]?.[currentLang], currentLang, isHtml);
    }
  }, [ai, seoFields, htmlFields, formData, currentLang]);

  const handleGenerateKeywords = useCallback(async () => {
    const content = [
      formData?.title?.az, formData?.title?.en,
      formData?.excerpt?.az, formData?.excerpt?.en,
    ].filter(Boolean).join(' ');

    const keywords = await ai.generateKeywords(content);
    if (keywords?.length > 0 && updateField) {
      const existing = formData?.seo?.keywords || [];
      const merged = [...new Set([...existing, ...keywords])];
      updateField('seo', { ...formData.seo, keywords: merged });
      toast.success('Açar sözlər yaradıldı');
    }
  }, [ai, formData, updateField]);

  const handleGenerateSeo = useCallback(async () => {
    const content = [
      formData?.title?.[currentLang],
      formData?.excerpt?.[currentLang],
      formData?.content?.[currentLang],
    ].filter(Boolean).join('\n');

    if (!content) {
      toast.error('SEO üçün əvvəlcə məzmun daxil edin');
      return null;
    }

    try {
      const seo = await ai.callAI({
        action: 'generate-seo',
        content,
        sourceLang: currentLang,
      });
      if (seo) {
        if (seo.metaTitle && updateSeoField) updateSeoField('metaTitle', currentLang, seo.metaTitle);
        if (seo.metaDescription && updateSeoField) updateSeoField('metaDescription', currentLang, seo.metaDescription);
        if (seo.keywords?.length && updateField) {
          const existing = formData?.seo?.keywords || [];
          const merged = [...new Set([...existing, ...seo.keywords])];
          updateField('seo', { ...formData.seo, keywords: merged });
        }
        toast.success('SEO məlumatları yaradıldı');
        return seo;
      }
    } catch (error) {
      toast.error(error.message || 'SEO yaradılarkən xəta baş verdi');
    }
    return null;
  }, [ai, formData, currentLang, updateSeoField, updateField]);

  return {
    ai,
    aiTranslating,
    aiPolishing,
    targetLang,
    handleTranslateAll,
    handlePolishAll,
    handleAcceptAll,
    handleAcceptField,
    handleRevertField,
    handleTranslateField,
    handlePolishField,
    handleGenerateKeywords,
    handleGenerateSeo,
  };
}
