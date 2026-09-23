import crypto from 'node:crypto';

const ITERATIONS = 100_000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

/**
 * Cria hash seguro da senha usando PBKDF2 + SHA-512 (OWASP standard)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  return `pbkdf2:${ITERATIONS}:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Compara a senha informada com o hash salvo utilizando timingSafeEqual para mitigar timing attacks
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      return false;
    }

    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];

    const testKey = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST);
    const testHash = testKey.toString('hex');

    const originalBuffer = Buffer.from(originalHash, 'utf8');
    const testBuffer = Buffer.from(testHash, 'utf8');

    if (originalBuffer.length !== testBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(originalBuffer, testBuffer);
  } catch {
    return false;
  }
}
