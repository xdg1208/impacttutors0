import { describe, expect, it } from "vitest";
import { slugify, uniqueCourseSlug } from "./slugify";

describe("slugify", () => {
  it("lowercases and trims", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("strips characters that are invalid in Django slugs", () => {
    expect(slugify("Math & Science!")).toBe("math-science");
  });

  it("never leaves double dashes or leading/trailing dashes", () => {
    expect(slugify("A -- B__C?")).toBe("a-b-c");
    expect(slugify("--leading--and--trailing--")).toBe("leading-and-trailing");
  });

  it("handles empty/invalid input by returning an empty string", () => {
    expect(slugify("")).toBe("");
    expect(slugify("***")).toBe("");
  });
});

describe("uniqueCourseSlug", () => {
  it("appends a uniqueness suffix and stays within SlugField limits (50)", () => {
    const slug = uniqueCourseSlug("Advanced WAEC Mathematics & Further Maths");
    expect(slug.length).toBeLessThanOrEqual(50);
    expect(slug).toMatch(/-\d+$/);
  });

  it("falls back to a generic base for empty titles", () => {
    expect(uniqueCourseSlug("")).toMatch(/^course-\d+$/);
  });
});
