// Icons
import { AlertCircle } from "lucide-react";

/** Kitabxana yoxdursa — quraşdırma göstərişi. */
export function InstallNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <p className="font-semibold">Kitabxana quraşdırılmayıb</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-3 font-mono text-xs">
cd apps/api
npm i whatsapp-web.js@^1.34.7 qrcode@^1.5.4
          </pre>
          <p className="mt-2">
            Quraşdırıldıqdan sonra API-ni yenidən başladın. Linux serverdə Chrome/Chromium
            da olmalıdır (yoxdursa <span className="font-mono">WHATSAPP_CHROME_PATH</span>).
          </p>
        </div>
      </div>
    </div>
  );
}
