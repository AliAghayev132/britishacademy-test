"use client";

// Local
import { input, label } from "../shared";

/** Mesajlar arası fasilə — boş dəyər kanalın defoltu deməkdir. */
export function DelaySettings({ limits, delaySec, onDelaySec, isEmail }) {
  return (
    <div>
      <label className={label}>Mesajlar arası fasilə</label>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <input
            type="number"
            min={limits.min}
            max={limits.max}
            step={1}
            value={delaySec}
            onChange={(e) => onDelaySec(e.target.value)}
            placeholder={String(limits.def)}
            className={`${input} w-32 pr-12`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
            san
          </span>
        </div>
        {[3, 6, 10, 20, 30].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onDelaySec(String(v))}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              String(v) === delaySec
                ? "border-blue-900 bg-blue-900 text-white"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {v} san
          </button>
        ))}
        {delaySec !== "" && (
          <button
            type="button"
            onClick={() => onDelaySec("")}
            className="text-xs font-semibold text-gray-500 underline-offset-2 hover:underline"
          >
            defolt
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Boş buraxsan {limits.def} san işlənir. İcazə verilən aralıq{" "}
        {limits.min}–{limits.max} san.
        {!isEmail && " WhatsApp-da fasiləyə 0–30% təsadüfi əlavə olunur — eyni ritm avtomat kimi görünür və bloklanma riskini artırır."}
      </p>
    </div>
  );
}
