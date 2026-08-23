import { describe, it, expect } from 'vitest';
import {
  canonicalizeJson,
  computeReceiptHash,
  generateEd25519KeyPair,
  signHash,
  verifySignature,
} from '../src/receipt/index.js';

describe('Receipt Integrity & Cryptography', () => {
  it('canonicalizes JSON in deterministic key order', () => {
    const objA = { z: 1, a: 2, m: { y: 10, x: 20 } };
    const objB = { a: 2, m: { x: 20, y: 10 }, z: 1 };
    expect(canonicalizeJson(objA)).toBe(canonicalizeJson(objB));
  });

  it('generates Ed25519 keypair, signs hash, and verifies correctly', () => {
    const { privateKeyBase64, publicKeyBase64 } = generateEd25519KeyPair();
    const hash = 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e';

    const sig = signHash(hash, privateKeyBase64);
    expect(sig).toBeTruthy();

    const isValid = verifySignature(hash, sig, publicKeyBase64);
    expect(isValid).toBe(true);

    const isTampered = verifySignature(
      'b591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146f',
      sig,
      publicKeyBase64
    );
    expect(isTampered).toBe(false);
  });
});
