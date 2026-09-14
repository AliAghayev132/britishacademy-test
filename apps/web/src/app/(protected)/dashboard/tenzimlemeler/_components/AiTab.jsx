"use client";

// Components
import { Switch } from "@/components";

// Local
import { Section, input, label } from "./shared";

/** «AI (OpenRouter)» tabı. */
export function AiTab({ form, set }) {
  return (
    <Section title="AI köməkçi (OpenRouter)">
      <div className="sm:col-span-2 flex items-center gap-2">
        <Switch checked={form.ai.enabled} onChange={(v) => set("ai.enabled", v)} label="AI aktiv (modallardakı tərcümə / səliqə düymələri üçün)" />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>API açarı {form.ai.hasKey && <span className="text-emerald-600">(təyin olunub)</span>}</label>
        <input type="password" autoComplete="new-password" className={input} placeholder={form.ai.hasKey ? "•••••••• (dəyişmək üçün yaz)" : "sk-or-v1-..."} value={form.ai.apiKey} onChange={(e) => set("ai.apiKey", e.target.value)} />
        <p className="mt-1 text-xs text-gray-400">
          Açarı <span className="font-semibold">openrouter.ai/keys</span> ünvanından alın. Yalnız-yazma — boş buraxsanız köhnə açar saxlanılır.
        </p>
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Model</label>
        <input className={input} placeholder="openai/gpt-4o-mini" value={form.ai.model} onChange={(e) => set("ai.model", e.target.value)} />
        <p className="mt-1 text-xs text-gray-400">
          OpenRouter model id, məs. <span className="font-mono">openai/gpt-4o-mini</span>, <span className="font-mono">google/gemini-2.0-flash-001</span>, <span className="font-mono">anthropic/claude-3.5-haiku</span>.
        </p>
      </div>
      <div className="sm:col-span-2 rounded-lg bg-violet-50 p-3 text-xs text-violet-800">
        Aktivləşdirib yadda saxladıqdan sonra formalardakı çoxdilli sahələrdə
        <span className="font-semibold"> “AZ-dən tərcümə et” </span>
        və
        <span className="font-semibold"> “Səliqəyə sal” </span>
        düymələri işləyəcək.
      </div>
    </Section>
  );
}
