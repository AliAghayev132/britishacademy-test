'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft } from 'lucide-react'

import { TiptapEditor } from '@/components/editor'
import { Button, Input, Textarea, Select, Card, PageLoader } from '@/components/ui'
import {
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
} from '@/store/api'
import { API_URL } from '@/lib/variables'
import { getImageUrl } from '@/utils/getImageUrl'
import { uploadWithProgress } from '@/utils/uploadWithProgress'
import { uploadDocumentForEditor } from '@/utils/uploadDocumentForEditor'

// The editor styles are shared with the public render page.
import '@/styles/editor-content.css'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

const emptyForm = { title: '', content: '', excerpt: '', status: 'draft', tags: '' }

const toFormState = (post) => ({
  title: post?.title || '',
  content: post?.content || '',
  excerpt: post?.excerpt || '',
  status: post?.status || 'draft',
  tags: Array.isArray(post?.tags) ? post.tags.join(', ') : '',
})

/**
 * Shared create/edit post form built around the Tiptap rich-text editor.
 * Pass `postId` to load an existing post (edit mode); omit it for create mode.
 *
 * In edit mode we wait for the post to load, then mount the inner form with the
 * loaded values as its initial state (via `key`) — this avoids syncing fetched
 * data into state with an effect.
 */
export default function PostEditorForm({ postId }) {
  const isEdit = Boolean(postId)
  const { data, isLoading } = useGetPostQuery(postId, { skip: !isEdit })

  if (isEdit && isLoading) {
    return <PageLoader message="Loading post..." />
  }

  const post = data?.data?.post

  return (
    <PostEditorFormInner
      key={postId || 'new'}
      postId={postId}
      initial={isEdit ? toFormState(post) : emptyForm}
    />
  )
}

function PostEditorFormInner({ postId, initial }) {
  const router = useRouter()
  const isEdit = Boolean(postId)

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation()
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation()

  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  const isSaving = isCreating || isUpdating

  const updateField = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }))

  /* ----------------------------- Uploads ----------------------------- */
  const onImageUpload = useCallback(async (file) => {
    const fd = new FormData()
    fd.append('image', file)
    const res = await uploadWithProgress(`${API_URL}/media/upload-image`, fd)
    if (!res?.success) throw new Error(res?.message || 'Image upload failed')
    return getImageUrl(res.data.url)
  }, [])

  const onVideoUpload = useCallback(async (file, onProgress) => {
    const fd = new FormData()
    fd.append('video', file)
    const res = await uploadWithProgress(
      `${API_URL}/media/upload-video`,
      fd,
      onProgress
    )
    if (!res?.success) throw new Error(res?.message || 'Video upload failed')
    return getImageUrl(res.data.url)
  }, [])

  const onFileUpload = useCallback(
    (file, customName, onProgress) =>
      uploadDocumentForEditor(file, customName, onProgress),
    []
  )

  /* ------------------------------ Save ------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const payload = {
      title: form.title.trim(),
      content: form.content,
      excerpt: form.excerpt.trim(),
      status: form.status,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    try {
      if (isEdit) {
        await updatePost({ id: postId, ...payload }).unwrap()
      } else {
        await createPost(payload).unwrap()
      }
      router.push('/dashboard/posts')
    } catch (err) {
      setError(err?.data?.message || 'Could not save the post.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/posts')}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Back to posts"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Post' : 'New Post'}
            </h1>
            <p className="text-sm text-gray-500">
              Rich content is authored with the Tiptap editor.
            </p>
          </div>
        </div>
        <Button
          type="submit"
          disabled={isSaving}
          leftIcon={<Save className="h-4 w-4" />}
        >
          {isSaving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </Button>
      </div>

      <Card className="space-y-4">
        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          required
        />
        <Input
          label="Excerpt"
          name="excerpt"
          value={form.excerpt}
          onChange={(e) => updateField('excerpt', e.target.value)}
          placeholder="Short summary (optional)"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            options={STATUS_OPTIONS}
            placeholder="Select status"
          />
          <Input
            label="Tags"
            name="tags"
            value={form.tags}
            onChange={(e) => updateField('tags', e.target.value)}
            placeholder="Comma separated (e.g. news, release)"
          />
        </div>
      </Card>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Content
        </label>
        <TiptapEditor
          content={form.content}
          onChange={(html) => updateField('content', html)}
          onImageUpload={onImageUpload}
          onVideoUpload={onVideoUpload}
          onFileUpload={onFileUpload}
          placeholder="Write your content here..."
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  )
}
