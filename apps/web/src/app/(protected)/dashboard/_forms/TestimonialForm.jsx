"use client";

// ── Testimonial form ──
// Bespoke create/edit form covering the whole Testimonial model. `type: 'video'`
// swaps in the video/poster uploaders; `type: 'text'` shows quote + rating.

import { useState } from "react";
import {
  Overlay,
  Field,
  TextInput,
  NumberInput,
  TextArea,
  NativeSelect,
  Toggle,
  SectionTitle,
  toId,
} from "./kit";
import { FileUpload } from "@/components/ui/FileUpload";
import { getImageUrl } from "@/utils/getImageUrl";
import {
  useAdminListQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
} from "@/store/api/adminApi";

const TYPE_OPTIONS = [
  { value: "text", label: "Mətn" },
  { value: "video", label: "Video" },
];

export function TestimonialForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  // Course / branch selects (optional relations).
  const { data: coursesData } = useAdminListQuery({ resource: "courses", limit: 100 });
  const { data: branchesData } = useAdminListQuery({ resource: "branches", limit: 100 });
  const courseOptions = (coursesData?.data?.items || []).map((c) => ({
    value: c._id,
    label: c.title || c.name || c.slug || c._id,
  }));
  const branchOptions = (branchesData?.data?.items || []).map((b) => ({
    value: b._id,
    label: b.name,
  }));

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();
  const saving = creating || updating;

  const [error, setError] = useState("");

  // ── Basic ──
  const [name, setName] = useState(item?.name || "");
  const [type, setType] = useState(item?.type || "text");
  const [achievement, setAchievement] = useState(item?.achievement || "");
  const [color, setColor] = useState(item?.color || "#2E6BE6");
  const [photo, setPhoto] = useState(item?.photo || "");

  const [course, setCourse] = useState(toId(item?.course));
  const [branch, setBranch] = useState(toId(item?.branch));

  // ── Text type ──
  const [quote, setQuote] = useState(item?.quote || "");
  const [rating, setRating] = useState(item?.rating ?? 5);

  // ── Video type ──
  const [videoUrl, setVideoUrl] = useState(item?.video?.url || "");
  const [videoPoster, setVideoPoster] = useState(item?.video?.poster || "");

  // ── Parameters ──
  const [isFeatured, setIsFeatured] = useState(Boolean(item?.isFeatured));
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(isEdit ? Boolean(item?.isActive) : true);

  const isVideo = type === "video";

  // ── Save ──
  const handleSave = async () => {
    setError("");

    const data = {
      name: name.trim(),
      type,
      achievement: achievement.trim(),
      color: color || "#2E6BE6",
      photo: photo.trim(),
      isFeatured,
      order: Number(order) || 0,
      isActive,
    };

    if (course) data.course = course;
    if (branch) data.branch = branch;

    if (isVideo) {
      if (videoUrl.trim()) {
        data.video = { url: videoUrl.trim(), poster: videoPoster.trim() };
      }
    } else {
      data.quote = quote.trim();
      data.rating = Number(rating) || 5;
    }

    try {
      if (isEdit) {
        await update({ resource: "testimonials", id: item._id, data }).unwrap();
      } else {
        await create({ resource: "testimonials", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  // ── Preview (testimonial card) ──
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const preview = (
    <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {isVideo ? (
        <div className="mb-3 aspect-video w-full overflow-hidden rounded-xl bg-black">
          {videoPoster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getImageUrl(videoPoster)}
              alt=""
              className="h-full w-full object-cover opacity-80"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/70">
              Video
            </div>
          )}
        </div>
      ) : (
        !isVideo &&
        rating > 0 && (
          <div className="mb-2 text-amber-500">{"★".repeat(Math.min(5, Number(rating) || 0))}</div>
        )
      )}
      {!isVideo && quote && (
        <p className="mb-4 text-sm italic text-gray-700">“{quote}”</p>
      )}
      <div className="flex items-center gap-3">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getImageUrl(photo)}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {initial}
          </span>
        )}
        <div>
          <p className="text-sm font-bold text-gray-900">{name || "Ad"}</p>
          {achievement && (
            <p className="text-xs text-gray-500">{achievement}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Overlay
      title={isEdit ? "Rəyi redaktə et" : "Yeni rəy"}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      error={error}
      preview={preview}
      wide
    >
      {/* ── Əsas ── */}
      <section className="space-y-4">
        <SectionTitle>Əsas</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ad" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Növ">
            <NativeSelect
              options={TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </Field>
          <Field label="Nailiyyət" info="Ad altında yazı, məs: IELTS · 7.5 bal">
            <TextInput
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              placeholder="IELTS Hazırlıq · 7.5 bal"
            />
          </Field>
          <Field label="Rəng" info="Şəkil olmayanda avatar rəngi">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
            />
          </Field>
          <Field label="Kurs" className="sm:col-span-1">
            <NativeSelect
              options={courseOptions}
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Seçilməyib"
            />
          </Field>
          <Field label="Filial" className="sm:col-span-1">
            <NativeSelect
              options={branchOptions}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Seçilməyib"
            />
          </Field>
        </div>
        <Field label="Şəkil (avatar)" info="Boş qalsa ad hərfi göstərilir">
          <FileUpload value={photo} onChange={setPhoto} kind="image" />
        </Field>
      </section>

      {/* ── Rəy / Video ── */}
      {isVideo ? (
        <section className="space-y-4">
          <SectionTitle>Video</SectionTitle>
          <Field label="Video">
            <FileUpload value={videoUrl} onChange={setVideoUrl} kind="video" />
          </Field>
          <Field label="Poster (ön şəkil)">
            <FileUpload value={videoPoster} onChange={setVideoPoster} kind="image" />
          </Field>
        </section>
      ) : (
        <section className="space-y-4">
          <SectionTitle>Rəy</SectionTitle>
          <Field label="Sitat (quote)">
            <TextArea
              rows={3}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            />
          </Field>
          <Field label="Reytinq" info="1–5 arası ulduz" className="w-32">
            <NumberInput
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </Field>
        </section>
      )}

      {/* ── Parametrlər ── */}
      <section className="space-y-4">
        <SectionTitle>Parametrlər</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Sıra">
            <NumberInput value={order} onChange={(e) => setOrder(e.target.value)} />
          </Field>
          <div className="flex items-end gap-6 pb-2">
            <Toggle checked={isFeatured} onChange={setIsFeatured} label="Seçilmiş" />
            <Toggle checked={isActive} onChange={setIsActive} label="Aktiv" />
          </div>
        </div>
      </section>
    </Overlay>
  );
}
