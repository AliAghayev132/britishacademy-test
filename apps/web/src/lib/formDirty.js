"use client";

import { createContext, useContext } from "react";

/**
 * Admin formasında «dəyişiklik oldu» siqnalı (audit #29).
 *
 * Overlay yalnız DOM `input`/`change` hadisələrini sayırdı — xüsusi seçim
 * qutusu, açarlar, çiplər, sətir əlavə/silmə, AI tərcümə, media seçimi və
 * redaktor düymələri heç nə işarələmirdi və admin «İmtina» basanda işi
 * xəbərdarlıqsız itirirdi. Bu komponentlər dəyəri dəyişəndə `markDirty()`
 * çağırır. Overlay-dan kənarda (məs. tənzimləmələr səhifəsi) heç nə etmir.
 */
export const FormDirtyContext = createContext(() => {});

export const useMarkDirty = () => useContext(FormDirtyContext);
