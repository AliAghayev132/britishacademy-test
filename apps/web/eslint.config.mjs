// Next.js 16 removed the `next lint` command in favor of running ESLint
// directly (`eslint .`). eslint-config-next 16 ships a native flat config
// array, so we spread it straight into our flat config — no FlatCompat needed.
import next from 'eslint-config-next/core-web-vitals'
import globals from 'globals'

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'],
  },
  ...next,
  {
    // `no-undef` eslint-config-next-də AKTİV DEYİL. Bu, real bir baqı
    // buraxdı: DashboardSidebar-da `canSee` import edilmədən işlədilmişdi —
    // nə lint, nə build xəbər verdi, admin paneli isə brauzerdə çökdü
    // («ReferenceError: canSee is not defined»). Bu qayda həmin sinfi tutur.
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, React: 'readonly' },
    },
    rules: {
      'no-undef': 'error',
    },
  },
  {
    // The Tiptap editor module is a self-contained, pre-audited vendor drop-in
    // kept byte-intact (imperative ProseMirror node views, XHR progress refs,
    // raw <img> for editor content). The newer react-hooks RC rules flag those
    // intentional patterns, so we relax them for this directory only.
    files: ['src/components/editor/**/*.{js,jsx}'],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
]

export default eslintConfig
