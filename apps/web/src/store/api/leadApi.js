import { baseApi } from "./baseApi";

// Lead capture — the "Müraciət et" modal and contact form.
export const leadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createLead: builder.mutation({
      query: (data) => ({ url: "/leads", method: "POST", body: data }),
    }),
  }),
});

export const { useCreateLeadMutation } = leadApi;
