/**
 * Saytın səs effektləri — Web Audio ilə brauzerdə SİNTEZ olunur.
 *
 * Fayl yoxdur: nə yükləmə, nə xarici asılılıq (saytın bütün asılılıqları
 * özümüzdədir). Hər səs bir neçə qısa, yumşaq tondan ibarətdir.
 *
 * ── MƏHDUDİYYƏT (brauzer siyasəti) ──
 * Brauzer istifadəçi saytla ilk dəfə TOXUNANA qədər (klik, düymə, toxunma)
 * səs çalmağa icazə vermir. Scroll bu sayılmır. Ona görə səs konteksti ilk
 * toxunuşda «açılır» (`unlockSfx`), ondan əvvəl `playSfx` səssizcə heç nə
 * etmir. Bunu yan keçmək mümkün deyil və lazım da deyil.
 *
 * İstifadəçi səsləri söndürə bilər — seçim localStorage-də qalır.
 */

const KEY = "ba-sfx";
const EVENT = "ba-sfx";

let ctx = null;
let master = null;
let unlocked = false;
let lastReveal = 0;

const hasWindow = () => typeof window !== "undefined";

/** Səslər açıqdırmı? Defolt — açıq. */
export function isSfxOn() {
  if (!hasWindow()) return true;
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSfxOn(on) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* gizli rejim və s. — seçim yadda qalmır, amma işləyir */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: on }));
}

/** useSyncExternalStore üçün abunə. */
export function subscribeSfx(cb) {
  if (!hasWindow()) return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);
  return ctx;
}

/** İstifadəçi toxunuşunda çağırılır — səs kontekstini açır. */
export function unlockSfx() {
  if (!hasWindow()) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume?.();
  unlocked = true;
}

/** Bir yumşaq ton: sürətli giriş, eksponensial sönmə. */
function tone(freq, { start = 0, dur = 0.18, type = "sine", gain = 0.1, to } = {}) {
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.03);
}

// Pentatonik pillə — ardıcıl çalınanda həmişə ahəngdar səslənir.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

const SOUNDS = {
  /** Modal açılır — yuxarı qalxan iki not. */
  open: () => {
    tone(523.25, { dur: 0.16, gain: 0.09 });
    tone(783.99, { start: 0.07, dur: 0.24, gain: 0.08 });
  },
  /** Modal bağlanır — aşağı sürüşən qısa ton. */
  close: () => tone(659.25, { dur: 0.14, gain: 0.07, to: 392 }),
  /** Müraciət göndərildi — kiçik arpejio. */
  success: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, { start: i * 0.08, dur: 0.32, gain: 0.08 })),
  /** Scroll zamanı yeni bölmə görünür — çox yüngül «tık». */
  reveal: (i = 0) => tone(PENTA[i % PENTA.length], { dur: 0.12, gain: 0.035, type: "triangle" }),
  /** Kiçik düymə toxunuşu. */
  tap: () => tone(880, { dur: 0.05, gain: 0.04, type: "triangle" }),
};

/** Səsi çal. Açılmamış kontekstdə, söndürülmüşdə və gizli tabda — heç nə. */
export function playSfx(name, arg) {
  if (!hasWindow() || !unlocked || !isSfxOn()) return;
  if (typeof document !== "undefined" && document.hidden) return;
  const c = ensureCtx();
  if (!c || c.state !== "running") return;
  // Scroll-da bir neçə bölmə eyni anda görünə bilər — «tıklar» üst-üstə
  // düşüb səs-küyə çevrilməsin.
  if (name === "reveal") {
    const now = performance.now();
    if (now - lastReveal < 180) return;
    lastReveal = now;
  }
  try {
    SOUNDS[name]?.(arg);
  } catch {
    /* səs heç vaxt saytı sındırmamalıdır */
  }
}
