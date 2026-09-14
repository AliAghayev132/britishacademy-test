// Lib
import { ldJson } from "@/lib";

/**
 * Renders a JSON-LD structured-data <script> tag.
 *
 * This is a Server Component (no "use client") — the JSON is serialized on the
 * server and injected via dangerouslySetInnerHTML, which is the recommended way
 * to add structured data with the Next.js App Router.
 *
 * @param {{ data: object }} props - The structured-data object (schema.org).
 */
export const JsonLd = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      // Başlıqlar admin paneldən gəlir — `<` escape olunur (bax lib/jsonLd).
      dangerouslySetInnerHTML={{ __html: ldJson(data) }}
    />
  )
}

export default JsonLd
