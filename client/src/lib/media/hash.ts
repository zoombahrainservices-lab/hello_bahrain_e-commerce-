import { createHash } from 'crypto';

/**
 * Compute a SHA-256 hex digest of a buffer.
 * Stored on media_items.file_hash for future duplicate detection.
 */
export function computeSHA256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}
