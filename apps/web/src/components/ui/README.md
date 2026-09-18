# components/ui/

Admin panelinin dizayn primitivləri. Biznes məntiqi saxlamır — görünüş və
prop-larla idarə olunan davranış.

## Native element yox, bu komponentlər

Brauzerin öz idarəetmələri (`<select>`, `<input type="checkbox|color|range|date|time">`,
`<details>`) hər brauzerdə fərqli görünür, dili əməliyyat sistemindən götürür və
admin formasında «dəyişiklik» işarəsi vermir. Yerinə:

| Native | Komponent | Qeyd |
|---|---|---|
| `<select>` | `Select` | axtarış (4+ variant), klaviatura ↑↓ Enter, `onChange(e)` müqaviləsi |
| `type="checkbox"` | `Checkbox` | `role="checkbox"`, `onChange(boolean)` |
| açar | `Switch` | `role="switch"`, `onChange(boolean)` (kit-də `Toggle` adı ilə) |
| `type="color"` | `ColorInput` | brend palitrası, HEX sahəsi, `onChange(e)` |
| `type="range"` | `Slider` | `role="slider"`, ←/→ Home/End, `onChange(e)` |
| `type="date"` | `DatePicker` / `DateRangePicker` | "YYYY-MM-DD", `onChange(string)` |
| `<details>` | `Collapsible` | `aria-expanded` |

`onChange(e)` müqaviləsi olanlar `e.target.value` verir — mövcud formalar
native elementdən keçəndə dəyişmir.

Formada işlənən idarəetmələr `useMarkDirty()` çağırır: Overlay bağlananda
«yadda saxlanmamış dəyişikliklər» xəbərdarlığı onlara da işləyir.

## İstifadə

```js
// Components
import { Select, Switch, ColorInput } from "@/components";
```

Barrel (`src/components/index.js`) avtomatik yaradılır — yeni fayldan sonra
`pnpm barrels`.
