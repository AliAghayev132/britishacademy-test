"use client";

/** Kiçik seçim düymələri sırası. */
export default function QrChoice({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((op) => (
        <button
          key={op.key ?? op.px}
          type="button"
          onClick={() => onChange(op.key ?? op.px)}
          title={op.hint}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            value === (op.key ?? op.px)
              ? "border-[#00157A] bg-[#00157A] text-white"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
          }`}
        >
          {op.label}
        </button>
      ))}
    </div>
  );
}
