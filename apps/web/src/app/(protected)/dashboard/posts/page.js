'use client'

import Link from 'next/link'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { format } from 'date-fns'

import { Button, Table, Badge, Card, PageLoader } from '@/components/ui'
import { useGetPostsQuery, useDeletePostMutation } from '@/store/api'

const STATUS_VARIANTS = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
}

export default function PostsPage() {
  const { data, isLoading, isError } = useGetPostsQuery()
  const [deletePost] = useDeletePostMutation()

  const posts = data?.data?.posts || []

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return
    try {
      await deletePost(id).unwrap()
    } catch {
      // Surface real error handling in your app (e.g. a toast).
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <p className="text-sm text-gray-500">
            Rich posts authored with the Tiptap editor.
          </p>
        </div>
        <Link href="/dashboard/posts/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Post</Button>
        </Link>
      </div>

      <Card padding="none">
        {isLoading ? (
          <PageLoader message="Loading posts..." />
        ) : isError ? (
          <p className="p-6 text-sm text-red-500">Failed to load posts.</p>
        ) : posts.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No posts yet. Create your first one.
          </p>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row hoverable={false}>
                <Table.Head>Title</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Created</Table.Head>
                <Table.Head align="right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {posts.map((post) => (
                <Table.Row key={post._id}>
                  <Table.Cell className="font-medium">{post.title}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={STATUS_VARIANTS[post.status] || 'default'}>
                      {post.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {post.createdAt
                      ? format(new Date(post.createdAt), 'dd MMM yyyy')
                      : '—'}
                  </Table.Cell>
                  <Table.Cell align="right">
                    <div className="flex items-center justify-end gap-2">
                      {post.slug && (
                        <Link
                          href={`/posts/${post.slug}`}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                          aria-label="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      )}
                      <Link
                        href={`/dashboard/posts/${post._id}/edit`}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>
    </div>
  )
}
