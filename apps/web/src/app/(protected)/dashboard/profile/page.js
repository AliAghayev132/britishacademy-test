"use client";

// ── Profil ──
//
// Hesabın öz məlumatları: ad, soyad, telefon. E-poçt və rol dəyişdirilmir —
// onları yalnız superadmin «İstifadəçilər» bölməsindən təyin edir.

// React
import { useState } from "react";
import { useDispatch } from "react-redux";
// UI / kit
import { Button, Input, Card, PageLoader } from "@/components/ui";
import { ErrorState } from "@/components/ui/QueryState";
import { notify } from "@/components/ui/feedback";
// Data (RTK Query)
import { useGetMeQuery, useUpdateProfileMutation } from "@/store/api";
import { updateUser } from "@/store/slices/authSlice";
// Local
import { ROLE_LABELS } from "@/lib/permissions";

export default function ProfilePage() {
  const { data, isLoading, isError, error, refetch } = useGetMeQuery();

  if (isLoading) return <PageLoader message="Profil yüklənir…" />;
  // Sorğu uğursuz olsa boş forma yerinə səbəb + yenidən cəhd göstər.
  if (isError) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  // CAVABIN FORMASI: { data: { user: {...} } } — yəni istifadəçi BİR PİLLƏ
  // dərindədir. Əvvəl `data.data` oxunurdu və o, `{ user }` obyekti idi:
  // bütün sahələr `undefined` çıxırdı və forma həmişə BOŞ açılırdı.
  const user = data?.data?.user;

  // `key` yüklənən istifadəçi dəyişəndə formanı yenidən qurur — beləcə
  // başlanğıc vəziyyət effektsiz alınır. Cavabda `id` var, `_id` yox.
  return <ProfileForm key={user?.id} user={user} />;
}

function ProfileForm({ user }) {
  const dispatch = useDispatch();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile(form).unwrap();
      // Yenilənmiş istifadəçi də `data.user` altındadır. Əvvəl `res.data`
      // göndərilirdi və auth vəziyyətinə `{ user: {...} }` obyekti yazılırdı —
      // yaddaşa da belə saxlanılırdı, yəni başlıqdakı ad və icazə yoxlaması
      // pozulurdu.
      dispatch(updateUser(res?.data?.user || {}));
      notify.success(res?.message || "Profil yeniləndi");
    } catch (err) {
      notify.error(err?.data?.message || "Yadda saxlanılmadı");
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Profil</h1>
        <p className="mt-0.5 text-sm text-gray-500">Hesab məlumatlarını buradan idarə et.</p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Ad" name="firstName" value={form.firstName} onChange={handleChange} required />
            <Input label="Soyad" name="lastName" value={form.lastName} onChange={handleChange} required />
          </div>

          <Input
            label="E-poçt"
            value={user?.email || ""}
            disabled
            helperText="E-poçt dəyişdirilmir."
          />

          <Input
            label="Telefon"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+994 50 000 00 00"
          />

          <Input
            label="Rol"
            value={ROLE_LABELS[user?.role] || user?.role || "—"}
            disabled
            helperText="Rolu yalnız super admin dəyişə bilər."
          />

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Yadda saxlanılır…" : "Yadda saxla"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
