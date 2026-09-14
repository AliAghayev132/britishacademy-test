// Icons
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

/** WhatsApp bağlantısının vəziyyəti: mətn, rəng və ikon. */
export function connectionState({ isLoading, installed = true, isReady, isInitializing, qrDataUrl, pairingCode }) {
  if (isLoading) return { text: "Yoxlanılır…", tone: "gray", Icon: Loader2, spin: true };
  if (!installed) return { text: "Quraşdırılmayıb", tone: "gray", Icon: XCircle };
  if (isReady) return { text: "Qoşulub", tone: "green", Icon: CheckCircle2 };
  if (isInitializing) return { text: "Başladılır…", tone: "amber", Icon: Loader2, spin: true };
  if (qrDataUrl || pairingCode) return { text: "Qoşulma gözlənilir", tone: "blue", Icon: Loader2, spin: true };
  return { text: "Qoşulmayıb", tone: "red", Icon: XCircle };
}

const TONES = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  red: "border-red-200 bg-red-50 text-red-700",
  gray: "border-gray-200 bg-gray-50 text-gray-600",
};

/** Başlıqdakı kiçik nişan: «WhatsApp · Qoşulub». */
export function ConnectionBadge({ status, isLoading }) {
  const { text, tone, Icon, spin } = connectionState({ ...status, isLoading });
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${TONES[tone]}`}>
      <Icon className={`h-3.5 w-3.5 ${spin ? "animate-spin" : ""}`} />
      WhatsApp · {text}
    </span>
  );
}
