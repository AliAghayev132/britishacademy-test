'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/lib/toast';
import { useProcessAIMutation } from '@/store/api';

export function useAI() {
  const [loadingFields, setLoadingFields] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [originalValues, setOriginalValues] = useState({});
  const [suggestionTypes, setSuggestionTypes] = useState({});
  // When the server reports AI is not configured (503), flip this so the UI can
  // disable AI actions / show a note.
  const [aiAvailable, setAiAvailable] = useState(true);

  const [processAI] = useProcessAIMutation();

  const setFieldLoading = useCallback((fieldKey, loading) => {
    setLoadingFields((prev) => ({ ...prev, [fieldKey]: loading }));
  }, []);

  const setSuggestion = useCallback((fieldKey, value) => {
    setSuggestions((prev) => ({ ...prev, [fieldKey]: value }));
  }, []);

  const clearSuggestion = useCallback((fieldKey) => {
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setOriginalValues((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setSuggestionTypes((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  const clearAllSuggestions = useCallback(() => {
    setSuggestions({});
    setOriginalValues({});
    setSuggestionTypes({});
  }, []);

  // Dispatches an AI action through the RTK Query mutation (POST /ai/process).
  // Server envelope: { success, data: { result } }. When AI is disabled the
  // server replies 503 and we degrade gracefully.
  const callAI = useCallback(
    async (body) => {
      try {
        const res = await processAI(body).unwrap();
        setAiAvailable(true);
        if (res && res.success === false) {
          throw new Error(res.message || 'AI error occurred');
        }
        const payload = res?.data;
        // Prefer the generic `{ result }` envelope; fall back to the raw data.
        return payload && Object.prototype.hasOwnProperty.call(payload, 'result')
          ? payload.result
          : payload;
      } catch (err) {
        if (err?.status === 503) {
          setAiAvailable(false);
          throw new Error(
            err?.data?.message || 'AI service is not configured'
          );
        }
        throw new Error(
          err?.data?.message || err?.message || 'AI error occurred'
        );
      }
    },
    [processAI]
  );

  // Translate a single field
  const translateField = useCallback(
    async (fieldKey, value, sourceLang, targetLang, isHtml = false) => {
      if (!value?.trim()) {
        toast.error('Tərcümə üçün mətn daxil edin');
        return null;
      }

      setFieldLoading(fieldKey, true);
      try {
        const result = await callAI({
          action: 'translate',
          content: value,
          sourceLang,
          targetLang,
          isHtml,
        });
        setSuggestion(fieldKey, result);
        setSuggestionTypes((prev) => ({ ...prev, [fieldKey]: 'translate' }));
        return result;
      } catch (error) {
        toast.error(error.message);
        return null;
      } finally {
        setFieldLoading(fieldKey, false);
      }
    },
    [callAI, setFieldLoading, setSuggestion]
  );

  // Translate multiple fields at once
  const translateFields = useCallback(
    async (fieldsMap, sourceLang, targetLang) => {
      const nonEmpty = {};
      const htmlFields = {};

      for (const [key, { value, isHtml }] of Object.entries(fieldsMap)) {
        if (value?.trim()) {
          nonEmpty[key] = value;
          if (isHtml) htmlFields[key] = true;
        }
      }

      if (Object.keys(nonEmpty).length === 0) {
        toast.error('Tərcümə üçün mətn daxil edin');
        return null;
      }

      // Separate HTML and plain text fields
      const plainFields = {};
      const htmlFieldsData = {};
      for (const [key, value] of Object.entries(nonEmpty)) {
        if (htmlFields[key]) {
          htmlFieldsData[key] = value;
        } else {
          plainFields[key] = value;
        }
      }

      const loadingKeys = Object.keys(nonEmpty);
      loadingKeys.forEach((k) => setFieldLoading(k, true));

      try {
        const results = {};

        // Translate plain text fields in batch
        if (Object.keys(plainFields).length > 0) {
          const plainResult = await callAI({
            action: 'translate',
            fields: plainFields,
            sourceLang,
            targetLang,
          });

          if (typeof plainResult === 'object') {
            Object.assign(results, plainResult);
          }
        }

        // Translate HTML fields one by one
        for (const [key, value] of Object.entries(htmlFieldsData)) {
          const htmlResult = await callAI({
            action: 'translate',
            content: value,
            sourceLang,
            targetLang,
            isHtml: true,
          });
          results[key] = htmlResult;
        }

        // Set suggestions for each field
        for (const [key, value] of Object.entries(results)) {
          setSuggestion(key, value);
          setSuggestionTypes((prev) => ({ ...prev, [key]: 'translate' }));
        }

        return results;
      } catch (error) {
        toast.error(error.message);
        return null;
      } finally {
        loadingKeys.forEach((k) => setFieldLoading(k, false));
      }
    },
    [callAI, setFieldLoading, setSuggestion]
  );

  // Polish a single field
  const polishField = useCallback(
    async (fieldKey, value, lang, isHtml = false) => {
      if (!value?.trim()) {
        toast.error('Düzəltmə üçün mətn daxil edin');
        return null;
      }

      setFieldLoading(fieldKey, true);
      try {
        const result = await callAI({
          action: 'polish',
          content: value,
          sourceLang: lang,
          isHtml,
        });
        setOriginalValues((prev) => ({ ...prev, [fieldKey]: value }));
        setSuggestion(fieldKey, result);
        setSuggestionTypes((prev) => ({ ...prev, [fieldKey]: 'polish' }));
        return result;
      } catch (error) {
        toast.error(error.message);
        return null;
      } finally {
        setFieldLoading(fieldKey, false);
      }
    },
    [callAI, setFieldLoading, setSuggestion]
  );

  // Polish multiple fields at once
  const polishFields = useCallback(
    async (fieldsMap, lang) => {
      const nonEmpty = {};
      const htmlFields = {};

      for (const [key, { value, isHtml }] of Object.entries(fieldsMap)) {
        if (value?.trim()) {
          nonEmpty[key] = value;
          if (isHtml) htmlFields[key] = true;
        }
      }

      if (Object.keys(nonEmpty).length === 0) {
        toast.error('Düzəltmə üçün mətn daxil edin');
        return null;
      }

      const plainFields = {};
      const htmlFieldsData = {};
      for (const [key, value] of Object.entries(nonEmpty)) {
        if (htmlFields[key]) {
          htmlFieldsData[key] = value;
        } else {
          plainFields[key] = value;
        }
      }

      const loadingKeys = Object.keys(nonEmpty);
      loadingKeys.forEach((k) => setFieldLoading(k, true));

      // Save originals
      const originals = {};
      for (const [key, value] of Object.entries(nonEmpty)) {
        originals[key] = value;
      }
      setOriginalValues((prev) => ({ ...prev, ...originals }));

      try {
        const results = {};

        if (Object.keys(plainFields).length > 0) {
          const plainResult = await callAI({
            action: 'polish',
            fields: plainFields,
            sourceLang: lang,
          });
          if (typeof plainResult === 'object') {
            Object.assign(results, plainResult);
          }
        }

        for (const [key, value] of Object.entries(htmlFieldsData)) {
          const htmlResult = await callAI({
            action: 'polish',
            content: value,
            sourceLang: lang,
            isHtml: true,
          });
          results[key] = htmlResult;
        }

        for (const [key, value] of Object.entries(results)) {
          setSuggestion(key, value);
          setSuggestionTypes((prev) => ({ ...prev, [key]: 'polish' }));
        }

        return results;
      } catch (error) {
        toast.error(error.message);
        return null;
      } finally {
        loadingKeys.forEach((k) => setFieldLoading(k, false));
      }
    },
    [callAI, setFieldLoading, setSuggestion]
  );

  // Generate slug from title
  const generateSlug = useCallback(
    async (title) => {
      if (!title?.trim()) return null;

      setFieldLoading('slug', true);
      try {
        const result = await callAI({
          action: 'generate-slug',
          content: title,
        });
        return result;
      } catch (error) {
        toast.error(error.message);
        return null;
      } finally {
        setFieldLoading('slug', false);
      }
    },
    [callAI, setFieldLoading]
  );

  // Generate keywords from content
  const generateKeywords = useCallback(
    async (content) => {
      if (!content?.trim()) {
        toast.error('Açar sözlər üçün məzmun daxil edin');
        return null;
      }

      setFieldLoading('keywords', true);
      try {
        const result = await callAI({
          action: 'generate-keywords',
          content,
        });
        return Array.isArray(result) ? result : [];
      } catch (error) {
        toast.error(error.message);
        return null;
      } finally {
        setFieldLoading('keywords', false);
      }
    },
    [callAI, setFieldLoading]
  );

  // Accept a suggestion and apply it
  const acceptSuggestion = useCallback(
    (fieldKey) => {
      const value = suggestions[fieldKey];
      clearSuggestion(fieldKey);
      return value;
    },
    [suggestions, clearSuggestion]
  );

  // Revert to original value (for polish)
  const revertField = useCallback(
    (fieldKey) => {
      const value = originalValues[fieldKey];
      clearSuggestion(fieldKey);
      return value;
    },
    [originalValues, clearSuggestion]
  );

  // Accept all suggestions
  const acceptAllSuggestions = useCallback(() => {
    const all = { ...suggestions };
    clearAllSuggestions();
    return all;
  }, [suggestions, clearAllSuggestions]);

  return {
    aiAvailable,
    callAI,
    loadingFields,
    suggestions,
    originalValues,
    suggestionTypes,
    translateField,
    translateFields,
    polishField,
    polishFields,
    generateSlug,
    generateKeywords,
    acceptSuggestion,
    revertField,
    acceptAllSuggestions,
    clearSuggestion,
    clearAllSuggestions,
  };
}
