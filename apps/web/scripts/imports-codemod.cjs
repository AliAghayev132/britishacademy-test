// Import codemod: barrel yolları + şərhli qruplar (web və api).
//
//   pnpm barrels                                  web: barrel-ləri yenilə, importları qaydaya sal
//   pnpm barrels:check                            dəyişiklik lazımdırsa xəta ilə çıxır (testdə işlədilir)
//   node scripts/imports-codemod.cjs api --root=../api   api (monorepodan)
//   əlavə: --dry (nümunə göstər), --only=<substr> (yalnız uyğun fayllar)
//
// Yeni komponent/util/hook əlavə edəndə `pnpm barrels` işə sal — barrel-lər
// əl ilə yazılmır.
//
// Qaydalar:
//  - Qovluqdan KƏNARDAKI fayllar barrel-dən import edir (@/components, @/lib,
//    @/lib/server, @/hooks, @/utils, @/store; api-də #utils, #services, #data …).
//  - Eyni barrel ağacının İÇİNDƏKİ fayllar bir-birini əvvəlki kimi import edir —
//    barrel öz içinə import olunsa dövri asılılıq yaranır.
//  - İmport bloku şərhli qruplara bölünür; qrup adı kimi işlənən qısa şərhlər
//    silinib yenidən yazılır, izah şərhləri öz importunun üstündə qalır.
const fs = require("fs");
const path = require("path");
const norm = (p) => p.split(path.sep).join("/");
const WEB_ROOT = norm(path.resolve(__dirname, ".."));
// @babel/parser Next-in asılılığıdır — ayrıca paket quraşdırmırıq.
const parser = require(require.resolve("@babel/parser", {
  paths: [path.dirname(require.resolve("next/package.json", { paths: [WEB_ROOT] }))],
}));

const APP = process.argv[2];
const DRY = process.argv.includes("--dry");
const CHECK = process.argv.includes("--check");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7);
const rootArg = (process.argv.find((a) => a.startsWith("--root=")) || "").slice(7);
const ROOTS = {
  web: WEB_ROOT,
  api: norm(path.resolve(WEB_ROOT, rootArg || "../api")),
};
const ROOT = ROOTS[APP];
if (!ROOT) throw new Error("app: web | api");

const parse = (code, file) =>
  parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "importAttributes", "topLevelAwait"],
    attachComment: true,
    errorRecovery: false,
    sourceFilename: file,
  });

// ─────────────────────────────────────────────────────────────
// Fayl gəzintisi
// ─────────────────────────────────────────────────────────────
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "uploads", "coverage", ".git"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs)$/.test(e.name)) out.push(norm(p));
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// Modul həlli
// ─────────────────────────────────────────────────────────────
const EXTS = ["", ".js", ".jsx", ".mjs", "/index.js", "/index.jsx"];
function resolveFile(base) {
  for (const e of EXTS) {
    const p = base + e;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return norm(p);
  }
  return null;
}

let pkgImports = {};
if (APP === "api") pkgImports = JSON.parse(fs.readFileSync(`${ROOT}/package.json`, "utf8")).imports || {};

function resolveSource(fromFile, src) {
  if (src.startsWith(".")) return resolveFile(path.resolve(path.dirname(fromFile), src));
  if (APP === "web" && src.startsWith("@/")) return resolveFile(`${ROOT}/src/${src.slice(2)}`);
  if (APP === "api" && src.startsWith("#")) {
    if (pkgImports[src]) return resolveFile(path.resolve(ROOT, pkgImports[src]));
    return resolveFile(path.resolve(ROOT, src.slice(1)));
  }
  return null; // paket
}

// ─────────────────────────────────────────────────────────────
// Eksportların oxunması
// ─────────────────────────────────────────────────────────────
const exportCache = new Map();
function exportsOf(file) {
  if (exportCache.has(file)) return exportCache.get(file);
  const code = fs.readFileSync(file, "utf8");
  const ast = parse(code, file);
  const named = new Set();
  let hasDefault = false;
  const stars = [];
  for (const n of ast.program.body) {
    if (n.type === "ExportDefaultDeclaration") hasDefault = true;
    if (n.type === "ExportNamedDeclaration") {
      if (n.declaration) {
        const d = n.declaration;
        if (d.id) named.add(d.id.name);
        if (d.declarations) for (const v of d.declarations) collectPattern(v.id, named);
      }
      for (const s of n.specifiers || []) {
        const name = s.exported.name ?? s.exported.value;
        if (name === "default") hasDefault = true;
        else named.add(name);
      }
    }
    if (n.type === "ExportAllDeclaration") {
      if (n.exported) named.add(n.exported.name);
      else stars.push(n.source.value);
    }
  }
  for (const s of stars) {
    const f = resolveSource(file, s);
    if (f) for (const x of exportsOf(f).named) named.add(x);
  }
  const res = { named, hasDefault, code, ast };
  exportCache.set(file, res);
  return res;
}
/** Barrel faylında `name` hansı moduldan gəlir (export * / export {} from zənciri). */
function originOf(file, name, seen = new Set()) {
  if (seen.has(file)) return null;
  seen.add(file);
  const { ast } = exportsOf(file);
  for (const n of ast.program.body) {
    if (n.type === "ExportNamedDeclaration") {
      if (n.declaration && exportsOf(file).named.has(name) && !n.source) {
        const d = n.declaration;
        const names = new Set();
        if (d.id) names.add(d.id.name);
        if (d.declarations) for (const v of d.declarations) collectPattern(v.id, names);
        if (names.has(name)) return file;
      }
      for (const s of n.specifiers || []) {
        if ((s.exported.name ?? s.exported.value) !== name) continue;
        if (!n.source) return file;
        const f = resolveSource(file, n.source.value);
        return f ? (/\/index\.jsx?$/.test(f) ? originOf(f, s.local.name, seen) : f) : null;
      }
    }
    if (n.type === "ExportAllDeclaration" && !n.exported) {
      const f = resolveSource(file, n.source.value);
      if (f && exportsOf(f).named.has(name)) return /\/index\.jsx?$/.test(f) ? originOf(f, name, seen) : f;
    }
  }
  return null;
}

function collectPattern(p, set) {
  if (!p) return;
  if (p.type === "Identifier") set.add(p.name);
  else if (p.type === "ObjectPattern") for (const pr of p.properties) collectPattern(pr.value || pr.argument, set);
  else if (p.type === "ArrayPattern") for (const el of p.elements) collectPattern(el, set);
}

// ─────────────────────────────────────────────────────────────
// Barrel təsviri
// ─────────────────────────────────────────────────────────────
const SERVER_ONLY_RE = /^(fs|node:fs|path|node:path|next\/headers|server-only)$/;
function importsOf(file) {
  const { ast } = exportsOf(file);
  return ast.program.body
    .filter((n) => n.type === "ImportDeclaration" || (n.type === "ExportNamedDeclaration" && n.source) || n.type === "ExportAllDeclaration")
    .map((n) => n.source.value);
}
const serverCache = new Map();
function isServerOnly(file, seen = new Set()) {
  if (serverCache.has(file)) return serverCache.get(file);
  if (seen.has(file)) return false;
  seen.add(file);
  let res = false;
  for (const src of importsOf(file)) {
    if (SERVER_ONLY_RE.test(src)) { res = true; break; }
    const f = resolveSource(file, src);
    if (f && f.startsWith(`${ROOT}/src/`) && isServerOnly(f, seen)) { res = true; break; }
  }
  serverCache.set(file, res);
  return res;
}

/** Barrel-lər: ad, qovluq, daxil olan modullar. Hər modul yalnız bir barrel-ə düşür. */
function webBarrels() {
  const S = `${ROOT}/src`;
  const list = (dir, { recursive = true, skip = [] } = {}) =>
    walk(`${S}/${dir}`).filter((f) => (recursive || path.dirname(f) === `${S}/${dir}`) && !/\/index\.jsx?$/.test(f) && !skip.some((s) => f.includes(s)));
  // Komponentin daxili hissələri barrel-ə düşmür: `components/<sahə>/<qovluq>/`
  // (məs. site/header/, ui/qr-studio/) və `components/sidebar/` şəxsidir —
  // yalnız sahibi nisbi import edir. Belə qovluğun `index.js`-i isə açıqdır
  // (məs. site/cards/index.js kartları ixrac edir).
  const privateComponent = (f) => {
    const parts = path.relative(`${S}/components`, f).split(/[\\/]/);
    if (parts[0] === "sidebar") return true;
    return parts.length >= 3 && !/^index\.jsx?$/.test(parts[parts.length - 1]);
  };
  const comps = walk(`${S}/components`).filter((f) =>
    f !== `${S}/components/index.js` &&
    !["/components/editor/", "/components/server.js"].some((s) => f.includes(s)) &&
    !(/\/index\.jsx?$/.test(f) && path.relative(`${S}/components`, f).split(/[\\/]/).length < 3) &&
    !privateComponent(f));
  const libs = list("lib");
  const barrels = [
    { spec: "@/components/editor", dir: `${S}/components/editor`, file: `${S}/components/editor/index.js`, modules: [`${S}/components/editor/TiptapEditor.jsx`], keep: true },
    { spec: "@/components/server", dir: `${S}/components`, file: `${S}/components/server.js`, modules: comps.filter((f) => isServerOnly(f)) },
    { spec: "@/components", dir: `${S}/components`, file: `${S}/components/index.js`, modules: comps.filter((f) => !isServerOnly(f)) },
    { spec: "@/hooks", dir: `${S}/hooks`, file: `${S}/hooks/index.js`, modules: list("hooks") },
    { spec: "@/lib/server", dir: `${S}/lib`, file: `${S}/lib/server.js`, modules: libs.filter((f) => isServerOnly(f) && !f.endsWith("/lib/server.js")) },
    { spec: "@/lib", dir: `${S}/lib`, file: `${S}/lib/index.js`, modules: libs.filter((f) => !isServerOnly(f) && !f.endsWith("/lib/server.js")) },
    { spec: "@/utils", dir: `${S}/utils`, file: `${S}/utils/index.js`, modules: list("utils") },
    { spec: "@/store", dir: `${S}/store`, file: `${S}/store/index.js`, modules: list("store") },
  ];
  return barrels;
}

function apiBarrels() {
  const barrel = (spec, dir, rel) => {
    const file = resolveFile(path.resolve(ROOT, pkgImports[spec] || rel));
    return { spec, dir: `${ROOT}/${dir}`, file, existing: true };
  };
  return [
    barrel("#lib", "lib"),
    barrel("#config", "config"),
    barrel("#constants", "constants"),
    barrel("#models", "models"),
    barrel("#services", "services"),
    barrel("#controllers", "controllers"),
    barrel("#middlewares", "middlewares"),
    barrel("#routes", "routes"),
    barrel("#utils", "utils"),
    { spec: "#data", dir: `${ROOT}/data`, file: `${ROOT}/data/index.js`, modules: walk(`${ROOT}/data`).filter((f) => !f.endsWith("/data/index.js")), generate: true },
  ];
}

// Modul → { barrel, name xəritəsi (yerli ixrac adı → barrel adı), default adı }
function defaultName(file) {
  const b = path.basename(file).replace(/\.(jsx?|mjs)$/, "");
  const id = b.replace(/[^A-Za-z0-9_$]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));
  return /^[A-Za-z_$]/.test(id) ? id : `_${id}`;
}

const defaultAlias = new Map(); // modul → default ilə eyni olan adlı ixrac

function generateBarrel(b) {
  const entries = []; // { module, local, exported }
  const owner = new Map();
  const collisions = [];
  for (const mod of b.modules.slice().sort()) {
    const ex = exportsOf(mod);
    // api (Node ESM) uzantı tələb edir; web (bundler) uzantısız işləyir.
    const relPath = "./" + norm(path.relative(path.dirname(b.file), mod));
    const rel = APP === "api" ? relPath : relPath.replace(/\.(jsx?|mjs)$/, "").replace(/\/index$/, "");
    const add = (local, exported) => {
      if (owner.has(exported)) {
        collisions.push(`${exported}: ${norm(path.relative(ROOT, owner.get(exported)))} ↔ ${norm(path.relative(ROOT, mod))}`);
        return;
      }
      owner.set(exported, mod);
      entries.push({ module: mod, rel, local, exported });
    };
    for (const n of [...ex.named].sort()) add(n, n);
    if (ex.hasDefault) {
      const dn = defaultName(mod);
      // `export function X` + `export default X` — default eyni addır, ayrıca yazılmır.
      if (ex.named.has(dn)) defaultAlias.set(mod, dn);
      else add("default", dn);
    }
  }
  return { entries, collisions };
}

function barrelSource(b, entries, quote) {
  const q = (s) => `${quote}${s}${quote}`;
  const byRel = new Map();
  for (const e of entries) {
    if (!byRel.has(e.rel)) byRel.set(e.rel, []);
    byRel.get(e.rel).push(e.local === "default" ? `default as ${e.exported}` : e.exported);
  }
  const groups = new Map();
  for (const [rel, names] of byRel) {
    const g = rel.split("/").slice(1, -1).join("/") || ".";
    if (!groups.has(g)) groups.set(g, []);
    const line = `export { ${names.join(", ")} } from ${q(rel)};`;
    groups.get(g).push(line.length > 100 ? `export {\n${names.map((n) => `  ${n},`).join("\n")}\n} from ${q(rel)};` : line);
  }
  const label = (g) => (g === "." ? "" : g.split("/").map((s) => s[0].toUpperCase() + s.slice(1)).join(" / "));
  const head = `// ${b.spec} — avtomatik yaradılmış barrel (bax scratchpad codemod).\n// Qovluqdan KƏNARDAKI fayllar buradan import edir; qovluğun içindəkilər\n// bir-birini birbaşa import edir (dövri asılılıq olmasın).\n`;
  const body = [...groups.entries()]
    .map(([g, lines]) => (label(g) ? `// ${label(g)}\n` : "") + lines.join("\n"))
    .join("\n\n");
  return `${head}\n${body}\n`;
}

// ─────────────────────────────────────────────────────────────
// Import blokunun yenidən yazılması
// ─────────────────────────────────────────────────────────────
const LABEL_RE = /^[\p{L}\p{N}\s/&,+()·.\-–]{1,40}$/u;
function isLabelComment(c) {
  if (c.type !== "CommentLine") return false;
  const t = c.value.trim();
  if (/^=+\s*[\p{L}\s/&-]+\s*=+$/u.test(t)) return true; // // ==== EXTERNAL PACKAGES ====
  if (/^─+\s*[\p{L}\s/&-]+\s*─+$/u.test(t)) return false; // bölmə başlıqları (kod bölmələri)
  if (!LABEL_RE.test(t)) return false;
  if (/[.:]\s*\S/.test(t) || t.endsWith(".")) return false; // cümlədir
  return t.split(/\s+/).length <= 5;
}

const WEB_GROUPS = [
  ["React", (s) => /^react(-dom)?(\/|$)/.test(s)],
  ["Next", (s) => /^next(\/|$)/.test(s)],
  ["Icons", (s) => s === "lucide-react"],
  ["Styles", (s) => /\.css$/.test(s)],
  ["Libraries", (s) => !s.startsWith(".") && !s.startsWith("@/")],
  ["Components", (s) => s.startsWith("@/components")],
  ["Hooks", (s) => s.startsWith("@/hooks")],
  ["Store", (s) => s.startsWith("@/store")],
  ["Lib", (s) => s.startsWith("@/lib")],
  ["Utils", (s) => s.startsWith("@/utils")],
  ["Styles", () => false],
  ["Local", () => true],
];
const WEB_ORDER = ["React", "Next", "Libraries", "Icons", "Components", "Hooks", "Store", "Lib", "Utils", "Styles", "Local"];
const API_GROUPS = [
  ["Node", (s) => s.startsWith("node:")],
  ["Packages", (s) => !s.startsWith(".") && !s.startsWith("#")],
  ["Lib", (s) => s.startsWith("#lib")],
  ["Config", (s) => s.startsWith("#config")],
  ["Constants", (s) => s.startsWith("#constants")],
  ["Models", (s) => s.startsWith("#models")],
  ["Services", (s) => s.startsWith("#services")],
  ["Controllers", (s) => s.startsWith("#controllers")],
  ["Middlewares", (s) => s.startsWith("#middlewares")],
  ["Routes", (s) => s.startsWith("#routes")],
  ["Utils", (s) => s.startsWith("#utils")],
  ["Data", (s) => s.startsWith("#data")],
  ["Local", () => true],
];
const API_ORDER = API_GROUPS.map(([g]) => g);

function groupOf(src) {
  const groups = APP === "web" ? WEB_GROUPS : API_GROUPS;
  return groups.find(([, t]) => t(src))[0];
}

function renderImport(imp, quote, semi) {
  const q = `${quote}${imp.source}${quote}`;
  if (imp.raw) return imp.raw;
  const parts = [];
  if (imp.default) parts.push(imp.default);
  if (imp.namespace) parts.push(`* as ${imp.namespace}`);
  const named = imp.named.map((n) => (n.imported === n.local ? n.local : `${n.imported} as ${n.local}`));
  let line;
  if (!parts.length && !named.length) line = `import ${q}${semi}`;
  else {
    const namedStr = named.length ? `{ ${named.join(", ")} }` : "";
    line = `import ${[...parts, namedStr].filter(Boolean).join(", ")} from ${q}${semi}`;
    if (line.length > 100 && named.length) {
      line = `import ${parts.length ? parts.join(", ") + ", " : ""}{\n${named.map((n) => `  ${n},`).join("\n")}\n} from ${q}${semi}`;
    }
  }
  return line;
}

function transformFile(file, ctx) {
  const code = fs.readFileSync(file, "utf8");
  const crlf = code.includes("\r\n");
  const src = code.replace(/\r\n/g, "\n");
  let ast;
  try { ast = parse(src, file); } catch (e) { return { file, error: `parse: ${e.message}` }; }
  const body = ast.program.body;
  const imports = [];
  for (const n of body) {
    if (n.type === "ImportDeclaration") imports.push(n);
    else if (imports.length) break;
  }
  if (!imports.length) return null;
  // Blokdan sonra da import varsa (kod arasında) — toxunmuruq.
  const lastIdx = body.indexOf(imports[imports.length - 1]);
  if (body.slice(lastIdx + 1).some((n) => n.type === "ImportDeclaration")) return { file, skipped: "imports after code" };

  const quote = src.slice(imports[0].source.start, imports[0].source.start + 1);
  const semi = src.slice(imports[0].end - 1, imports[0].end) === ";" ? ";" : "";

  // Region başlanğıcı: birinci importun üstündəki label şərhləri də daxil.
  let regionStart = imports[0].start;
  const firstLead = imports[0].leadingComments || [];
  let keepHeaderUntil = firstLead.length;
  for (let i = firstLead.length - 1; i >= 0; i--) {
    if (isLabelComment(firstLead[i])) { regionStart = firstLead[i].start; keepHeaderUntil = i; } else break;
  }
  // Region sonu: son import (+ eyni sətirdəki şərh).
  let regionEnd = imports[imports.length - 1].end;
  const lastTrail = (imports[imports.length - 1].trailingComments || []).filter((c) => c.loc.start.line === imports[imports.length - 1].loc.end.line);
  if (lastTrail.length) regionEnd = lastTrail[lastTrail.length - 1].end;

  const items = [];
  imports.forEach((n, i) => {
    const lead = (n.leadingComments || []).filter((c) => c.start >= regionStart && !(i === 0 && firstLead.indexOf(c) < keepHeaderUntil));
    const notes = lead.filter((c) => !isLabelComment(c)).map((c) => src.slice(c.start, c.end));
    const trail = (n.trailingComments || []).filter((c) => c.loc.start.line === n.loc.end.line).map((c) => src.slice(c.start, c.end));
    const imp = {
      source: n.source.value,
      default: null,
      namespace: null,
      named: [],
      notes,
      trail,
      raw: null,
      kind: n.importKind,
      attributes: n.attributes?.length ? src.slice(n.source.end, n.end) : "",
    };
    for (const s of n.specifiers) {
      if (s.type === "ImportDefaultSpecifier") imp.default = s.local.name;
      else if (s.type === "ImportNamespaceSpecifier") imp.namespace = s.local.name;
      else imp.named.push({ imported: s.imported.name ?? s.imported.value, local: s.local.name });
    }
    if (imp.attributes) imp.raw = src.slice(n.start, n.end);
    items.push(imp);
  });

  // Barrel yönləndirməsi
  const changes = [];
  for (const imp of items) {
    if (imp.raw || imp.namespace) continue;
    let target = resolveSource(file, imp.source);
    if (!target) continue;
    // Köhnə alt barrel (məs. @/components/ui, @/store/api): hər adı əsl moduluna izlə.
    if (!ctx.moduleBarrel.get(target) && /\/index\.jsx?$/.test(target) && !imp.default) {
      const origins = imp.named.map((n) => originOf(target, n.imported));
      const mods = [...new Set(origins)];
      if (mods.length && mods.every(Boolean)) {
        const barrels = [...new Set(mods.map((m) => ctx.moduleBarrel.get(m)))];
        if (barrels.length === 1 && barrels[0] && !file.startsWith(barrels[0].dir + "/")) {
          const named = imp.named.map((n, i) => ({ imported: ctx.moduleExports.get(origins[i])?.get(n.imported), local: n.local }));
          if (named.every((n) => n.imported)) {
            changes.push(`${imp.source} → ${barrels[0].spec}`);
            imp.source = barrels[0].spec;
            imp.named = named;
          }
        }
      }
      continue;
    }
    const barrel = ctx.moduleBarrel.get(target);
    if (!barrel) continue;
    if (barrel.spec === imp.source) continue;
    // Barrel ağacının içindəki fayl — toxunmur.
    if (file.startsWith(barrel.dir + "/")) continue;
    const map = ctx.moduleExports.get(target);
    const named = [];
    let ok = true;
    if (imp.default) {
      const d = map.get("default");
      if (!d) { ok = false; } else named.push({ imported: d, local: imp.default });
    }
    for (const n of imp.named) {
      const e = map.get(n.imported);
      if (!e) { ok = false; break; }
      named.push({ imported: e, local: n.local });
    }
    if (!ok) { changes.push(`! ${imp.source}: barrel-də ad tapılmadı`); continue; }
    if (!imp.default && !imp.named.length) continue; // yan təsirli import
    changes.push(`${imp.source} → ${barrel.spec}`);
    imp.source = barrel.spec;
    imp.default = null;
    imp.named = named;
  }

  // Eyni mənbədən importları birləşdir (qeydsiz olanları)
  const merged = [];
  const bySource = new Map();
  for (const imp of items) {
    const key = imp.source;
    const prev = bySource.get(key);
    if (prev && !imp.raw && !prev.raw && !imp.namespace && !prev.namespace && !(imp.default && prev.default) && imp.kind === prev.kind) {
      if (imp.default) prev.default = imp.default;
      for (const n of imp.named) if (!prev.named.some((p) => p.local === n.local)) prev.named.push(n);
      prev.notes.push(...imp.notes);
      prev.trail.push(...imp.trail);
      continue;
    }
    bySource.set(key, imp);
    merged.push(imp);
  }

  // Qruplar
  const order = APP === "web" ? WEB_ORDER : API_ORDER;
  const groups = new Map(order.map((g) => [g, []]));
  for (const imp of merged) groups.get(groupOf(imp.source)).push(imp);
  const out = [];
  for (const g of order) {
    const list = groups.get(g);
    if (!list.length) continue;
    const lines = [`// ${g}`];
    for (const imp of list) {
      for (const note of imp.notes) lines.push(note);
      lines.push(renderImport(imp, quote, semi) + (imp.trail.length ? " " + imp.trail.join(" ") : ""));
    }
    out.push(lines.join("\n"));
  }
  const region = out.join("\n\n");
  const next = src.slice(0, regionStart) + region + src.slice(regionEnd);
  if (next === src) return null;
  return { file, next: crlf ? next.replace(/\n/g, "\r\n") : next, changes };
}

// ─────────────────────────────────────────────────────────────
// İcra
// ─────────────────────────────────────────────────────────────
const ctx = { moduleBarrel: new Map(), moduleExports: new Map() };
const barrels = APP === "web" ? webBarrels() : apiBarrels();
const barrelWrites = [];
let fatal = false;

for (const b of barrels) {
  if (b.existing) {
    // api: mövcud barrel-in eksportlarını modullara bağla
    const ex = exportsOf(b.file);
    const code = exportsOf(b.file).ast.program.body;
    for (const n of code) {
      if ((n.type === "ExportNamedDeclaration" || n.type === "ExportAllDeclaration") && n.source) {
        const mod = resolveSource(b.file, n.source.value);
        if (!mod) continue;
        if (!ctx.moduleBarrel.has(mod)) ctx.moduleBarrel.set(mod, b);
        const map = ctx.moduleExports.get(mod) || new Map();
        if (n.type === "ExportAllDeclaration" && !n.exported) {
          for (const x of exportsOf(mod).named) map.set(x, x);
        } else if (n.type === "ExportNamedDeclaration") {
          for (const s of n.specifiers) {
            if (s.type === "ExportNamespaceSpecifier") continue;
            map.set(s.local.name, s.exported.name);
          }
        }
        ctx.moduleExports.set(mod, map);
      }
    }
    void ex;
    continue;
  }
  if (b.keep) {
    for (const m of b.modules) {
      ctx.moduleBarrel.set(m, b);
      ctx.moduleExports.set(m, new Map([["default", "TiptapEditor"]]));
    }
    continue;
  }
  const { entries, collisions } = generateBarrel(b);
  if (collisions.length) {
    fatal = true;
    console.log(`\n✗ ${b.spec} ad toqquşmaları:\n  ${collisions.join("\n  ")}`);
  }
  for (const e of entries) {
    ctx.moduleBarrel.set(e.module, b);
    const map = ctx.moduleExports.get(e.module) || new Map();
    map.set(e.local, e.exported);
    ctx.moduleExports.set(e.module, map);
  }
  for (const m of b.modules) {
    if (!defaultAlias.has(m)) continue;
    const map = ctx.moduleExports.get(m) || new Map();
    map.set("default", defaultAlias.get(m));
    ctx.moduleExports.set(m, map);
  }
  // Barrel-də olmayan (toqquşan) modullar da barrel-ə aid sayılır, adı yoxdursa import toxunulmaz qalır
  for (const m of b.modules) if (!ctx.moduleBarrel.has(m)) ctx.moduleBarrel.set(m, b);
  barrelWrites.push({ b, entries });
  console.log(`barrel ${b.spec}: ${b.modules.length} modul, ${entries.length} ad`);
}
if (fatal && !process.argv.includes("--allow-collisions")) {
  console.log("\nToqquşmaları həll et və ya --allow-collisions ilə davam et.");
  process.exit(1);
}

const files = walk(APP === "web" ? `${ROOT}/src` : ROOT)
  .filter((f) => !(APP === "api" && /\/(tests|integration)\//.test(f)))
  .filter((f) => !f.includes("/components/editor/"))
  .filter((f) => !barrelWrites.some((w) => w.b.file === f))
  .filter((f) => !ONLY || f.includes(ONLY));

const results = [];
for (const f of files) {
  const r = transformFile(f, ctx);
  if (r) results.push(r);
}
const errors = results.filter((r) => r.error);
const skipped = results.filter((r) => r.skipped);
const edits = results.filter((r) => r.next);
console.log(`\nfayllar: ${files.length}, dəyişən: ${edits.length}, ötürülən: ${skipped.length}, xəta: ${errors.length}`);
for (const e of errors) console.log("  xəta", norm(path.relative(ROOT, e.file)), e.error);
for (const s of skipped) console.log("  ötürüldü", norm(path.relative(ROOT, s.file)), s.skipped);
const warn = edits.flatMap((e) => e.changes.filter((c) => c.startsWith("!")).map((c) => `${norm(path.relative(ROOT, e.file))}: ${c}`));
if (warn.length) console.log("\nxəbərdarlıq:\n  " + warn.join("\n  "));

if (CHECK) {
  const staleBarrels = barrelWrites.filter(({ b, entries }) => {
    const cur = fs.existsSync(b.file) ? fs.readFileSync(b.file, "utf8").replace(/\r\n/g, "\n") : "";
    return cur !== barrelSource(b, entries, '"');
  });
  for (const { b } of staleBarrels) console.log("  köhnə barrel:", norm(path.relative(ROOT, b.file)));
  for (const e of edits) console.log("  qaydaya salınmalı:", norm(path.relative(ROOT, e.file)));
  if (staleBarrels.length || edits.length || errors.length) {
    console.log("\n✗ `pnpm barrels` işə salın.");
    process.exit(1);
  }
  console.log("✓ barrel-lər və importlar qaydasındadır");
} else if (DRY) {
  const sample = edits.find((e) => ONLY ? true : e.changes.length) || edits[0];
  if (sample) {
    console.log(`\n── nümunə: ${norm(path.relative(ROOT, sample.file))}`);
    console.log(sample.next.replace(/\r\n/g, "\n").split("\n").slice(0, 45).join("\n"));
  }
  for (const { b, entries } of barrelWrites) {
    console.log(`\n── barrel ${b.spec} (ilk sətirlər)`);
    console.log(barrelSource(b, entries, '"').split("\n").slice(0, 14).join("\n"));
  }
} else {
  for (const { b, entries } of barrelWrites) {
    fs.writeFileSync(b.file, barrelSource(b, entries, '"'));
    console.log("✓ barrel", norm(path.relative(ROOT, b.file)));
  }
  for (const e of edits) fs.writeFileSync(e.file, e.next);
  console.log(`✓ ${edits.length} fayl yazıldı`);
}
