import globals from "globals";

/**
 * no-undef QƏSDƏN aktivdir.
 *
 * O olmayanda iki dəfə eyni səhv istehsalata çıxdı: funksiya işlədilirdi,
 * amma importu fayla əlavə olunmamışdı (ROLE_RANK, sonra hasRole). ESM
 * modulu problemsiz yüklənir — ReferenceError yalnız funksiya ÇAĞIRILANDA
 * baş verir, ona görə nə lint, nə də «modul yüklənir» yoxlaması tutmurdu.
 * İstifadəçi isə 500 alırdı.
 */
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "uploads/**",
      ".env*",
    ],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Əl ilə saxlanılan siyahı natamam idi (URL, fetch, AbortSignal,
      // structuredClone yox idi) — no-undef aktivləşəndə yalan xəbərdarlıq
      // verərdi. globals paketi Node-un tam dəstini verir.
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
      "prefer-const": "warn",
      "no-var": "error",
      "no-undef": "error",
    },
  },
];
