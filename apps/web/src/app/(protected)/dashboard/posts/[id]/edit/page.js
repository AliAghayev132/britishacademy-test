'use client'

import { useParams } from 'next/navigation'

import PostEditorForm from '@/components/PostEditorForm'

// Edit an existing post. The [id] segment is read on the client via useParams
// so the whole page can stay inside the editor's client boundary.
export default function EditPostPage() {
  const { id } = useParams()
  return <PostEditorForm postId={id} />
}
