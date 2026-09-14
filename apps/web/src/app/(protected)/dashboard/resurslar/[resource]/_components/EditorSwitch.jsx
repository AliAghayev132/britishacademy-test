"use client";

// Local
import { BESPOKE_FORMS } from "../../../_forms";
import JsonEditorModal from "./JsonEditorModal";

/**
 * Resursa uyğun redaktor: xüsusi forma varsa o, yoxdursa JSON redaktoru.
 * Bespoke per-resource forms can replace the JSON screen gradually — the API
 * contract stays the same.
 */
export default function EditorSwitch({ resource, item, title, onClose }) {
  const Bespoke = BESPOKE_FORMS[resource]; // purpose-built form, or undefined → JSON editor

  // Bespoke form (teachers / branches / courses) — renders its own modal.
  if (Bespoke) return <Bespoke item={item} onClose={onClose} />;

  return <JsonEditorModal resource={resource} item={item} title={title} onClose={onClose} />;
}
