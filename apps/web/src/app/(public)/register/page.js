'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { Mail, Lock, User } from 'lucide-react'

import { Button, Input, Card } from '@/components/ui'
import {
  useRegisterMutation,
  useVerifyOTPMutation,
  useResendOTPMutation,
} from '@/store/api'
import { setCredentials } from '@/store/slices/authSlice'

export default function RegisterPage() {
  const router = useRouter()
  const dispatch = useDispatch()

  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation()
  const [resendOTP] = useResendOTPMutation()

  // Two-step flow: 'form' collects details + sends OTP, 'otp' verifies it.
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Step 1 — validate + send OTP to the email.
  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await register(form).unwrap()
      setStep('otp')
    } catch (err) {
      setError(err?.data?.message || 'Registration failed. Please try again.')
    }
  }

  // Step 2 — verify OTP; the server creates the user and returns tokens.
  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await verifyOTP({ email: form.email, code }).unwrap()
      dispatch(setCredentials(res.data))
      router.push('/dashboard')
    } catch (err) {
      setError(err?.data?.message || 'Invalid or expired code.')
    }
  }

  const handleResend = async () => {
    setError('')
    try {
      await resendOTP({ email: form.email, type: 'register' }).unwrap()
    } catch (err) {
      setError(err?.data?.message || 'Could not resend the code.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'form' ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === 'form'
              ? 'Get started in less than a minute'
              : `We sent a code to ${form.email}`}
          </p>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                leftIcon={<User className="h-5 w-5" />}
                required
              />
              <Input
                label="Last name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              leftIcon={<Mail className="h-5 w-5" />}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              leftIcon={<Lock className="h-5 w-5" />}
              required
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" fullWidth disabled={isRegistering}>
              {isRegistering ? 'Sending code...' : 'Continue'}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-cyan-600 hover:text-cyan-700"
              >
                Sign in
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="Verification code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the 6-digit code"
              required
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" fullWidth disabled={isVerifying}>
              {isVerifying ? 'Verifying...' : 'Verify & continue'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="font-medium text-gray-500 hover:text-gray-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="font-medium text-cyan-600 hover:text-cyan-700"
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
