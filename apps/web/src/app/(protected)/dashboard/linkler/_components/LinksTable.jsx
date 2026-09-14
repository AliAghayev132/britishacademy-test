"use client";

// Components
import { notify } from "@/components";

// Hooks
import { useFlash } from "@/hooks";

// Store
import { useAdminUpdateMutation } from "@/store";

// Lib
import { copyText } from "@/lib";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import LinkRow from "./LinkRow";
import { fullUrl } from "./linkUrl";

/**
 * Linklərin siyahısı. Kopyalama və aktivlik burada idarə olunur; QR, hesabat
 * və silmə səhifənin modallarına toxunduğu üçün yuxarıdan ötürülür.
 */
export default function LinksTable({ items, onQr, onStats, onDelete }) {
  const [update] = useAdminUpdateMutation();
  const [copied, flashCopied] = useFlash(null);

  const copy = async (code) => {
    if (await copyText(fullUrl(code))) flashCopied(code);
    else notify.error("Kopyalana bilmədi");
  };

  const toggle = async (link) => {
    try {
      await update({
        resource: "short-links",
        id: link._id,
        data: { isActive: !link.isActive },
      }).unwrap();
    } catch (e) {
      notify.error(apiErrorMessage(e, "Dəyişdirilə bilmədi"));
    }
  };

  return (
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
              <LinkRow
                key={l._id}
                link={l}
                copied={copied === l.code}
                onCopy={copy}
                onQr={onQr}
                onStats={onStats}
                onToggle={toggle}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
