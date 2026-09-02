"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ApplyModal } from "./ApplyModal";
import { WhatsAppWidget } from "./WhatsAppWidget";

const ApplyCtx = createContext(null);

/** Any client component can open the "Müraciət et" modal via useApply(). */
export function useApply() {
  return useContext(ApplyCtx) || { open: () => {}, close: () => {} };
}

/**
 * Client shell that provides the apply-modal context and renders the two global
 * overlays (apply modal + WhatsApp branch picker). Server-rendered Header,
 * page content and Footer are passed through as `children`.
 */
export function SiteProvider({ branches = [], destinations = [], children }) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [preset, setPreset] = useState(null);
  // Layihə səhifəsindən açılanda müraciət həmin layihəyə bağlanır.
  const [presetProject, setPresetProject] = useState(null);

  const open = useCallback((interest, extra) => {
    setPreset(interest || null);
    setPresetProject(extra?.project || null);
    setApplyOpen(true);
  }, []);
  const close = useCallback(() => setApplyOpen(false), []);

  return (
    <ApplyCtx.Provider value={{ open, close }}>
      {children}
      <ApplyModal
        open={applyOpen}
        onClose={close}
        preset={preset}
        project={presetProject}
        branches={branches}
        destinations={destinations}
      />
      <WhatsAppWidget branches={branches} />
    </ApplyCtx.Provider>
  );
}
