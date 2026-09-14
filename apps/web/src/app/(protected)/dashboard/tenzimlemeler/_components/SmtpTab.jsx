"use client";

// Components
import { Switch } from "@/components";

// Local
import { Section, input, label } from "./shared";

/**
 * «SMTP (email)» tabı. Test məktubunun ünvanı və göndərişi səhifədə qalır —
 * tab dəyişəndə yazılmış test ünvanı itməsin.
 */
export function SmtpTab({ form, set, testTo, setTestTo, sendTest, testing }) {
  return (
    <Section title="SMTP (email göndərişi)">
      <div className="sm:col-span-2 flex items-center gap-2">
        <Switch checked={form.smtp.enabled} onChange={(v) => set("smtp.enabled", v)} label="SMTP aktiv (email göndərişi üçün)" />
      </div>
      <div>
        <label className={label}>Host</label>
        <input className={input} placeholder="smtp.gmail.com" value={form.smtp.host} onChange={(e) => set("smtp.host", e.target.value)} />
      </div>
      <div>
        <label className={label}>Port</label>
        <input type="number" className={input} placeholder="587" value={form.smtp.port} onChange={(e) => set("smtp.port", e.target.value)} />
      </div>
      <div className="flex items-center gap-2 pt-6">
        <Switch checked={form.smtp.secure} onChange={(v) => set("smtp.secure", v)} label="Secure (SSL — port 465)" />
      </div>
      <div>
        <label className={label}>İstifadəçi (user)</label>
        <input className={input} placeholder="mail@domain.com" value={form.smtp.user} onChange={(e) => set("smtp.user", e.target.value)} />
      </div>
      <div>
        <label className={label}>Parol {form.smtp.hasPass && <span className="text-emerald-600">(təyin olunub)</span>}</label>
        <input type="password" autoComplete="new-password" className={input} placeholder={form.smtp.hasPass ? "•••••••• (dəyişmək üçün yaz)" : "SMTP parolu"} value={form.smtp.pass} onChange={(e) => set("smtp.pass", e.target.value)} />
      </div>
      <div>
        <label className={label}>Göndərən adı (from name)</label>
        <input className={input} placeholder="British Academy" value={form.smtp.fromName} onChange={(e) => set("smtp.fromName", e.target.value)} />
      </div>
      <div>
        <label className={label}>Göndərən email (from)</label>
        <input className={input} placeholder="info@britishacademy.az" value={form.smtp.fromEmail} onChange={(e) => set("smtp.fromEmail", e.target.value)} />
      </div>
      {/* ── Müraciət bildirişi ── */}
      <div className="sm:col-span-2 flex items-center gap-2 border-t border-gray-100 pt-4">
        <Switch checked={form.smtp.notifyLeads} onChange={(v) => set("smtp.notifyLeads", v)} label="Yeni müraciət gələndə mənə məktub göndər" />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Bildiriş ünvanı</label>
        <input className={input} placeholder={form.smtp.fromEmail || form.smtp.user || "boş = SMTP-nin öz ünvanı"} value={form.smtp.notifyEmail} onChange={(e) => set("smtp.notifyEmail", e.target.value)} />
        <p className="mt-1.5 text-xs text-gray-400">
          Boş buraxsanız bildiriş SMTP hesabının <b>öz ünvanına</b> gedir (yuxarıdakı «Göndərən email»).
          Bir neçə ünvan üçün vergüllə ayırın.
        </p>
      </div>

      <div className="sm:col-span-2 rounded-lg bg-gray-50 p-3">
        <label className={label}>Test məktubu göndər</label>
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${input} max-w-xs`} placeholder="test@ünvan.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          <button onClick={sendTest} disabled={testing} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
            {testing ? "Göndərilir…" : "Test göndər"}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">Əvvəlcə SMTP-ni yadda saxlayın, sonra test göndərin.</p>
      </div>
    </Section>
  );
}
