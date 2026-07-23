// Next.js 16 removed the `next lint` command in favor of running ESLint
// directly (`eslint .`). eslint-config-next 16 ships a native flat config
// array, so we spread it straight into our flat config — no FlatCompat needed.
import next from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'],
  },
  ...next,
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
