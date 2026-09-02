"use client";

// ── Developer tools ──
// Admin-only maintenance. Mock data yükləmə düyməsi SİLİNDİ — o, bütün
// məzmunu silib demo data ilə əvəz edirdi və istehsalatda təsadüfən
// basılması bərpası mümkün olmayan itkiyə səbəb olurdu. Seed yalnız
// CLI-dan (scripts/seed.js) işlədilə bilər.
// with one click (wipes existing content first). Handy for a fresh environment.

// React
import { useState } from "react";
// UI
import { confirmDialog, notify } from "@/components/ui/feedback";
import { TriangleAlert, Languages, Sparkles, BookOpen, Flag, GraduationCap, MapPin, Database, Route, ClipboardList, Menu as MenuIcon } from "lucide-react";
// Data
import {
  useAdminMigrateI18nMutation,
  useAdminAutoTranslateMutation,
  useAdminImportCoursesMutation,
  useImportFlagsMutation,
  useImportTeachersMutation,
  useImportBranchesMutation,
  useMigrateSlugsMutation,
  useImportMenuMutation,
  useImportQuizzesMutation,
  useAdminSeedMutation,
} from "@/store/api/adminApi";

export default function DeveloperPage() {
  const [migrate, { isLoading: migrating }] = useAdminMigrateI18nMutation();
  const [migrateReport, setMigrateReport] = useState(null);
  const [autoTranslate, { isLoading: translating }] = useAdminAutoTranslateMutation();
  const [translateReport, setTranslateReport] = useState(null);
  const [langs, setLangs] = useState(["en", "ru"]);
  const [importCourses, { isLoading: importing }] = useAdminImportCoursesMutation();
  const [importReport, setImportReport] = useState(null);
  const [importFlags, { isLoading: flagging }] = useImportFlagsMutation();
  const [flagReport, setFlagReport] = useState(null);
  const [importTeachers, { isLoading: teaching }] = useImportTeachersMutation();
  const [teacherReport, setTeacherReport] = useState(null);
  const [importBranches, { isLoading: branching }] = useImportBranchesMutation();
  const [branchReport, setBranchReport] = useState(null);
  const [importMenu, { isLoading: menuing }] = useImportMenuMutation();
  const [menuReport, setMenuReport] = useState(null);
  const [migrateSlugs, { isLoading: slugging }] = useMigrateSlugsMutation();
  const [slugReport, setSlugReport] = useState(null);
  const [importQuizzes, { isLoading: quizzing }] = useImportQuizzesMutation();
  const [quizReport, setQuizReport] = useState(null);
  const [seed, { isLoading: seeding }] = useAdminSeedMutation();
  const [seedConfirm, setSeedConfirm] = useState("");
  const [counts, setCounts] = useState(null);

  // Müştəri kurs məlumatlarını tətbiq et (dryRun=true → yalnız yoxlama).
  // Bayraqları flagcdn.com-dan endirib qalereyaya yazır və ölkə kartlarına
  // bağlayır. `overwrite` — şəkli olan ölkələri də yenilə.
  // Müəllim → filial → dərs təyinatları. Dərs saatı yazılmır.
  // Filial əlaqə məlumatları — yalnız filial sətirlərini yeniləyir.
  // Menyu quruluşu dəyişəndə tam seed işlətməmək üçün — yalnız header menyusu.
  const runImportMenu = async (dryRun) => {
    if (!dryRun) {
      const ok = await confirmDialog({
        title: "Başlıq menyusu yenidən qurulsun?",
        text: "Header menyusu <b>tamamilə silinib</b> yenidən yaradılacaq (Haqqımızda → Müəllimlər, Tələbələrimiz). Footer menyusu və qalan məzmun toxunulmur.",
        confirmText: "Yenidən qur",
      });
      if (!ok) return;
    }
    try {
      const res = await importMenu({ dryRun }).unwrap();
      setMenuReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(e?.data?.message || "Alınmadı");
    }
  };

  const runImportBranches = async (dryRun) => {
    if (!dryRun) {
      const ok = await confirmDialog({
        title: "Filial məlumatları tətbiq olunsun?",
        text: "Dörd filialın <b>ünvanı, telefonu, WhatsApp nömrəsi, xəritə linki və iş saatları</b> müştəri məlumatı ilə əvəz olunacaq. Başqa heç nəyə toxunulmur.",
        confirmText: "Tətbiq et",
      });
      if (!ok) return;
    }
    try {
      const res = await importBranches({ dryRun }).unwrap();
      setBranchReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(e?.data?.message || "İmport alınmadı");
    }
  };

  // Kurs sluglarını köhnə saytın ünvanlarına uyğunlaşdırır. Yalnız `slug`
  // sahəsi dəyişir — mətn, qiymət, şəkil və baxış sayğacı toxunulmur.
  const runMigrateSlugs = async (dryRun) => {
    if (!dryRun) {
      const ok = await confirmDialog({
        title: "Kurs slugları yenilənsin?",
        text: "Üç kursun ünvanı köhnə saytın (daha çox axtarılan) formasına keçir:<br><br><b>ingilis-dili-kursu → ingilis-dili-kurslari</b><br><b>ielts → ielts-kurslari</b><br><b>sat → sat-kurslari</b><br><br>Köhnə ünvanlar 301 ilə yenisinə yönləndirilir, ona görə mövcud linklər sınmır.",
        confirmText: "Yenilə",
      });
      if (!ok) return;
    }
    try {
      const res = await migrateSlugs({ dryRun }).unwrap();
      setSlugReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(e?.data?.message || "Miqrasiya alınmadı");
    }
  };

  // Səviyyə testlərini yükləyir. Mövcud test TOXUNULMUR — admin sualları
  // redaktə etmiş ola bilər; üzərinə yazmaq üçün ayrıca düymə var.
  const runImportQuizzes = async (overwrite) => {
    const ok = await confirmDialog({
      tone: overwrite ? "error" : undefined,
      title: overwrite ? "Testlər başlanğıc məzmunla əvəz olunsun?" : "Testlər yüklənsin?",
      text: overwrite
        ? "Mövcud testlərin <b>bütün sualları silinir</b> və başlanğıc dəsti ilə əvəz olunur. Admin paneldə etdiyin redaktələr itir."
        : "İngilis və Rus dili səviyyə testləri yaradılır. <b>Mövcud test toxunulmur.</b>",
      confirmText: overwrite ? "Bəli, əvəz et" : "Yüklə",
    });
    if (!ok) return;
    try {
      const res = await importQuizzes({ overwrite }).unwrap();
      setQuizReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(e?.data?.message || "İmport alınmadı");
    }
  };

  // TAM SIFIRLAMA — bütün məzmunu silib yenidən qurur.
  const runSeed = async () => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Bütün məzmun silinsin?",
      text: "Kurslar, müəllimlər, filiallar, dərs qrafiki, rəylər, ölkələr, menyu və səhifələr <b>TAMAMİLƏ SİLİNİR</b> və başlanğıc data ilə yenidən qurulur.<br><br>Müraciətlər (leads) və istifadəçi hesabları silinmir.<br><br><b>Bu əməliyyat geri qaytarıla bilməz.</b>",
      confirmText: "Bəli, sil və yenidən yüklə",
      cancelText: "İmtina",
    });
    if (!ok) return;
    try {
      const res = await seed().unwrap();
      setCounts(res?.data?.counts || null);
      setSeedConfirm("");
      notify.success(res?.message || "Yenidən yükləndi");
    } catch (e) {
      notify.error(e?.data?.message || "Alınmadı");
    }
  };

  const runImportTeachers = async (dryRun) => {
    if (!dryRun) {
      const ok = await confirmDialog({
        title: "Müəllim təyinatları tətbiq olunsun?",
        message:
          "Siyahıdakı müəllimlər bazaya yazılacaq: mövcud olanlar adına görə tapılıb yenilənəcək, olmayanlar yaradılacaq. Mövcud filial/dərs təyinatları əvəz olunur.",
        confirmText: "Tətbiq et",
      });
      if (!ok) return;
    }
    try {
      const res = await importTeachers({ dryRun }).unwrap();
      setTeacherReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(e?.data?.message || "İmport alınmadı");
    }
  };

  const runImportFlags = async (overwrite) => {
    const ok = await confirmDialog({
      title: overwrite ? "Bütün bayraqlar yenilənsin?" : "Bayraqlar endirilsin?",
      message: overwrite
        ? "Şəkli OLAN ölkələrin də bayrağı yenidən endirilib əvəz olunacaq."
        : "Şəkli olmayan ölkələrə flagcdn.com-dan bayraq endirilib «bayraqlar» qovluğuna yazılacaq.",
      confirmText: "Başlat",
    });
    if (!ok) return;
    try {
      const res = await importFlags({ overwrite }).unwrap();
      setFlagReport(res.data);
      notify.success(res.message || "Bayraqlar endirildi");
    } catch (e) {
      notify.error(e?.data?.message || "Bayraq importu alınmadı");
    }
  };

  const runImport = async (dryRun) => {
    if (!dryRun) {
      const ok = await confirmDialog({
        tone: "warning",
        title: "Kurs məlumatları tətbiq olunsun?",
        text: "MS Office, İngilis dili, Rus dili və IELTS kurslarının <b>təsviri, məzmunu, SEO mətnləri və qiymət matrisi</b> müştəri məlumatları ilə əvəzlənəcək.<br><br>Şəkil, sıra və dərs qrafikinə toxunulmur.",
        confirmText: "Bəli, tətbiq et",
        cancelText: "İmtina",
      });
      if (!ok) return;
    }
    try {
      const res = await importCourses({ dryRun }).unwrap();
      setImportReport(res?.data || null);
      notify.success(res?.message || "Tamamlandı");
    } catch (err) {
      notify.error(err?.data?.message || "Alınmadı");
    }
  };

  // Boş EN/RU sahələrini AI ilə doldur (mövcud tərcüməyə toxunmur).
  const runAutoTranslate = async () => {
    const shown = langs.map((l) => l.toUpperCase()).join(" və ");
    const ok = await confirmDialog({
      tone: "warning",
      title: "AI toplu tərcümə başlasın?",
      text: `Bazadakı <b>boş ${shown}</b> sahələri AZ mətnindən tərcümə ediləcək.<br><br>Mövcud tərcümələr <b>dəyişmir</b>. Əməliyyat bir neçə dəqiqə çəkə bilər.`,
      confirmText: "Bəli, başla",
      cancelText: "İmtina",
    });
    if (!ok) return;
    try {
      const res = await autoTranslate({ langs }).unwrap();
      setTranslateReport(res?.data?.report || null);
      notify.success(res?.message || "Tərcümə tamamlandı");
    } catch (err) {
      notify.error(err?.data?.message || "Tərcümə alınmadı");
    }
  };

  const runMigrateI18n = async () => {
    const ok = await confirmDialog({
      tone: "warning",
      title: "Çoxdilli miqrasiya işə salınsın?",
      text: "Mövcud məzmun (kurs, müəllim, filial, səhifə və s.) tək dildən <b>3-dilli { az, en, ru }</b> formasına çevrilir.<br><br>Data <b>itmir</b> — mövcud mətn AZ variantı olur, EN/RU boş qalır. Təhlükəsiz və təkrar-icra oluna bilər.",
      confirmText: "Bəli, miqrasiya et",
      cancelText: "İmtina",
    });
    if (!ok) return;
    try {
      const res = await migrate().unwrap();
      setMigrateReport(res?.data?.report || null);
      notify.success(res?.message || "Miqrasiya tamamlandı");
    } catch (err) {
      notify.error(err?.data?.message || "Xəta baş verdi");
    }
  };

  // ── Render ──
  return (
    <div>
      <p className="mb-6 text-sm text-gray-500">Yalnız admin üçün texniki alətlər.</p>

      {/* i18n miqrasiya */}
      <div className="mt-5 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <Languages className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Çoxdilli (3 dil) miqrasiya</h2>
            <p className="mt-1 text-sm text-gray-600">
              Köhnə tək-dilli məzmunu <b>{"{ az, en, ru }"}</b> formasına çevirir. Mövcud mətn AZ variantı
              olur, EN/RU sonradan admin paneldən doldurulur. Data itmir, təkrar-icra təhlükəsizdir.
            </p>

            <button
              onClick={runMigrateI18n}
              disabled={migrating}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Languages className="h-4 w-4" />
              {migrating ? "Miqrasiya olunur…" : "Çoxdilli formata keçir"}
            </button>

            {migrateReport && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Nəticə</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(migrateReport).map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                      <span className="font-bold text-gray-900">{v.changedDocs ?? 0}</span>{" "}
                      <span className="text-gray-500">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* AI toplu tərcümə */}
      <div className="mt-5 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-violet-50 text-violet-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">AI ilə toplu tərcümə</h2>
            <p className="mt-1 text-sm text-gray-600">
              Bazadakı <b>boş EN/RU</b> sahələrini AZ mətnindən avtomatik doldurur — kurslar,
              müəllimlər, filiallar, ölkələr, rəylər, FAQ, SEO və s. Artıq tərcümə olunmuş
              sahələrə <b>toxunmur</b>, ona görə təkrar işlədilə bilər.
            </p>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-violet-50 p-3 text-sm text-violet-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                Əvvəlcə <b>Tənzimləmələr → AI</b> bölməsində OpenRouter açarını təyin edin.
                Əməliyyat məzmun həcmindən asılı olaraq bir neçə dəqiqə çəkə bilər — səhifəni bağlamayın.
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Dillər:</span>
              {["en", "ru"].map((l) => (
                <button
                  key={l}
                  onClick={() =>
                    setLangs((prev) =>
                      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
                    )
                  }
                  className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                    langs.includes(l)
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={runAutoTranslate}
              disabled={translating || !langs.length}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {translating ? "Tərcümə olunur… (gözləyin)" : "Boş dilləri AI ilə doldur"}
            </button>

            {translateReport && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Nəticə</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(translateReport).map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                      <span className="font-bold text-gray-900">{v.changedFields ?? 0}</span>{" "}
                      <span className="text-gray-500">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Müştəri kurs məlumatları */}
      <div className="mt-5 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-sky-50 text-sky-700">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Kurs məlumatlarını tətbiq et</h2>
            <p className="mt-1 text-sm text-gray-600">
              Müştəridən gələn məlumatları (<b>MS Office, İngilis dili, Rus dili, IELTS</b>)
              mövcud kurslara yazır: <b>3 dildə</b> təsvir və məzmun, «Qısa məlumat» kartı,
              <b> SEO</b> mətnləri və <b>filial üzrə qiymət matrisi</b> (qrup/fərdi ×
              gündüz/axşam + qeyd).
            </p>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-sky-50 p-3 text-sm text-sky-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                Yalnız sadalanan sahələr yazılır — şəkil, sıra, aktivlik və dərs qrafikinə
                toxunulmur. Təkrar işlədilə bilər (idempotent). Əvvəlcə <b>«Yoxla»</b> ilə
                nəyin dəyişəcəyini görün.
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => runImport(true)}
                disabled={importing}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                <BookOpen className="h-4 w-4" /> Yoxla (quru rejim)
              </button>
              <button
                onClick={() => runImport(false)}
                disabled={importing}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
              >
                <BookOpen className="h-4 w-4" />
                {importing ? "Tətbiq olunur…" : "Tətbiq et"}
              </button>
            </div>

            {importReport && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Nəticə</div>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Kurs</th>
                        <th className="px-3 py-2">Vəziyyət</th>
                        <th className="px-3 py-2">Qiymət sətri</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importReport.report?.map((r) => (
                        <tr key={r.slug} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-mono text-gray-900">{r.slug}</td>
                          <td className="px-3 py-2 text-gray-600">{r.status}</td>
                          <td className="px-3 py-2 text-gray-600">{r.priceRows ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importReport.warnings?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-amber-700">
                    {importReport.warnings.map((w, i) => <li key={i}>⚠️ {w}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ölkə bayraqları */}
      <div className="mt-5 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <Flag className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Ölkə bayraqlarını endir</h2>
            <p className="mt-1 text-sm text-gray-600">
              «Xaricdə təhsil» ölkə kartlarının şəkli boş olduqda kart emoji bayrağa düşür —
              Windows isə bayraq emojilərini göstərmir, ona görə kartlar boş görünür.
              Bu əməliyyat bayraqları <b>flagcdn.com</b>-dan endirib serverə yazır,
              qalereyada <b>«bayraqlar»</b> qovluğuna qeyd edir və hər ölkənin şəklinə bağlayır.
            </p>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                Fayllar <b>lokala</b> endirilir — sayt kənar CDN-dən asılı qalmır.
                Adi rejim yalnız <b>şəkli olmayan</b> ölkələrə toxunur, təkrar işlədilə bilər.
                Ölkənin adı tanınmasa (ISO kodu tapılmasa) o ölkə ötürülür — şəkli əl ilə yükləyin.
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => runImportFlags(false)}
                disabled={flagging}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <Flag className="h-4 w-4" />
                {flagging ? "Endirilir…" : "Bayraqları endir"}
              </button>
              <button
                onClick={() => runImportFlags(true)}
                disabled={flagging}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                <Flag className="h-4 w-4" /> Hamısını yenilə
              </button>
            </div>

            {flagReport && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Nəticə — {flagReport.imported}/{flagReport.total} endirildi, {flagReport.skipped} ötürüldü
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Ölkə</th>
                        <th className="px-3 py-2">Vəziyyət</th>
                        <th className="px-3 py-2">Ölçü</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flagReport.report?.map((r, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-900">{r.country}</td>
                          <td className="px-3 py-2 text-gray-600">{r.status}</td>
                          <td className="px-3 py-2 text-gray-600">{r.kb ? `${r.kb} KB` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Müəllim təyinatları */}
      <div className="mt-5 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-violet-50 text-violet-700">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Müəllim təyinatlarını tətbiq et</h2>
            <p className="mt-1 text-sm text-gray-600">
              Müştəridən gələn siyahını yazır: <b>hansı müəllim, hansı filialda, hansı dərsi</b> keçir.
              Mövcud müəllim adına görə tapılır, olmayan yaradılır.
              <b> Dərs saatı yazılmır</b> — müəllim səhifəsi vaxt cədvəli saxlamır.
            </p>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-violet-50 p-3 text-sm text-violet-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                Təkrar işlədilə bilər (idempotent). Bazada uyğunluğu olmayan kurslar
                (məsələn <b>Cambridge English</b>, <b>Aptis</b>) ötürülür və nəticədə
                xəbərdarlıq kimi göstərilir. Əvvəlcə <b>«Yoxla»</b> ilə baxın.
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => runImportTeachers(true)}
                disabled={teaching}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                <GraduationCap className="h-4 w-4" /> Yoxla (quru rejim)
              </button>
              <button
                onClick={() => runImportTeachers(false)}
                disabled={teaching}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                <GraduationCap className="h-4 w-4" />
                {teaching ? "Tətbiq olunur…" : "Tətbiq et"}
              </button>
            </div>

            {teacherReport && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Nəticə — {teacherReport.created} yaradıldı, {teacherReport.updated} yeniləndi
                  {teacherReport.dryRun ? " (quru rejim)" : ""}
                </div>
                <div className="max-h-80 overflow-auto rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Müəllim</th>
                        <th className="px-3 py-2">Filial</th>
                        <th className="px-3 py-2">Dərslər</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherReport.report?.map((r, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-900">{r.name}</td>
                          <td className="px-3 py-2 text-gray-600">{r.branches}</td>
                          <td className="px-3 py-2 text-gray-600">{r.courses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {teacherReport.warnings?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-amber-700">
                    {teacherReport.warnings.map((w, i) => <li key={i}>⚠️ {w}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Səviyyə testləri */}
      <div className="mt-5 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-sky-50 text-sky-700">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Səviyyə testlərini yüklə</h2>
            <p className="mt-1 text-sm text-gray-600">
              İngilis dili (28 sual) və Rus dili (22 sual) testləri — CEFR şkalası ilə
              A1–C1 nəticəsi. Köhnə saytın ən çox girilən iki səhifəsi
              (<b>/english-test</b>, <b>/rus-dili-test</b>) bunlara yönləndirilir.
            </p>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-sky-50 p-3 text-sm text-sky-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                Mövcud test <b>toxunulmur</b> — sualları paneldən redaktə etmisənsə itmir.
                Başlanğıc məzmuna qayıtmaq üçün «Üzərinə yaz» işlədilir.
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => runImportQuizzes(false)}
                disabled={quizzing}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
              >
                <ClipboardList className="h-4 w-4" />
                {quizzing ? "Yüklənir…" : "Testləri yüklə"}
              </button>
              <button
                onClick={() => runImportQuizzes(true)}
                disabled={quizzing}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                Üzərinə yaz
              </button>
            </div>

            {quizReport && (
              <ul className="mt-6 space-y-1 text-sm">
                {quizReport.items.map((r) => (
                  <li key={r.slug} className="font-mono text-xs text-gray-600">
                    {r.slug} — {r.status} ({r.questions} sual)
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>


      {/* Kurs slug miqrasiyası */}
      <div className="mt-5 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-indigo-50 text-indigo-700">
            <Route className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Kurs sluglarını köhnə ünvanlara uyğunlaşdır</h2>
            <p className="mt-1 text-sm text-gray-600">
              Köhnə saytda bu üç səhifə ayda <b>1300+ giriş</b> alırdı və ünvanları cəm
              formada idi. Slug həmin formaya keçirilir ki, axtarış reytinqi yeni
              səhifəyə otursun.
            </p>

            <div className="mt-4 overflow-hidden rounded-lg border border-gray-100 text-sm">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-3 py-2 font-mono text-xs text-gray-500">ingilis-dili-kursu</td><td className="px-3 py-2 font-mono text-xs font-bold text-gray-900">→ ingilis-dili-kurslari</td></tr>
                  <tr><td className="px-3 py-2 font-mono text-xs text-gray-500">ielts</td><td className="px-3 py-2 font-mono text-xs font-bold text-gray-900">→ ielts-kurslari</td></tr>
                  <tr><td className="px-3 py-2 font-mono text-xs text-gray-500">sat</td><td className="px-3 py-2 font-mono text-xs font-bold text-gray-900">→ sat-kurslari</td></tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                Yalnız <b>slug</b> dəyişir. Köhnə ünvan 301 ilə yenisinə yönləndirilir,
                ona görə paylaşılmış linklər sınmır. Təkrar işlədilə bilər.
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => runMigrateSlugs(true)}
                disabled={slugging}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                <Route className="h-4 w-4" /> Yoxla (quru rejim)
              </button>
              <button
                onClick={() => runMigrateSlugs(false)}
                disabled={slugging}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                <Route className="h-4 w-4" />
                {slugging ? "Yenilənir…" : "Yenilə"}
              </button>
            </div>

            {slugReport && (
              <div className="mt-6 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Nəticə — {slugReport.renamed} slug {slugReport.dryRun ? "dəyişəcək (quru rejim)" : "yeniləndi"}
                </div>
                {slugReport.changes?.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {slugReport.changes.map((c) => (
                      <li key={c.from} className="font-mono text-xs text-emerald-700">✓ {c.from} → {c.to}</li>
                    ))}
                  </ul>
                )}
                {slugReport.skipped?.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {slugReport.skipped.map((c) => (
                      <li key={c.from} className="font-mono text-xs text-gray-400">— {c.from}: {c.reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>


        {/* Başlıq menyusu */}
        <div className="mt-5 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-indigo-50 text-indigo-700">
              <MenuIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900">Başlıq menyusunu yenidən qur</h2>
              <p className="mt-1 text-sm text-gray-600">
                Menyu quruluşu koda əlavə olunub, amma <b>bazada köhnə qalıb</b>.
                Bu düymə yalnız <b>header menyusunu</b> yenidən qurur —
                «Haqqımızda» altında Müəllimlər və Tələbələrimiz görünəcək.
              </p>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
                <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
                <span>
                  Kurslar, müəllimlər, müraciətlər və footer menyusu
                  <b> toxunulmur</b>. Tam seed işlətməyə ehtiyac yoxdur.
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => runImportMenu(true)}
                  disabled={menuing}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <MenuIcon className="h-4 w-4" /> Yoxla (quru rejim)
                </button>
                <button
                  onClick={() => runImportMenu(false)}
                  disabled={menuing}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  <MenuIcon className="h-4 w-4" />
                  {menuing ? "Qurulur…" : "Yenidən qur"}
                </button>
              </div>

              {menuReport && (
                <div className="mt-6">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Nəticə — {menuReport.before} → {menuReport.after} bənd
                    {menuReport.dryRun ? " (quru rejim)" : ""}
                  </div>
                  <div className="space-y-1 rounded-lg border border-gray-100 p-3">
                    {(menuReport.items || []).map((m, i) => (
                      <div key={i} className={`text-sm ${m.level ? "pl-6 text-gray-500" : "font-semibold text-gray-800"}`}>
                        {m.level ? "└ " : ""}{m.label} <span className="text-xs text-gray-400">{m.href}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Filial əlaqə məlumatları */}
      <div className="mt-5 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-teal-50 text-teal-700">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Filial məlumatlarını tətbiq et</h2>
            <p className="mt-1 text-sm text-gray-600">
              Dörd filialın <b>ünvanı, telefonu, WhatsApp nömrəsi, xəritə linki</b> və
              iş saatları müştəri məlumatı ilə yenilənir. Filial <b>adına görə</b> tapılır.
            </p>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-teal-50 p-3 text-sm text-teal-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                Yalnız sadalanan sahələr yazılır — kurslar, müəllimlər və qrafik
                toxunulmur. Təkrar işlədilə bilər. Əvvəlcə <b>«Yoxla»</b> ilə baxın.
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => runImportBranches(true)}
                disabled={branching}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                <MapPin className="h-4 w-4" /> Yoxla (quru rejim)
              </button>
              <button
                onClick={() => runImportBranches(false)}
                disabled={branching}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
              >
                <MapPin className="h-4 w-4" />
                {branching ? "Tətbiq olunur…" : "Tətbiq et"}
              </button>
            </div>

            {branchReport && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Nəticə — {branchReport.updated} yeniləndi, {branchReport.created} yaradıldı
                  {branchReport.dryRun ? " (quru rejim)" : ""}
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Filial</th>
                        <th className="px-3 py-2">Vəziyyət</th>
                        <th className="px-3 py-2">Telefon</th>
                        <th className="px-3 py-2">Xəritə</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchReport.report?.map((r, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-900">{r.name}</td>
                          <td className="px-3 py-2 text-gray-600">{r.status}</td>
                          <td className="px-3 py-2 text-gray-600">{r.phone}</td>
                          <td className="px-3 py-2 text-gray-600">{r.map}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {branchReport.warnings?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-amber-700">
                    {branchReport.warnings.map((w, i) => <li key={i}>⚠️ {w}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TAM SIFIRLAMA — ən altda, qırmızı çərçivə ilə */}
      <div className="mt-8 max-w-2xl rounded-xl border-2 border-red-200 bg-red-50/40 p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-red-100 text-red-700">
            <Database className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-red-900">Bütün datanı sil və yenidən yüklə</h2>
            <p className="mt-1 text-sm text-red-800">
              Kurslar, müəllimlər, filiallar, dərs qrafiki, rəylər, ölkələr, menyu və
              səhifələr <b>tamamilə silinir</b> və başlanğıc data ilə yenidən qurulur.
            </p>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-900">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                <b>Geri qaytarıla bilməz.</b> Müraciətlər və istifadəçi hesabları
                silinmir. Bu əməliyyatdan sonra müştəri məlumatlarını (filial,
                müəllim, kurs importları) yenidən tətbiq etmək lazımdır.
              </span>
            </div>

            {/* Yazılı təsdiq — təsadüfi klikin qarşısını alır */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-red-700">
                Təsdiq üçün «SIFIRLA» yazın
              </label>
              <input
                value={seedConfirm}
                onChange={(e) => setSeedConfirm(e.target.value)}
                placeholder="SIFIRLA"
                className="w-48 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
              />
            </div>

            <button
              onClick={runSeed}
              disabled={seeding || seedConfirm.trim().toUpperCase() !== "SIFIRLA"}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
            >
              <Database className="h-4 w-4" />
              {seeding ? "Yüklənir…" : "Sil və yenidən yüklə"}
            </button>

            {counts && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Yükləndi</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(counts).map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm">
                      <span className="font-bold text-gray-900">{v}</span>{" "}
                      <span className="text-gray-500">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
