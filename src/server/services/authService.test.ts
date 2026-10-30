import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from './authService';

test('hashPassword creates a secure non-plaintext hash and verifyPassword confirms it', () => {
  const password = 'kampalaFitness2026!';
  const hash = hashPassword(password);

  assert.notEqual(hash, password);
  assert.ok(hash.startsWith('$2'));
  assert.equal(verifyPassword(password, hash), true);
  assert.equal(verifyPassword('wrongPassword', hash), false);
});

test('generateToken creates a valid JWT verifiable by verifyToken', () => {
  const user = {
    id: 'user-test-123',
    email: 'kato@flexifit.ug',
    role: 'client' as const,
    name: 'Kato Ronald',
  };

  const token = generateToken(user);
  assert.ok(token.length > 20);

  const decoded = verifyToken(token);
  assert.ok(decoded);
  assert.equal(decoded.userId, user.id);
  assert.equal(decoded.email, user.email);
  assert.equal(decoded.role, user.role);
  assert.equal(decoded.name, user.name);
});

test('verifyToken returns null for forged or corrupted tokens', () => {
  const forgedToken = 'ey12345.corrupted.token';
  const decoded = verifyToken(forgedToken);
  assert.equal(decoded, null);
});
