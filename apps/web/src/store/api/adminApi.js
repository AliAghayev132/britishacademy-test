import { baseApi } from "./baseApi";

// Generic admin CRUD — one set of endpoints parameterised by `resource`
// (mirrors the server's /api/admin/:resource registry).
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
      invalidatesTags: [{ type: "Resource", id: "leads" }],
    }),
    adminStats: builder.query({
      query: () => "/admin/stats",
      providesTags: [{ type: "Resource", id: "stats" }],
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
} = adminApi;
