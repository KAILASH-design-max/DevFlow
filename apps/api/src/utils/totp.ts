import crypto from "crypto";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Generates a cryptographically secure Base32 secret string for RFC 6238 TOTP.
 */
export function generateBase32Secret(length = 32): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += BASE32_CHARS[bytes[i] % 32];
  }
  return result;
}

/**
 * Decodes a Base32 string into a raw binary buffer.
 */
export function base32Decode(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_CHARS.indexOf(cleaned[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Computes a standard 6-digit TOTP code for a given timestamp according to RFC 6238.
 */
export function generateTotpCode(secret: string, time = Date.now(), step = 30): string {
  const key = base32Decode(secret);
  const counter = Math.floor(time / 1000 / step);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP code against a secret with a drift window of ±1 step (±30s).
 */
export function verifyTotpCode(secret: string, token: string, window = 1, step = 30): boolean {
  if (!token || !/^\d{6}$/.test(token.trim())) return false;
  const now = Date.now();
  const cleaned = token.trim();

  for (let error = -window; error <= window; error++) {
    const checkTime = now + error * step * 1000;
    if (generateTotpCode(secret, checkTime, step) === cleaned) {
      return true;
    }
  }
  return false;
}
