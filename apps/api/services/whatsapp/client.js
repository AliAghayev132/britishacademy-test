// Local
import { CLIENT_ID, SESSION_DIR, WA_WEB_VERSION_URL } from "./constants.js";
import { findSystemChrome } from "./chrome.js";

/** Yeni whatsapp-web.js klienti (hələ initialize olunmamış). */
export function createClient(lib, pairPhone) {
  const puppeteer = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--js-flags=--max-old-space-size=256",
    ],
  };
  const chrome = findSystemChrome();
  if (chrome) puppeteer.executablePath = chrome;

  return new lib.Client({
    authStrategy: new lib.LocalAuth({ clientId: CLIENT_ID, dataPath: SESSION_DIR }),
    puppeteer,
    // Başqa yerdə WhatsApp Web açılsa sessiyanı geri al (yoxsa bizim klient düşür).
    takeoverOnConflict: true,
    takeoverTimeoutMs: 10_000,
    qrMaxRetries: 5,
    authTimeoutMs: 60_000,
    // Telefon nömrəsi verilibsə QR əvəzinə qoşulma kodu ilə pair et.
    ...(pairPhone ? { pairWithPhoneNumber: { phoneNumber: pairPhone, showNotification: true } } : {}),
    webVersionCache: WA_WEB_VERSION_URL
      ? { type: "remote", remotePath: WA_WEB_VERSION_URL }
      : { type: "none" },
  });
}

/** Klienti tam öldür — brauzer prosesini də SIGKILL et (orphan Chrome qalmasın). */
export async function killClient(client) {
  try { client.removeAllListeners(); } catch { /* ignore */ }
  try {
    const browser = client.pupBrowser || client?.pupPage?.browser?.();
    await client.destroy();
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
      try { browser.process()?.kill("SIGKILL"); } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}
