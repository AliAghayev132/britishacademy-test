"use client";

// ── Admin users ──
// Manage the academy's admin/editor accounts (list + create + edit + delete).
// The server hides passwords in the list response and blocks deleting yourself
// or the last remaining admin — those errors are surfaced via notify.error.

// React
import { useState } from "react";
// UI / kit
import { Overlay, Field, TextInput, NativeSelect } from "../_forms/kit";
import { notify, confirmDialog } from "@/components/ui/feedback";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
// Icons
import { Plus, Pencil, Trash2, Search } from "lucide-react";
// Data (RTK Query)
import {
  useAdminUsersQuery,
  useAdminCreateUserMutation,
  useAdminUpdateUserMutation,
  useAdminDeleteUserMutation,
} from "@/store/api/adminApi";

// ── Constants ──
const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
];
const STATUSES = [
  { value: "active", label: "Aktiv" },
  { value: "suspended", label: "Dayandırılıb" },
  { value: "pending", label: "Gözləmədə" },
];

const ROLE_BADGE = {
  admin: "bg-[#00157A] text-white",
  editor: "bg-gray-200 text-gray-700",
};
const STATUS_BADGE = {
  active: { label: "Aktiv", cls: "bg-emerald-100 text-emerald-700" },
  suspended: { label: "Dayandırılıb", cls: "bg-amber-100 text-amber-700" },
  pending: { label: "Gözləmədə", cls: "bg-gray-200 text-gray-600" },
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

// ── Create / edit modal ──
function UserForm({ user, onClose }) {
  const editing = !!user;
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "editor",
    status: user?.status || "active",
    password: "",
  });
  const [error, setError] = useState("");

  const [create, { isLoading: creating }] = useAdminCreateUserMutation();
  const [update, { isLoading: updating }] = useAdminUpdateUserMutation();
  const saving = creating || updating;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) return setError("Ad və soyad tələb olunur");
    if (!editing) {
      if (!form.email.trim()) return setError("E-poçt tələb olunur");
      if (!form.password || form.password.length < 8) return setError("Parol ən azı 8 simvol olmalıdır");
    }
    try {
      if (editing) {
        const data = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          role: form.role,
          status: form.status,
        };
        if (form.password) data.password = form.password;
        await update({ id: user._id, data }).unwrap();
      } else {
        await create({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          status: form.status,
          password: form.password,
        }).unwrap();
      }
      notify.success(editing ? "İstifadəçi yeniləndi" : "İstifadəçi yaradıldı");
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Yadda saxlanmadı");
    }
  };

  return (
    <Overlay
      title={editing ? "İstifadəçini redaktə et" : "Yeni istifadəçi"}
      onClose={onClose}
      onSave={save}
      saving={saving}
      error={error}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Ad" required>
          <TextInput value={form.firstName} onChange={set("firstName")} placeholder="Ad" />
        </Field>
        <Field label="Soyad" required>
          <TextInput value={form.lastName} onChange={set("lastName")} placeholder="Soyad" />
        </Field>
        <Field label="E-poçt" required className="sm:col-span-2">
          <TextInput type="email" value={form.email} onChange={set("email")} disabled={editing} placeholder="ornek@ba.az" />
        </Field>
        <Field label="Telefon">
          <TextInput value={form.phone} onChange={set("phone")} placeholder="+994 ..." />
        </Field>
        <Field label="Rol">
          <NativeSelect options={ROLES} value={form.role} onChange={set("role")} />
        </Field>
        <Field label="Status">
          <NativeSelect options={STATUSES} value={form.status} onChange={set("status")} />
        </Field>
        <Field
          label="Parol"
          required={!editing}
          info={editing ? "boş buraxsan dəyişmir" : "ən azı 8 simvol"}
        >
          <TextInput type="password" value={form.password} onChange={set("password")} placeholder="••••••••" autoComplete="new-password" />
        </Field>
      </div>
    </Overlay>
  );
}

// ── Page ──
export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | user object

  const { data, isLoading, isFetching } = useAdminUsersQuery({ page, search });
  const [del] = useAdminDeleteUserMutation();

  const items = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  const onSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const remove = async (user) => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Silinsin?",
      text: `<b>${user.firstName} ${user.lastName}</b> istifadəçisi həmişəlik silinəcək.`,
      confirmText: "Sil",
    });
    if (!ok) return;
    try {
      await del(user._id).unwrap();
      notify.success("İstifadəçi silindi");
    } catch (err) {
      notify.error(err?.data?.message || "Silinmədi");
    }
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">İstifadəçilər</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={onSearch}
              placeholder="Axtar…"
              className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setModal("create")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00157A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00105e]"
          >
            <Plus className="h-4 w-4" /> Yeni istifadəçi
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Yüklənir…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">İstifadəçi tapılmadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Ad Soyad</th>
                  <th className="px-4 py-3">E-poçt</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Son giriş</th>
                  <th className="px-4 py-3 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className={isFetching ? "opacity-60" : ""}>
                {items.map((u) => {
                  const st = STATUS_BADGE[u.status] || STATUS_BADGE.pending;
                  return (
                    <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${ROLE_BADGE[u.role] || ROLE_BADGE.editor}`}>
                          {u.role === "admin" ? "Admin" : "Editor"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-gray-500 md:table-cell">{fmt(u.lastLogin)}</td>
                      <td className="px-4 py-3">
                        <ActionsMenu
                          actions={[
                            { label: "Redaktə", icon: Pencil, onClick: () => setModal(u) },
                            { label: "Sil", icon: Trash2, tone: "danger", onClick: () => remove(u) },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-9 w-9 rounded-lg text-sm font-semibold ${n === pagination.page ? "bg-[#00157A] text-white" : "border border-gray-200 bg-white text-gray-600"}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {modal && <UserForm user={modal === "create" ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
