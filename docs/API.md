# API — marşrut arayışı

İki tam ayrı səth var. **Qarışdırma:**

| | Prefiks | Auth | Kim istifadə edir |
|---|---------|------|-------------------|
| **PUBLIC** | `/api/*` | ❌ yoxdur | Sayt (`apps/web` SSR + `publicApi.js`) |
| **ADMIN** | `/api/admin/*` | ✅ JWT + rol (`admin` \| `editor`) | Yalnız `/dashboard` (`adminApi.js`) |

`app.js`-də **admin router public-dən əvvəl** mount olunur — bu, gələcəkdə heç bir
public yolun admin yolunu kölgələməməsinə zəmanət verir. `adminRoutes.js`-də guard
router səviyyəsindədir, ona görə həmin fayla əlavə olunan **hər yeni endpoint
avtomatik qorunur** (fail-closed).

Cavab formatı hər yerdə eynidir: `{ success, message?, data?, errors? }`.

---

## PUBLIC — `/api/*` (auth yoxdur)

Hamısı read-only; yeganə yazma endpoint-i `POST /api/leads`-dir (rate-limited).

### Sayt qabığı
| Metod | Yol | Qaytarır |
|-------|-----|----------|
| GET | `/api/site` | Tənzimləmələr + header/footer menyusu (layout bir çağırışda) |
| GET | `/api/menu?location=header` | Menyu ağacı |
| GET | `/api/home` | Ana səhifə paketi: settings, featured kurslar, rəylər, tərəfdaşlar, üstünlüklər, ölkələr, FAQ |

### Kurslar
| Metod | Yol | Qaytarır |
|-------|-----|----------|
| GET | `/api/categories` | Kateqoriya ağacı (mega-menyu) |
| GET | `/api/courses?category=<slug>` | Kurs siyahısı |
| GET | `/api/courses/:slug` | Kurs + `teachersByBranch` (qrafikdən törədilir) + əlaqəli kurslar |

### Digər məzmun
| Metod | Yol |
|-------|-----|
| GET | `/api/branches` · `/api/branches/:slug` |
| GET | `/api/teachers?branch=<slug>` · `/api/teachers/:slug` (+ dərs qrafiki) |
| GET | `/api/testimonials?type=video\|text` |
| GET | `/api/destinations?scholarship=true` · `/api/destinations/:slug` |
| GET | `/api/schedule?course=<slug>&branch=<slug>` |
| GET | `/api/blog?page=&limit=&category=` · `/api/blog/:slug` |
| GET | `/api/pages/:slug` · `/api/partners` · `/api/faqs` |

### SEO
| Metod | Yol | Qaytarır |
|-------|-----|----------|
| GET | `/api/seo/robots` | Admindən redaktə olunan robots.txt mətni |
| GET | `/api/seo/urls` | sitemap.xml üçün URL siyahısı |

### Müraciət
| Metod | Yol | Qeyd |
|-------|-----|------|
| POST | `/api/leads` | `{ name*, phone*, email, course, branch, interest, message, source, pageUrl }` — rate-limited |

---

## ADMIN — `/api/admin/*` (JWT + `admin`/`editor` rolu)

### Xüsusi endpoint-lər (generic-dən ƏVVƏL qeyd olunub)
| Metod | Yol | Təyinat |
|-------|-----|---------|
| GET | `/api/admin/stats` | Dashboard: resurs sayğacları + son müraciətlər |
| GET | `/api/admin/settings` | `SiteSetting` singleton-u |
| PUT | `/api/admin/settings` | Qismən yeniləmə |
| PATCH | `/api/admin/leads/:id/status` | Müraciətin statusunu dəyişir |

### Generic CRUD — `/api/admin/:resource`
| Metod | Yol | Təyinat |
|-------|-----|---------|
| GET | `/:resource?page=&limit=&search=` | Siyahı (deaktivlər də daxil) |
| GET | `/:resource/:id` | Tək element |
| POST | `/:resource` | Yaratma |
| PUT | `/:resource/:id` | Yeniləmə (`save()` → pre-hook-lar işləyir) |
| DELETE | `/:resource/:id` | Soft delete (`menu-items` hard delete) |
| PATCH | `/:resource/reorder` | `{ ids: [...] }` → `order` sahəsi |

**`:resource` dəyərləri** (`controllers/resourceRegistry.js`):
`branches` · `teachers` · `course-categories` · `courses` · `course-groups` ·
`testimonials` · `destinations` · `blog-categories` · `blog-posts` · `menu-items` ·
`leads` · `pages` · `partners` · `advantages` · `faqs` · `media`

> `SiteSetting` qəsdən registry-də **yoxdur** — tək sənədli singleton olduğu üçün
> yuxarıdakı `/admin/settings` endpoint-ləri ilə idarə olunur.

---

## Şablondan qalan marşrutlar

`/api/auth/*` (istifadə olunur — admin girişi), `/api/media/*`, `/api/ai/*`,
`/api/posts/*`. Sonuncu şablonun nümunə CRUD-udur; British Academy bloqu
`BlogPost` modelindədir, ona görə `/api/posts` **istifadə olunmur**.

---

## Next.js tərəfi

| Qat | Fayl | Nə üçün |
|-----|------|---------|
| SSR (Server Component) | `src/lib/api.js` — `apiGet` / `apiGetStatus` | Public data, ISR 60 san |
| Klient (public) | `src/store/api/publicApi.js` | İnteraktiv widget-lər |
| Klient (admin) | `src/store/api/adminApi.js` | **Yalnız** `(protected)/dashboard/**` |

`isMissing()` (lib/api.js) yalnız API 404 deyəndə `notFound()` verir; şəbəkə
xətasında atır → 5xx (real səhifələr müvəqqəti nasazlıqda indeksdən çıxmasın).

SSR bütün trafiki tək IP-dən göndərdiyi üçün `INTERNAL_API_KEY` başlığı ilə
API-nin per-IP rate limitini keçir — hər iki `.env`-də eyni olmalıdır.
