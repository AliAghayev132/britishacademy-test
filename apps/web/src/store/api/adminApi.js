import { baseApi } from "./baseApi";

/**
 * ADMIN endpoints (/api/admin/*) — every request is authenticated.
 *
 * ⚠️ Use these hooks ONLY inside src/app/(protected)/dashboard/**.
 * Public pages must use publicApi.js — importing an admin hook into a public
 * page would fire an authenticated request for anonymous visitors (401).
 *
 * Generic CRUD: one set of endpoints parameterised by `resource`, mirroring the
 * server's /api/admin/:resource registry (controllers/resourceRegistry.js).
 */
export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    adminList: builder.query({
      query: ({ resource, ...params }) => ({ url: `/admin/${resource}`, params }),
      providesTags: (r, e, { resource }) => [{ type: "Resource", id: resource }],
    }),
    adminGet: builder.query({
      query: ({ resource, id }) => `/admin/${resource}/${id}`,
      providesTags: (r, e, { resource, id }) => [{ type: "Resource", id: `${resource}-${id}` }],
    }),
    adminCreate: builder.mutation({
      query: ({ resource, data }) => ({ url: `/admin/${resource}`, method: "POST", body: data }),
      invalidatesTags: (r, e, { resource }) => [{ type: "Resource", id: resource }],
    }),
    adminUpdate: builder.mutation({
      query: ({ resource, id, data }) => ({ url: `/admin/${resource}/${id}`, method: "PUT", body: data }),
      invalidatesTags: (r, e, { resource, id }) => [
        { type: "Resource", id: resource },
        { type: "Resource", id: `${resource}-${id}` },
      ],
    }),
    adminDelete: builder.mutation({
      query: ({ resource, id }) => ({ url: `/admin/${resource}/${id}`, method: "DELETE" }),
      invalidatesTags: (r, e, { resource }) => [{ type: "Resource", id: resource }],
    }),
    adminLeadStatus: builder.mutation({
      query: ({ id, status, note }) => ({ url: `/admin/leads/${id}/status`, method: "PATCH", body: { status, note } }),
      // Also refresh the dashboard home (stats + latestLeads) after a status change.
      invalidatesTags: [{ type: "Resource", id: "leads" }, { type: "Resource", id: "stats" }],
    }),
    adminStats: builder.query({
      query: () => "/admin/stats",
      providesTags: [{ type: "Resource", id: "stats" }],
    }),

    // ── Course composer (wizard) ──
    // Select lists (branches / teachers / categories) for the wizard.
    adminLookups: builder.query({
      query: () => "/admin/lookups",
      providesTags: [{ type: "Resource", id: "lookups" }],
    }),
    // A course + its timetable reshaped into branch rows (pre-fills the edit form).
    adminCourseFull: builder.query({
      query: (id) => `/admin/courses/full/${id}`,
      providesTags: (r, e, id) => [{ type: "Resource", id: `courses-${id}` }],
    }),
    // Create a course together with pricing + CourseGroups in one call.
    adminCreateCourseFull: builder.mutation({
      query: (data) => ({ url: "/admin/courses/full", method: "POST", body: data }),
      invalidatesTags: [
        { type: "Resource", id: "courses" },
        { type: "Resource", id: "course-groups" },
        { type: "Resource", id: "teachers" },
      ],
    }),
    adminUpdateCourseFull: builder.mutation({
      query: ({ id, data }) => ({ url: `/admin/courses/full/${id}`, method: "PUT", body: data }),
      invalidatesTags: (r, e, { id }) => [
        { type: "Resource", id: "courses" },
        { type: "Resource", id: `courses-${id}` },
        { type: "Resource", id: "course-groups" },
        { type: "Resource", id: "teachers" },
      ],
    }),

    // ── Developer: reseed demo content (WIPES + reloads) ──
    adminSeed: builder.mutation({
      query: () => ({ url: "/admin/dev/seed", method: "POST" }),
      // Seed replaces everything — drop all cached admin/site data.
      invalidatesTags: ["Resource", "Site"],
    }),

    // ── Developer: köhnə məzmunu 3-dilli { az,en,ru } formasına miqrasiya et ──
    adminMigrateI18n: builder.mutation({
      query: () => ({ url: "/admin/dev/migrate-i18n", method: "POST" }),
      invalidatesTags: ["Resource", "Site"],
    }),

    // ── SMTP test məktubu göndər ──
    adminTestMail: builder.mutation({
      query: (to) => ({ url: "/admin/dev/test-mail", method: "POST", body: { to } }),
    }),

    // ── AI köməkçi (OpenRouter): tərcümə / səliqə / slug / SEO ──
    // Body: { action, content?|fields?, sourceLang?, targetLang?, isHtml? }
    // Cavab: { data: { result } } (string | object | array).
    aiProcess: builder.mutation({
      query: (body) => ({ url: "/ai/process", method: "POST", body }),
    }),

    // ── Admin users (multiple admins/editors) ──
    adminUsers: builder.query({
      query: (params) => ({ url: "/admin/users", params }),
      providesTags: [{ type: "Resource", id: "users" }],
    }),
    adminCreateUser: builder.mutation({
      query: (data) => ({ url: "/admin/users", method: "POST", body: data }),
      invalidatesTags: [{ type: "Resource", id: "users" }, { type: "Resource", id: "logs" }],
    }),
    adminUpdateUser: builder.mutation({
      query: ({ id, data }) => ({ url: `/admin/users/${id}`, method: "PUT", body: data }),
      invalidatesTags: [{ type: "Resource", id: "users" }, { type: "Resource", id: "logs" }],
    }),
    adminDeleteUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Resource", id: "users" }, { type: "Resource", id: "logs" }],
    }),

    // ── Audit log (read-only) ──
    adminLogs: builder.query({
      query: (params) => ({ url: "/admin/logs", params }),
      providesTags: [{ type: "Resource", id: "logs" }],
    }),
    adminGetSettings: builder.query({
      query: () => "/admin/settings",
      providesTags: [{ type: "Site", id: "settings" }],
    }),
    adminUpdateSettings: builder.mutation({
      query: (data) => ({ url: "/admin/settings", method: "PUT", body: data }),
      invalidatesTags: [{ type: "Site", id: "settings" }, "Site"],
    }),
  }),
});

export const {
  useAdminListQuery,
  useAdminGetQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
  useAdminDeleteMutation,
  useAdminLeadStatusMutation,
  useAdminStatsQuery,
  useAdminGetSettingsQuery,
  useAdminUpdateSettingsMutation,
  useAdminLookupsQuery,
  useAdminCourseFullQuery,
  useAdminCreateCourseFullMutation,
  useAdminUpdateCourseFullMutation,
  useAdminSeedMutation,
  useAdminMigrateI18nMutation,
  useAdminTestMailMutation,
  useAiProcessMutation,
  useAdminUsersQuery,
  useAdminCreateUserMutation,
  useAdminUpdateUserMutation,
  useAdminDeleteUserMutation,
  useAdminLogsQuery,
} = adminApi;
