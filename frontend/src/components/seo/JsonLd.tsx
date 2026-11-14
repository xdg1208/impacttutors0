/**
 * Renders structured data (schema.org JSON-LD) for search engines.
 *
 * SECURITY: JSON.stringify alone does NOT make content safe inside a
 * <script> tag — a value containing "</script>" would break out and allow
 * injection. Escape the HTML-unsafe characters before embedding.
 */
export default function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
