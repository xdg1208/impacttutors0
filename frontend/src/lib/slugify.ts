/**
 * Convert arbitrary text into a URL-safe slug (lowercase, single dashes,
 * no invalid characters, trimmed) — safe for Django's SlugField.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // Strip invalid characters, but KEEP underscores/s whitespace — they
    // are word separators and must collapse into dashes, not vanish
    // (previously "B__C" became "bc" instead of "b-c").
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_-]+/g, "-") // collapse whitespace/underscores to one dash
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .replace(/-{2,}/g, "-"); // never leave double dashes
}

/**
 * Build a unique, DB-safe slug for a course title.
 * Course.slug is a Django SlugField (max_length=50), so the base is capped
 * at 36 chars to leave room for the uniqueness suffix.
 */
export function uniqueCourseSlug(title: string): string {
  const base = slugify(title).slice(0, 36) || "course";
  return `${base}-${Date.now()}`;
}
