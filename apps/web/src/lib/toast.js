'use client'

/**
 * Toast helper — now backed by the custom brand feedback system
 * (components/ui/feedback.jsx), not SweetAlert. Kept as a thin re-export so
 * existing `import toast from "@/lib/toast"` call-sites keep working.
 */
import { notify } from '@/components/ui/feedback'

export const toast = {
  success: (message) => notify.success(message),
  error: (message) => notify.error(message),
  info: (message) => notify.info(message),
  warning: (message) => notify.warning(message),
}

export default toast
