import { baseApi } from './baseApi'

// AI endpoints. The server exposes POST /api/ai/process which proxies an
// OpenRouter chat completion. When the server has no API key configured it
// responds 503 — callers (see hooks/useAI.js) degrade gracefully in that case.
export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Generic AI action dispatcher. Body: { action, ...payload }
    // Response envelope: { success, data: { result } } (503 when AI disabled).
    processAI: builder.mutation({
      query: (body) => ({
        url: '/ai/process',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const { useProcessAIMutation } = aiApi
