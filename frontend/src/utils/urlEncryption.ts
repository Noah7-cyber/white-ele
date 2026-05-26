/**
 * Simple encryption/decryption utility for URL parameters
 * Uses base64 encoding with XOR cipher for obfuscation
 * Note: This is client-side obfuscation, not true cryptographic security
 */

// Encryption key - in production, this should come from an environment variable
const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_URL_ENCRYPTION_KEY || "white-penguin-secret-key-2024";

/**
 * Encrypts a string value for use in URL parameters
 * @param value - The string to encrypt
 * @returns Encrypted and base64-encoded string safe for URLs
 */
export function encryptUrlParam(value: string): string {
  if (!value) return "";

  try {
    // XOR cipher encryption
    let encrypted = "";
    for (let i = 0; i < value.length; i++) {
      const keyChar = ENCRYPTION_KEY[i % ENCRYPTION_KEY.length];
      const encryptedChar = String.fromCharCode(value.charCodeAt(i) ^ keyChar.charCodeAt(0));
      encrypted += encryptedChar;
    }

    // Base64 encode for URL safety
    const base64 = btoa(encrypted);

    // Make it URL-safe by replacing characters that need encoding
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  } catch (error) {
    console.error("Encryption error:", error);
    return value; // Fallback to original value on error
  }
}

/**
 * Decrypts a string value from URL parameters
 * @param encryptedValue - The encrypted and base64-encoded string from URL
 * @returns Decrypted string
 */
export function decryptUrlParam(encryptedValue: string): string {
  if (!encryptedValue) return "";

  try {
    // Restore base64 padding and URL-safe characters
    let base64 = encryptedValue.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    while (base64.length % 4) {
      base64 += "=";
    }

    // Base64 decode
    const encrypted = atob(base64);

    // XOR cipher decryption
    let decrypted = "";
    for (let i = 0; i < encrypted.length; i++) {
      const keyChar = ENCRYPTION_KEY[i % ENCRYPTION_KEY.length];
      const decryptedChar = String.fromCharCode(encrypted.charCodeAt(i) ^ keyChar.charCodeAt(0));
      decrypted += decryptedChar;
    }

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return ""; // Return empty string on error
  }
}
