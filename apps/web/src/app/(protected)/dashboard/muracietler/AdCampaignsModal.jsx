"use client";

// React
import { useState } from "react";

// Icons
import { X } from "lucide-react";

// Components
import { Modal, notify, QueryState } from "@/components";

// Store
import { useAdCampaignsQuery, useUpdateAdCampaignsMutation } from "@/store";

// Utils
import { fmtDate, apiErrorMessage } from "@/utils";

// Local
import { AD_CHANNEL_BY_KEY } from "./adChannels";

/**
 * Kampaniya ID → ad uyğunluğu.
 *
 * Google Ads ünvana kampaniyanın ADINI yox, ID-sini qoyur ({campaignid}) —
 * ad dəyişəndə köhnə müraciətlər pozulmasın deyə. Burada hər ID-yə ad verilir,
 * siyahıda isə ad + ID birlikdə göstərilir.
 *
 * Müraciətlərdə görünüb hələ adı yazılmamış ID-lər avtomatik boş sətir kimi
 * gəlir — operator ID-ni Google Ads-dən köçürmək məcburiyyətində qalmır.
 */
export function AdCampaignsModal({ isOpen, onClose }) {
  const { data, isFetching, isError, error, refetch } = useAdCampaignsQuery(undefined, {
    skip: !isOpen,
    refetchOnMountOrArgChange: true,
  });
  const payload = data?.data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kampaniya adları" size="lg">
      {/* Redaktor açılışdakı TƏZƏ siyahı ilə başlayır — köhnə keşlə başlasa sonradan gələn ID-lər görünməzdi. */}
      {!payload || isFetching ? (
        <QueryState isLoading={isFetching} isError={isError} error={error} onRetry={refetch} />
      ) : (
        <Editor payload={payload} onClose={onClose} />
      )}
    </Modal>
  );
}

function initialRows({ map = [], seen = [] }) {
  const named = new Set(map.map((r) => r.id));
  const seenById = Object.fromEntries(seen.map((s) => [s.id, s]));
  return [
    // Adı yazılmamış, amma müraciətlərdə görünən ID-lər yuxarıda.
    ...seen.filter((s) => !named.has(s.id)).map((s) => ({ id: s.id, name: "", seen: s })),
    ...map.map((r) => ({ id: r.id, name: r.name, seen: seenById[r.id] })),
  ];
}

function Editor({ payload, onClose }) {
  const [rows, setRows] = useState(() => initialRows(payload));
  const [save, { isLoading: saving }] = useUpdateAdCampaignsMutation();

  const patch = (i, field, value) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
  const remove = (i) => setRows((rs) => rs.filter((_, j) => j !== i));
  const add = () => setRows((rs) => [...rs, { id: "", name: "" }]);

  const submit = async () => {
    // Adı boş qalan sətir (görünüb hələ adlandırılmamış ID) saxlanılmır — növbəti açılışda yenə gələcək.
    const map = rows
      .map((r) => ({ id: r.id.trim(), name: r.name.trim() }))
      .filter((r) => r.id && r.name);
    try {
      await save(map).unwrap();
      notify.success("Kampaniya adları yadda saxlanıldı");
      onClose();
    } catch (err) {
      notify.error(apiErrorMessage(err, "Yadda saxlanılmadı"));
    }
  };

  const input = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500";

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Google Ads ünvana kampaniyanın ID-sini yazır. ID-ni Google Ads-dəki kampaniya adı ilə uyğunlaşdırın —
        müraciətlər siyahısında ad göstəriləcək.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          Hələ reklam kampaniyasından müraciət gəlməyib.
        </div>
      ) : (
        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_32px] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <span>Kampaniya ID</span>
            <span>Ad</span>
            <span />
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_32px] items-start gap-2">
              <div>
                <input
                  value={r.id}
                  onChange={(e) => patch(i, "id", e.target.value)}
                  placeholder="21458930412"
                  maxLength={150}
                  className={`${input} font-mono tabular-nums`}
                />
                {r.seen && (
                  <div className="mt-1 px-1 text-[11px] text-gray-400">
                    {r.seen.count} müraciət · son {fmtDate(r.seen.lastAt)}
                    {r.seen.channel && AD_CHANNEL_BY_KEY[r.seen.channel] && ` · ${AD_CHANNEL_BY_KEY[r.seen.channel].label}`}
                  </div>
                )}
              </div>
              <input
                value={r.name}
                onChange={(e) => patch(i, "name", e.target.value)}
                placeholder="Məs: İngilis dili — Bakı, axtarış"
                maxLength={200}
                className={`${input} ${r.seen && !r.name ? "border-amber-300 bg-amber-50/40" : ""}`}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-lg border border-gray-200 p-1.5 text-red-500 hover:bg-red-50"
                aria-label="Sil"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-700"
        >
          + Kampaniya əlavə et
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-[#00157A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00157A]/90 disabled:opacity-60"
          >
            {saving ? "Saxlanılır…" : "Yadda saxla"}
          </button>
        </div>
      </div>
    </div>
  );
}
