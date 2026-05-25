import * as crypto from "crypto";

export class CryptoService {
   private readonly ALGORITHM: string ;
   private readonly KEY: Buffer | null;

   constructor() {
    this.ALGORITHM = "aes-256-gcm" as const;
    this.KEY = process.env['PAYMENT_ENCRYPTION_KEY'] ? Buffer.from(process.env['PAYMENT_ENCRYPTION_KEY'], "hex") : null;
   }

  encrypt(value: string) {
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY!, iv) as crypto.CipherGCM;
    const encrypted = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);

    return {
      ciphertext: encrypted.toString("hex"),
      iv: iv.toString("hex"),
      tag: cipher.getAuthTag().toString("hex"),
    };
  }

  decrypt(ciphertext: string, iv: string, tag: string) {
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      this.KEY!,
      Buffer.from(iv, "hex")
    ) as crypto.DecipherGCM;

    decipher.setAuthTag(Buffer.from(tag, "hex"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "hex")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  }
}
