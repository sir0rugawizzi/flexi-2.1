import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Enterprise AES-256-GCM Encryption Service
 * Protects uploaded coach credentials, licences, client photos, and sensitive health records.
 */

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

// Derive consistent 32-byte key from environment or secure server master seed
const MASTER_KEY_STRING = process.env.ENCRYPTION_MASTER_KEY || 'flexifit_uganda_secure_master_aes256_key_2026_kampala_sports';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(MASTER_KEY_STRING).digest();

export interface EncryptedDataPayload {
  iv: string; // Hex
  authTag: string; // Hex
  encryptedData: string; // Hex
  algorithm: string;
  timestamp: string;
}

/**
 * Encrypts arbitrary buffer or string using AES-256-GCM
 */
export function encryptBuffer(data: Buffer | string): EncryptedDataPayload {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encryptedData: encrypted.toString('hex'),
    algorithm: ENCRYPTION_ALGORITHM,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Decrypts AES-256-GCM payload back to Buffer
 */
export function decryptToBuffer(payload: EncryptedDataPayload): Buffer {
  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.authTag, 'hex');
  const encryptedText = Buffer.from(payload.encryptedData, 'hex');

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedText), decipher.final()]);
}

/**
 * Encrypts and saves file to secure encrypted disk vault
 */
export function saveEncryptedFile(
  fileBuffer: Buffer,
  originalFilename: string,
  destinationDir: string
): { filename: string; filePath: string; encryptedMeta: EncryptedDataPayload } {
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  const payload = encryptBuffer(fileBuffer);
  const safeExt = path.extname(originalFilename) || '.enc';
  const secureFilename = `enc_${crypto.randomUUID()}${safeExt}.vault`;
  const targetPath = path.join(destinationDir, secureFilename);

  // Write encrypted metadata & payload to secure vault container
  fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2), 'utf-8');

  return {
    filename: secureFilename,
    filePath: targetPath,
    encryptedMeta: payload,
  };
}

/**
 * Reads and decrypts file from vault
 */
export function readAndDecryptFile(filePath: string): Buffer {
  if (!fs.existsSync(filePath)) {
    throw new Error('Encrypted file not found');
  }

  const rawJson = fs.readFileSync(filePath, 'utf-8');
  const payload = JSON.parse(rawJson) as EncryptedDataPayload;
  return decryptToBuffer(payload);
}
