"use client";

// Local
import { input, label } from "../shared";

/** Mövzu (yalnız e-poçt) + mesaj şablonu. */
export function MessageEditor({ isEmail, subject, onSubject, template, onTemplate }) {
  return (
    <>
      {isEmail && (
        <div>
          <label className={label}>Mövzu <span className="text-red-500">*</span></label>
          <input
            value={subject}
            onChange={(e) => onSubject(e.target.value)}
            placeholder="British Academy — yeni qrup elanı"
            className={input}
          />
        </div>
      )}

      <div>
        <label className={label}>Mesaj mətni <span className="text-red-500">*</span></label>
        <textarea
          rows={5}
          value={template}
          onChange={(e) => onTemplate(e.target.value)}
          placeholder="Salam {{ad}}! British Academy-də yeni qrup açılır…"
          className={`${input} resize-none`}
        />
        <p className="mt-1 text-xs text-gray-400">
          Dəyişənlər: <span className="font-mono">{"{{ad}}"}</span>,{" "}
          <span className="font-mono">{isEmail ? "{{email}}" : "{{telefon}}"}</span>
        </p>
      </div>
    </>
  );
}
