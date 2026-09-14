// Node
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const CHROME_MISSING_RE = /Could not find Chrome|Could not find (Chromium|browser)|Failed to launch the browser/i;

export const isChromeMissing = (message) => CHROME_MISSING_RE.test(String(message || ""));

/** Puppeteer-in öz Chrome-u yoxdursa sistem Chrome-unu tap. */
export function findSystemChrome() {
  if (process.env.WHATSAPP_CHROME_PATH) return process.env.WHATSAPP_CHROME_PATH;
  const platform = os.platform();
  const candidates =
    platform === "win32"
      ? [
          path.join(process.env.PROGRAMFILES || "", "Google/Chrome/Application/chrome.exe"),
          path.join(process.env["PROGRAMFILES(X86)"] || "", "Google/Chrome/Application/chrome.exe"),
          path.join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
        ]
      : platform === "darwin"
        ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
          ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Puppeteer-in xam «Could not find Chrome (ver. …)» mesajı səbəbi izah etmir —
 * istifadəçi admin paneldə yalnız bu sətri görür və nə edəcəyini bilmir.
 * Brauzer ümumiyyətlə tapılmadıqda mesajı həlli göstərən mətnlə əvəz edirik.
 */
export function explainChromeError(message) {
  if (!CHROME_MISSING_RE.test(message)) {
    return message;
  }
  return (
    "Serverdə Chrome tapılmadı — WhatsApp Web brauzer olmadan işləmir. " +
    "Həlli: sistemə Google Chrome quraşdırın (Debian/Ubuntu: " +
    "apt-get install -y google-chrome-stable), sonra serveri yenidən başladın. " +
    "Fərqli yerdədirsə WHATSAPP_CHROME_PATH dəyişənində tam yolu göstərin. " +
    "Orijinal xəta: " + message
  );
}
