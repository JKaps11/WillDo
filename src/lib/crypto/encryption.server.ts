import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Encryption utility for sensitive data like OAuth tokens
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * Key must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.GOOGLE_OAUTH_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'GOOGLE_OAUTH_ENCRYPTION_KEY environment variable is not set',
    );
  }

  if (key.length !== KEY_LENGTH * 2) {
    throw new Error(
      `GOOGLE_OAUTH_ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes)`,
    );
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string value
 * Returns base64-encoded string: iv:authTag:encryptedData
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine iv, authTag, and encrypted data
  const combined = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;

  return Buffer.from(combined).toString('base64');
}

/**
 * Decrypt an encrypted string
 * Expects base64-encoded string: iv:authTag:encryptedData
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();

  // Decode from base64 and split components
  const combined = Buffer.from(encryptedText, 'base64').toString('utf8');
  const parts = combined.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a random encryption key (32 bytes as hex string)
 * Use this to generate the GOOGLE_OAUTH_ENCRYPTION_KEY value
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString('hex');
}
