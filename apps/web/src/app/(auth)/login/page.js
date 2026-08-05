'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { Mail, Lock, GraduationCap, Users, Building2 } from 'lucide-react'

import { Button, Input } from '@/components/ui'
import { useLoginMutation } from '@/store/api'
import { setCredentials } from '@/store/slices/authSlice'

const HIGHLIGHTS = [
  { icon: GraduationCap, text: 'Kurslar, kateqoriyalar və dərs qrafiki' },
  { icon: Users, text: 'Müəllimlər və filiallar' },
  { icon: Building2, text: 'Müraciətlər, bloq və sayt tənzimləmələri' },
]

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
      dispatch(setCredentials(res.data))
      router.push(searchParams.get('from') || '/dashboard')
    } catch (err) {
      setError(err?.data?.message || 'Giriş alınmadı. Məlumatları yoxla.')
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ background: 'linear-gradient(150deg,#001478 0%,#14329E 55%,#B00E28 140%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,.18), transparent 70%)' }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/shield.png" alt="British Academy" className="h-8 w-8 object-contain" />
          </span>
          <span className="text-xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>British Academy</span>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            İdarəetmə paneli
          </h2>
          <p className="mt-3 max-w-sm text-white/80">
            Saytın bütün məzmununu buradan idarə et — kurslardan müraciətlərə qədər.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">© 2014–2026 British Academy</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#00157A]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/shield.png" alt="British Academy" className="h-6 w-6 object-contain" />
            </span>
            <span className="text-lg font-bold text-[#00157A]" style={{ fontFamily: "'Poppins', sans-serif" }}>British Academy</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Xoş gəldin 👋</h1>
          <p className="mt-1 text-sm text-gray-500">Admin panelə daxil ol</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="E-poçt"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@britishacademy.az"
              leftIcon={<Mail className="h-5 w-5" />}
              required
            />
            <Input
              label="Parol"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              leftIcon={<Lock className="h-5 w-5" />}
              required
            />

            {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Daxil olunur…' : 'Daxil ol'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Yalnız icazəli istifadəçilər üçün.
          </p>
        </div>
      </div>
    </div>
  )
}
