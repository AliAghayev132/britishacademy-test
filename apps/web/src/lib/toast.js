'use client'

/**
 * Minimal toast helper backed by SweetAlert2 (already a project dependency).
 *
 * SweetAlert2 is imported lazily inside the browser only, so importing this
 * module never runs DOM code during SSR / the production build.
 */

let swalPromise

function getSwal() {
  if (!swalPromise) {
    swalPromise = import('sweetalert2').then((m) => m.default)
  }
  return swalPromise
}

async function fire(icon, title) {
  if (typeof window === 'undefined') return
  const Swal = await getSwal()
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    timer: 3000,
    showConfirmButton: false,
    timerProgressBar: true,
  })
}

export const toast = {
  success: (message) => fire('success', message),
  error: (message) => fire('error', message),
  info: (message) => fire('info', message),
  warning: (message) => fire('warning', message),
}

export default toast
