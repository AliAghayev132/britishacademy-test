import { baseApi } from './baseApi'

// Auth endpoints — mirror the server API contract exactly (see SPEC).
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login → returns { user, tokens }
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Register — Step 1: validate + send OTP
    register: builder.mutation({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    // Verify OTP — Step 2: creates the user, returns { user, tokens }
    verifyOTP: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: data,
      }),
    }),

    // Resend OTP code
    resendOTP: builder.mutation({
      query: (data) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body: data,
      }),
    }),

    // Get the currently authenticated user
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // Logout (bumps tokenVersion server-side)
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    // Change password (authenticated)
    changePassword: builder.mutation({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: data,
      }),
    }),

    // Update profile (firstName / lastName / phone)
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Forgot password — Step 1: send OTP
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Forgot password — Step 2: verify OTP, receive reset token
    verifyResetOTP: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-reset-otp',
        method: 'POST',
        body: data,
      }),
    }),

    // Forgot password — Step 3: set the new password with the reset token
    resetPassword: builder.mutation({
      query: ({ newPassword, resetToken }) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: { newPassword, resetToken },
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOTPMutation,
  useResendOTPMutation,
  useGetMeQuery,
  useLogoutMutation,
  useChangePasswordMutation,
  useUpdateProfileMutation,
  useForgotPasswordMutation,
  useVerifyResetOTPMutation,
  useResetPasswordMutation,
} = authApi
