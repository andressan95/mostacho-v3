export function normalizeQrToken(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("token");
    if (fromQuery) return fromQuery.trim();
    return url.pathname.split("/").filter(Boolean).at(-1)?.trim() ?? trimmed;
  } catch {
    return trimmed;
  }
}
