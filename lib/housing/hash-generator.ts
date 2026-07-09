import crypto from 'crypto';

export function generateHmacSha256(secretKey: string, message: string): string {
  return crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');
}

export function generateHousingHash(encryptionKey: string, currentTime: string): string {
  return generateHmacSha256(encryptionKey, currentTime);
}