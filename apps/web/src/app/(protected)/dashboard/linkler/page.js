"use client";

// React
import { useMemo, useState } from "react";
// Data
import {
  useAdminListQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
  useAdminDeleteMutation,
  useLinkStatsQuery,
  useResetLinkClicksMutation,
} from "@/store/api/adminApi";
// UI
import { QueryState } from "@/components/ui/QueryState";
import { confirmDialog, notify } from "@/components/ui/feedback";
// Icons
import {
  Link2, Plus, Copy, Check, Trash2, BarChart3, Power,
  Smartphone, Monitor, Globe, Clock, Users, MousePointerClick, X,
} from "lucide-react";

/**
 * İzlənilən kampaniya linkləri.
 *
 * Reklam verəndə hər kanal üçün ayrıca link yaradılır. Klik SERVERDƏ sayılır,
 * ona görə rəqəm reklam platformasının öz hesabatından asılı deyil — iki
 * mənbəni tutuşdurmaq mümkün olur.
 *
 * Hədəf sonradan dəyişdirilə bilər: eyni link paylaşıldıqdan sonra başqa
 * səhifəyə yönləndirilsin deyə. UTM parametrləri ilə bu mümkün deyil.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

const DEVICE_LABEL = {
  mobile: "Mobil", tablet: "Planşet", desktop: "Kompüter", bot: "Bot", other: "Digər",
};

const WINDOWS = [
  { days: 7, label: "7 gün" },
  { days: 30, label: "30 gün" },
  { days: 90, label: "90 gün" },
];

const input =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#00157A] focus:ring-2 focus:ring-[#00157A]/10";

/** Kodu ünvana yararlı hala gətir — boşluq və AZ hərfləri linki sındırır. */
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/ə/g, "e").replace(/ı/g, "i").replace(/ö/g, "o")
    .replace(/ü/g, "u").replace(/ç/g, "c").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

/** Sadə üfüqi sütun siyahısı — ən böyük dəyər tam eni tutur. */
function BarList({ title, icon: Icon, rows, empty }) {
  const max = Math.max(...rows.map((r) => r.count || 0), 1);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Icon className="h-4 w-4 text-gray-400" />
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="py-3 text-sm text-gray-400">{empty}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-gray-700">{r.label}</span>
                <span className="flex-none text-sm font-bold text-gray-900">
                  {r.count.toLocaleString("az-AZ")}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#00157A]"
                  style={{ width: `${Math.max((r.count / max) * 100, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Klik dinamikası — kitabxanasız sütun qrafiki. */
function ClickChart({ series }) {
  const max = Math.max(...series.map((s) => s.count), 1);
  const total = series.reduce((s, x) => s + x.count, 0);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
        <BarChart3 className="h-4 w-4 text-gray-400" />
        Klik dinamikası
      </h3>
      <p className="mb-4 text-xs text-gray-400">
        Seçilmiş dövrdə <b className="text-gray-600">{total}</b> klik · ən yüksək gün: {max}
      </p>
      <div className="flex h-32 items-end gap-[2px]">
        {series.map((s) => (
          <div
            key={s.date}
            title={`${s.date}: ${s.count}`}
            className="flex-1 rounded-t bg-[#00157A] transition-all hover:bg-[#0022b8]"
            style={{ height: `${Math.max((s.count / max) * 100, 2)}%`, minWidth: 2 }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-gray-400">
        <span>{series[0]?.date}</span>
        <span>{series.at(-1)?.date}</span>
      </div>
    </div>
  );
}

/** Saat bölgüsü — reklamı nə vaxt göstərmək daha səmərəlidir. */
function HourChart({ hours }) {
  const max = Math.max(...hours.map((h) => h.count), 1);
  const peak = hours.reduce((a, b) => (b.count > a.count ? b : a), hours[0] || { hour: 0, count: 0 });
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Clock className="h-4 w-4 text-gray-400" />
        Saat üzrə bölgü
      </h3>
      <p className="mb-4 text-xs text-gray-400">
        Ən aktiv saat: <b className="text-gray-600">{String(peak.hour).padStart(2, "0")}:00</b>{" "}
        ({peak.count} klik) · Bakı vaxtı
      </p>
      <div className="flex h-24 items-end gap-[3px]">
        {hours.map((h) => (
          <div
            key={h.hour}
            className="flex-1"
            title={`${String(h.hour).padStart(2, "0")}:00 — ${h.count} klik`}
          >
            <div
              className="rounded-t bg-emerald-500/80 transition-all hover:bg-emerald-600"
              style={{ height: `${Math.max((h.count / max) * 96, 2)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-gray-400">
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
      </div>
    </div>
  );
}

/** Bir linkin detallı hesabatı. */
function LinkStats({ id, onClose }) {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, error, refetch } = useLinkStatsQuery({ id, days });
  const [resetClicks] = useResetLinkClicksMutation();

  if (isLoading || isError) {
    return <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />;
  }

  const d = data?.data || {};
  const t = d.totals || {};

  const cards = [
    { icon: MousePointerClick, label: "Ümumi klik", value: t.clicks, tone: "bg-blue-50 text-blue-700" },
    { icon: Users, label: "Unikal ziyarətçi", value: t.unique, tone: "bg-emerald-50 text-emerald-700" },
    { icon: MousePointerClick, label: `Son ${d.days} gündə klik`, value: t.clicksInWindow, tone: "bg-violet-50 text-violet-700" },
    { icon: Users, label: `Son ${d.days} gündə unikal`, value: t.uniqueInWindow, tone: "bg-amber-50 text-amber-700" },
  ];

  const runReset = async () => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Kliklər silinsin?",
      text: "Bu linkin <b>bütün klik tarixçəsi</b> silinir və sayğac sıfırlanır. Kampaniya başlamazdan əvvəl sınaq kliklərini təmizləmək üçündür.<br><br>Geri qaytarıla bilməz.",
      confirmText: "Bəli, sil",
    });
    if (!ok) return;
    try {
      const res = await resetClicks({ id }).unwrap();
      notify.success(res.message || "Silindi");
    } catch (e) {
      notify.error(e?.data?.message || "Alınmadı");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-gray-900">
            {d.link?.title || d.link?.code}
          </h2>
          <p className="truncate font-mono text-xs text-gray-500">
            /r/{d.link?.code} → {d.link?.target}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {WINDOWS.map((w) => (
            <button
              key={w.days}
              onClick={() => setDays(w.days)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                days === w.days
                  ? "border-[#00157A] bg-[#00157A] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {w.label}
            </button>
          ))}
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 flex-none place-items-center rounded-lg ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xl font-bold text-gray-900">
                  {(s.value || 0).toLocaleString("az-AZ")}
                </div>
                <div className="truncate text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mb-4 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
        <b>Unikal ziyarətçi</b> gün ərzində fərqli adamların sayıdır. Şəxsi məlumat
        saxlanılmır — ziyarətçi izi hər gün dəyişən duzla heşlənir, ona görə eyni
        adam iki fərqli gündə iki dəfə sayılır.
      </p>

      <div className="mb-4"><ClickChart series={d.series || []} /></div>
      <div className="mb-4"><HourChart hours={d.hours || []} /></div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Mənbə" icon={Globe} rows={d.bySource || []} empty="Klik yoxdur." />
        <BarList
          title="Cihaz"
          icon={Smartphone}
          rows={(d.byDevice || []).map((r) => ({ ...r, label: DEVICE_LABEL[r.label] || r.label }))}
          empty="Klik yoxdur."
        />
        <BarList title="Brauzer" icon={Monitor} rows={d.byBrowser || []} empty="Klik yoxdur." />
        <BarList title="Əməliyyat sistemi" icon={Monitor} rows={d.byOs || []} empty="Klik yoxdur." />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={runReset}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Klik tarixçəsini sıfırla
        </button>
      </div>
    </div>
  );
}

export default function LinksPage() {
  const { data, isLoading, isError, error, refetch } = useAdminListQuery({
    resource: "short-links",
    limit: 200,
  });
  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update] = useAdminUpdateMutation();
  const [remove] = useAdminDeleteMutation();

  const [form, setForm] = useState({ code: "", target: "", title: "", note: "" });
  const [openId, setOpenId] = useState(null);
  const [copied, setCopied] = useState(null);

  const items = useMemo(() => data?.data?.items || [], [data]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const code = slugify(form.code);
    if (!code) {
      notify.error("Kod boş ola bilməz");
      return;
    }
    if (!form.target.trim()) {
      notify.error("Hədəf ünvan boş ola bilməz");
      return;
    }
    try {
      await create({ resource: "short-links", data: { ...form, code } }).unwrap();
      notify.success("Link yaradıldı");
      setForm({ code: "", target: "", title: "", note: "" });
    } catch (err) {
      // Kod təkrarlanırsa Mongo unikal indeks səhvi qaytarır — anlaşılan mesaja çevir.
      const msg = err?.data?.message || "";
      notify.error(/duplicate|E11000/i.test(msg) ? "Bu kod artıq işlənir" : msg || "Yaradıla bilmədi");
    }
  };

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(`${SITE_URL}/r/${code}`);
      setCopied(code);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      notify.error("Kopyalana bilmədi");
    }
  };

  const toggle = async (link) => {
    try {
      await update({
        resource: "short-links",
        id: link._id,
        data: { isActive: !link.isActive },
      }).unwrap();
    } catch (e) {
      notify.error(e?.data?.message || "Dəyişdirilə bilmədi");
    }
  };

  const runDelete = async (link) => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Link silinsin?",
      text: `<b>/r/${link.code}</b> silinir. Bu linki paylaşdığın yerlərdə artıq işləməyəcək və ziyarətçilər ana səhifəyə düşəcək.`,
      confirmText: "Sil",
    });
    if (!ok) return;
    try {
      await remove({ resource: "short-links", id: link._id }).unwrap();
      if (openId === link._id) setOpenId(null);
      notify.success("Silindi");
    } catch (e) {
      notify.error(e?.data?.message || "Silinə bilmədi");
    }
  };

  if (isLoading || isError) {
    return <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-5">
      {/* Yeni link */}
      <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Link2 className="h-5 w-5 text-gray-400" />
          Yeni izlənilən link
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Reklam kanalı üçün ayrıca link yarat — klikləri buradan detallı izləyəcəksən.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Kod
            </label>
            <div className="flex items-center gap-2">
              <span className="flex-none font-mono text-xs text-gray-400">{SITE_URL}/r/</span>
              <input
                className={input}
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="ig-sentyabr"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Yalnız kiçik hərf, rəqəm və tire.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Hədəf ünvan
            </label>
            <input
              className={input}
              value={form.target}
              onChange={(e) => set("target", e.target.value)}
              placeholder="/kurslar/ielts-kurslari"
            />
            <p className="mt-1 text-xs text-gray-400">
              Saytdaxili ünvan (“/” ilə) və ya tam https:// linki.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Kampaniyanın adı
            </label>
            <input
              className={input}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Instagram — sentyabr endirimi"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Qeyd
            </label>
            <input
              className={input}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Büdcə 200 AZN, 10–20 sentyabr"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#00157A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#001a99] disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {creating ? "Yaradılır…" : "Link yarat"}
        </button>
      </form>

      {/* Siyahı */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Hədəf</th>
                <th className="px-4 py-3 text-right">Klik</th>
                <th className="px-4 py-3">Son klik</th>
                <th className="px-4 py-3 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    Hələ link yaradılmayıb.
                  </td>
                </tr>
              )}
              {items.map((l) => (
                <tr key={l._id} className={l.isActive ? "" : "bg-gray-50/60 opacity-70"}>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-bold text-gray-900">/r/{l.code}</div>
                    {l.title && <div className="mt-0.5 text-xs text-gray-500">{l.title}</div>}
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <div className="truncate font-mono text-xs text-gray-500" title={l.target}>
                      {l.target}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-gray-900">
                      {(l.clicks || 0).toLocaleString("az-AZ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {l.lastClickAt ? new Date(l.lastClickAt).toLocaleString("az-AZ") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => copy(l.code)}
                        title="Linki kopyala"
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50"
                      >
                        {copied === l.code
                          ? <Check className="h-4 w-4 text-emerald-600" />
                          : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setOpenId(openId === l._id ? null : l._id)}
                        title="Hesabat"
                        className={`rounded-lg border p-1.5 transition ${
                          openId === l._id
                            ? "border-[#00157A] bg-[#00157A] text-white"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggle(l)}
                        title={l.isActive ? "Bağla" : "Aç"}
                        className={`rounded-lg border p-1.5 transition ${
                          l.isActive
                            ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            : "border-gray-200 text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => runDelete(l)}
                        title="Sil"
                        className="rounded-lg border border-red-200 p-1.5 text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openId && <LinkStats id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
