import { baseApi } from './baseApi'

// Post endpoints — the example CRUD vertical slice. This is the copy-paste
// reference for building a new resource against the server API contract.
export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List published posts (public). Supports pagination + filter params.
    getPosts: builder.query({
      query: (params = {}) => ({
        url: '/posts',
        params,
      }),
      // Tag each item plus a LIST sentinel so mutations can invalidate cleanly.
      providesTags: (result) =>
        result?.data?.posts
          ? [
              ...result.data.posts.map((post) => ({ type: 'Post', id: post._id })),
              { type: 'Post', id: 'LIST' },
            ]
          : [{ type: 'Post', id: 'LIST' }],
    }),

    // Single post (increments views server-side).
    getPost: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),

    // Single post by slug (public render page; increments views server-side).
    getPostBySlug: builder.query({
      query: (slug) => `/posts/slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Post', id: `slug-${slug}` }],
    }),

    // Create (authenticated; author = current user).
    createPost: builder.mutation({
      query: (data) => ({
        url: '/posts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    // Update (authenticated + ownership check server-side).
    updatePost: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/posts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),

    // Delete (authenticated + ownership check; soft delete server-side).
    deletePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetPostsQuery,
  useGetPostQuery,
  useGetPostBySlugQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postApi
