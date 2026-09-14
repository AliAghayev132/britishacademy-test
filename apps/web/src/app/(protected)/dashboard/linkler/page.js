"use client";

// React
import { useMemo, useState } from "react";

// Components
import { QueryState, QrStudio, Modal, confirmDialog, notify } from "@/components";

// Store
import { useAdminListQuery, useAdminDeleteMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import LinkCreateForm from "./_components/LinkCreateForm";
import LinkStats from "./_components/LinkStats";
import LinksTable from "./_components/LinksTable";
import { fullUrl } from "./_components/linkUrl";

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
export default function LinksPage() {
  const { data, isLoading, isError, error, refetch } = useAdminListQuery({
    resource: "short-links",
    limit: 200,
  });
  const [remove] = useAdminDeleteMutation();

  const [openLink, setOpenLink] = useState(null);
  const [qrLink, setQrLink] = useState(null);

  const items = useMemo(() => data?.data?.items || [], [data]);

  // Silmə səhifədə qalır: açıq hesabat modalı da bağlanmalıdır.
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
      if (openLink?._id === link._id) setOpenLink(null);
      notify.success("Silindi");
    } catch (e) {
      notify.error(apiErrorMessage(e, "Silinə bilmədi"));
    }
  };

  if (isLoading || isError) {
    return <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-5">
      {/* Yeni link */}
      <LinkCreateForm />

      {/* Siyahı */}
      <LinksTable items={items} onQr={setQrLink} onStats={setOpenLink} onDelete={runDelete} />

      {/* Hesabat modalda — əvvəl cədvəlin ALTINDA açılırdı: uzun siyahıda
          görünmürdü, aşağı sürüşdürüb axtarmaq lazım gəlirdi. */}
      <Modal
        isOpen={Boolean(openLink)}
        onClose={() => setOpenLink(null)}
        title={openLink ? openLink.title || `/r/${openLink.code}` : ""}
        size="2xl"
      >
        {openLink && <LinkStats id={openLink._id} />}
      </Modal>

      {qrLink && (
        <QrStudio
          value={fullUrl(qrLink.code)}
          name={qrLink.code}
          title={qrLink.title}
          onClose={() => setQrLink(null)}
        />
      )}
    </div>
  );
}
