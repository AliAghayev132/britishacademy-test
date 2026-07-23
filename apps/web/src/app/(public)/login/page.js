'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { Mail, Lock } from 'lucide-react'

import { Button, Input, Card, Checkbox } from '@/components/ui'
import { useLoginMutation } from '@/store/api'
import { setCredentials } from '@/store/slices/authSlice'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const [form, setForm] = useState({ email: '', password: '', rememberMe: false })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const res = await login(form).unwrap()
      // The server envelope is { success, message, data: { user, tokens } }.
      // setCredentials persists to localStorage AND mirrors the token to a
      // cookie so the middleware can guard the dashboard.
      dispatch(setCredentials(res.data))
      const from = searchParams.get('from') || '/dashboard'
      router.push(from)
    } catch (err) {
      setError(err?.data?.message || 'Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex items-center justify-between">
            <Checkbox
              label="Remember me"
              name="rememberMe"
              checked={form.rememberMe}
              onChange={handleChange}
            />
            <Link
              href="/register"
              className="text-sm font-medium text-cyan-600 hover:text-cyan-700"
            >
              Create account
            </Link>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
