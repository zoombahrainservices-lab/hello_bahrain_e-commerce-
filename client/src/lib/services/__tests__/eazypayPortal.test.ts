/**
 * Unit tests for EazyPay Portal service
 * Tests HMAC signing and stable JSON stringification
 */

import {
  nowTimestampMs,
  hmacSha256Hex,
  stableJsonStringify,
  signJsonRequest,
} from '../eazypayPortal';
import crypto from 'crypto';

describe('EazyPay Portal Service', () => {
  const testSecret = 'test-secret-key-123';

  describe('nowTimestampMs', () => {
    it('should return timestamp as string', () => {
      const timestamp = nowTimestampMs();
      expect(typeof timestamp).toBe('string');
      expect(parseInt(timestamp)).toBeGreaterThan(0);
    });
  });

  describe('hmacSha256Hex', () => {
    it('should compute correct HMAC-SHA256 hash', () => {
      const message = 'test-message';
      const hash = hmacSha256Hex(testSecret, message);
      
      // Verify using crypto directly
      const expected = crypto
        .createHmac('sha256', testSecret)
        .update(message)
        .digest('hex');
      
      expect(hash).toBe(expected);
      expect(hash.length).toBe(64); // SHA256 hex is 64 chars
    });
  });

  describe('stableJsonStringify', () => {
    it('should produce deterministic output', () => {
      const obj = {
        c: 3,
        a: 1,
        b: 2,
      };
      
      const result1 = stableJsonStringify(obj);
      const result2 = stableJsonStringify(obj);
      
      expect(result1).toBe(result2);
      expect(result1).toBe('{"a":1,"b":2,"c":3}'); // Keys sorted
    });

    it('should handle nested objects', () => {
      const obj = {
        z: { b: 2, a: 1 },
        y: 3,
      };
      
      const result = stableJsonStringify(obj);
      expect(result).toBe('{"y":3,"z":{"a":1,"b":2}}');
    });

    it('should handle arrays', () => {
      const obj = {
        items: [3, 1, 2],
      };
      
      const result = stableJsonStringify(obj);
      expect(result).toBe('{"items":[3,1,2]}');
    });
  });

  describe('signJsonRequest', () => {
    it('should create correct headers for JSON request', () => {
      const bodyString = '{"apiKey":"test","page":"1"}';
      const timestamp = '1234567890';
      
      const headers = signJsonRequest(bodyString, timestamp, testSecret);
      
      expect(headers['Timestamp']).toBe(timestamp);
      expect(headers['content-type']).toBe('application/json; charset=utf-8');
      expect(headers['Secret-Hash']).toBeDefined();
      
      // Verify hash is correct
      const message = timestamp + bodyString;
      const expectedHash = hmacSha256Hex(testSecret, message);
      expect(headers['Secret-Hash']).toBe(expectedHash);
    });
  });

  describe('JSON Request Signing Flow', () => {
    it('should sign request exactly as EazyPay expects', () => {
      const body = {
        apiKey: 'test-api-key',
        page: '1',
        size: '20',
      };
      
      // Step 1: Create stable JSON string
      const bodyString = stableJsonStringify(body);
      
      // Step 2: Generate timestamp
      const timestamp = nowTimestampMs();
      
      // Step 3: Sign
      const headers = signJsonRequest(bodyString, timestamp, testSecret);
      
      // Step 4: Verify signature
      const message = timestamp + bodyString;
      const expectedHash = hmacSha256Hex(testSecret, message);
      
      expect(headers['Secret-Hash']).toBe(expectedHash);
    });
  });
});

