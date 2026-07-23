'use client'

import PostEditorForm from '@/components/PostEditorForm'

// Create a new post with the Tiptap editor. Route protection is handled by
// middleware.js; this is a client page because the editor is browser-only.
export default function NewPostPage() {
  return <PostEditorForm />
}
