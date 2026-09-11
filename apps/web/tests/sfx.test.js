import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";

/**
 * SƏS EFFEKTLƏRİ VƏ MODAL ANİMASİYASI.
 *
 * Səslər Web Audio ilə sintez olunur. Burada saxta AudioContext ilə
 * yoxlanılır ki: istifadəçi toxunmadan səs çalınmır (brauzer siyasəti),
 * söndürüləndə susur, scroll «tıkları» üst-üstə düşmür və server
 * mühitində heç nə sınmır.
 */

let osc; // yaradılan osilyatorlar = çalınan tonlar
let store;

const param = () => ({ value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
function FakeAudioContext() {
  this.state = "running";
  this.currentTime = 0;
  this.destination = {};
  this.createGain = () => ({ gain: param(), connect: (n) => n });
  this.createOscillator = () => {
    const o = { type: "sine", frequency: param(), connect: (n) => n, start() {}, stop() {} };
    osc.push(o);
    return o;
  };
  this.resume = () => Promise.resolve();
}

async function loadSfx() {
  vi.resetModules();
  return import("@/lib/sfx");
}

describe("server mühiti", () => {
  it("window yoxdursa heç nə sınmır", async () => {
    const sfx = await loadSfx();
    expect(() => sfx.playSfx("open")).not.toThrow();
    expect(() => sfx.unlockSfx()).not.toThrow();
    expect(sfx.isSfxOn()).toBe(true);
  });
});

describe("brauzerdə", () => {
  beforeEach(() => {
    osc = [];
    store = {};
    globalThis.window = {
      AudioContext: FakeAudioContext,
      localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } },
      dispatchEvent() {},
      addEventListener() {},
      removeEventListener() {},
    };
    globalThis.document = { hidden: false };
  });
  afterEach(() => {
    delete globalThis.window;
    delete globalThis.document;
  });

  it("istifadəçi toxunmadan səs çalınmır", async () => {
    const sfx = await loadSfx();
    sfx.playSfx("open");
    expect(osc.length).toBe(0);
    sfx.unlockSfx();
    sfx.playSfx("open");
    expect(osc.length).toBeGreaterThan(0);
  });

  it("söndürüləndə susur, seçim yadda qalır", async () => {
    const sfx = await loadSfx();
    sfx.unlockSfx();
    sfx.setSfxOn(false);
    expect(store["ba-sfx"]).toBe("off");
    expect(sfx.isSfxOn()).toBe(false);
    sfx.playSfx("success");
    expect(osc.length).toBe(0);
  });

  it("gizli tabda səs çalınmır", async () => {
    const sfx = await loadSfx();
    sfx.unlockSfx();
    globalThis.document.hidden = true;
    sfx.playSfx("open");
    expect(osc.length).toBe(0);
  });

  it("scroll «tıkları» üst-üstə düşmür", async () => {
    const sfx = await loadSfx();
    sfx.unlockSfx();
    sfx.playSfx("reveal", 0);
    sfx.playSfx("reveal", 1); // eyni anda — atılır
    expect(osc.length).toBe(1);
  });

  it("naməlum səs adı səhv vermir", async () => {
    const sfx = await loadSfx();
    sfx.unlockSfx();
    expect(() => sfx.playSfx("yoxdur")).not.toThrow();
  });
});

describe("müraciət modalı", () => {
  const src = fs.readFileSync("src/components/site/ApplyModal.jsx", "utf8");
  const css = fs.readFileSync("src/styles/globals.css", "utf8");

  it("bütün bağlanma yolları animasiyadan keçir", () => {
    // Birbaşa onClose ötürülsə həmin yol animasiyasız, səssiz bağlanar.
    expect(src).not.toMatch(/onClose=\{onClose\}/);
    expect(src).toMatch(/e\.key === "Escape" && requestClose\(\)/);
    expect(src).toMatch(/ModalHeader onClose=\{requestClose\}/);
    expect(src).toMatch(/SuccessCard onClose=\{requestClose\}/);
  });

  it("JS gözləməsi CSS bağlanış animasiyası ilə eynidir", () => {
    const ms = Number(src.match(/}, (\d+)\);\s*}, \[onClose\]\)/)[1]);
    const cssMs = Math.round(parseFloat(css.match(/\.ba-am-overlay\.is-closing \{ animation: ba-am-fade-out ([\d.]+)s/)[1]) * 1000);
    expect(ms).toBe(cssMs);
  });

  it("hərəkəti azaltmaq istəyənlər üçün animasiya söndürülür", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.ba-am-overlay/);
  });
});
