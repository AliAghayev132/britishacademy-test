import { baseApi } from "./baseApi";

// Public read endpoints (client-side RTK Query). Server Components fetch via
// lib/api.js; these hooks are for interactive client widgets (search, filters).
export const publicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSite: builder.query({ query: () => "/site", providesTags: ["Site"] }),
    getHome: builder.query({ query: () => "/home" }),
    getCategoryTree: builder.query({ query: () => "/categories" }),

    getCourses: builder.query({
      query: (params = {}) => ({ url: "/courses", params }),
      providesTags: [{ type: "Course", id: "LIST" }],
    }),
    getCourse: builder.query({
      query: (slug) => `/courses/${slug}`,
      providesTags: (r, e, slug) => [{ type: "Course", id: slug }],
    }),

    getBranches: builder.query({ query: () => "/branches" }),
    getTeachers: builder.query({
      query: (params = {}) => ({ url: "/teachers", params }),
    }),
    getTeacher: builder.query({ query: (slug) => `/teachers/${slug}` }),

    getTestimonials: builder.query({
      query: (params = {}) => ({ url: "/testimonials", params }),
    }),
    getDestinations: builder.query({
      query: (params = {}) => ({ url: "/destinations", params }),
    }),
    getSchedule: builder.query({
      query: (params = {}) => ({ url: "/schedule", params }),
    }),
    getBlog: builder.query({
      query: (params = {}) => ({ url: "/blog", params }),
      providesTags: [{ type: "Blog", id: "LIST" }],
    }),
  }),
});

export const {
  useGetSiteQuery,
  useGetHomeQuery,
  useGetCategoryTreeQuery,
  useGetCoursesQuery,
  useGetCourseQuery,
  useGetBranchesQuery,
  useGetTeachersQuery,
  useGetTeacherQuery,
  useGetTestimonialsQuery,
  useGetDestinationsQuery,
  useGetScheduleQuery,
  useGetBlogQuery,
} = publicApi;
