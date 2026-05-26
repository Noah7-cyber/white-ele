export function normalizeReturnUrl(rawValue: string | null | undefined): string | null {
  if (!rawValue) return null;
  try {
    const decoded = decodeURIComponent(rawValue);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function buildReturnUrlQuery(returnUrl: string | null | undefined): string {
  const normalized = normalizeReturnUrl(returnUrl);
  return normalized ? `?returnUrl=${encodeURIComponent(normalized)}` : "";
}
