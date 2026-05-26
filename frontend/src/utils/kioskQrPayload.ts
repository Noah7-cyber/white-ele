export type KioskParentCredentials = {
  email: string;
  kioskPin: string;
};

const PIN_REGEX = /^\d{4}$/;

function toBase64Url(input: string): string {
  const encoded = encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  return btoa(encoded).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    const decoded = atob(padded);
    const percentEncoded = decoded
      .split("")
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("");
    return decodeURIComponent(percentEncoded);
  } catch {
    return null;
  }
}

export function encodeKioskParentCredentials(payload: KioskParentCredentials): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeKioskParentCredentials(token: string): KioskParentCredentials | null {
  const decoded = fromBase64Url(token);
  if (!decoded) return null;

  try {
    const parsed = JSON.parse(decoded) as Partial<KioskParentCredentials>;
    const email = String(parsed.email ?? "").trim();
    const kioskPin = String(parsed.kioskPin ?? "").trim();

    if (!email || !PIN_REGEX.test(kioskPin)) return null;
    return { email, kioskPin };
  } catch {
    return null;
  }
}
