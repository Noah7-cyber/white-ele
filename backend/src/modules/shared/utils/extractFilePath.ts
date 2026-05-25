export function extractFilePath(input: string): string {
  // Case 1: already a bucket-relative path
  if (!input.startsWith("http")) {
    return input;
  }

  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid URL");
  }

  // Case 2: Firebase download URL
  // /v0/b/<bucket>/o/<encodedPath>
  if (url.hostname === "firebasestorage.googleapis.com") {
    const match = url.pathname.match(/\/o\/(.+)$/);
    if (!match?.[1]) {
      throw new Error("Invalid Firebase Storage URL");
    }
    return decodeURIComponent(match[1]);
  }

  // Case 3: Google Cloud Storage public URL
  // /<bucket>/<path>
  if (url.hostname === "storage.googleapis.com") {
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length < 2) {
      throw new Error("Invalid GCS Storage URL");
    }

    // Remove bucket name, keep object path
    parts.shift();
    return parts.join("/");
  }

  throw new Error("Unsupported storage URL format");
}
