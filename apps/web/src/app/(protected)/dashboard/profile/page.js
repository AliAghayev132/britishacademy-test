'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'

import { Button, Input, Card, PageLoader } from '@/components/ui'
import { useGetMeQuery, useUpdateProfileMutation } from '@/store/api'
import { updateUser } from '@/store/slices/authSlice'

export default function ProfilePage() {
  const { data, isLoading } = useGetMeQuery()

  if (isLoading) return <PageLoader message="Loading profile..." />

  // `key` remounts the form when the loaded user changes, so the form's
  // initial state is derived from props without a syncing effect.
  return <ProfileForm key={data?.data?._id} user={data?.data} />
}

function ProfileForm({ user }) {
  const dispatch = useDispatch()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()

  // Lazy initial state from the loaded user (no effect needed).
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  })
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const res = await updateProfile(form).unwrap()
      // Keep the local auth slice in sync with the saved profile.
      dispatch(updateUser(res.data))
      setMessage('Profile updated successfully.')
    } catch (err) {
      setMessage(err?.data?.message || 'Could not update profile.')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">
          Manage your account information.
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
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
            value={user?.email || ''}
            disabled
            helperText="Email cannot be changed."
          />

          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1 555 000 0000"
          />

          {message && <p className="text-sm text-gray-600">{message}</p>}

          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
