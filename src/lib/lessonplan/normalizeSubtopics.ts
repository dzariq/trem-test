export function normalizeSubtopics(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }
  if (typeof input === "string") {
    const value = input.trim();
    return value ? [value] : [];
  }
  return [];
}
