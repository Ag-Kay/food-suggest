import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTokenVerifier, InvalidTokenError, type TokenVerifier } from './verify-token.js';

const ISSUER = 'https://example.supabase.co/auth/v1';
const USER = '11111111-2222-4333-8444-555555555555';

let sign: (claims: Record<string, unknown>, opts?: { alg?: string; key?: CryptoKey }) => Promise<string>;
let verify: TokenVerifier;
let otherKey: CryptoKey;

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  otherKey = (await generateKeyPair('ES256')).privateKey;
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256', use: 'sig' };
  verify = createTokenVerifier({ issuer: ISSUER, keys: createLocalJWKSet({ keys: [jwk] }) });
  sign = (claims, { key = privateKey } = {}) =>
    new SignJWT({ role: 'authenticated', email: 'a@example.com', is_anonymous: false, ...claims })
      .setProtectedHeader({ alg: 'ES256', kid: 'k1' })
      .setIssuer((claims.iss as string) ?? ISSUER)
      .setAudience((claims.aud as string) ?? 'authenticated')
      .setSubject((claims.sub as string) ?? USER)
      .setIssuedAt()
      .setExpirationTime((claims.exp as number) ?? '1h')
      .sign(key);
});

describe('createTokenVerifier', () => {
  it('accepts a valid Supabase user token', async () => {
    await expect(verify(await sign({}))).resolves.toEqual({ userId: USER, email: 'a@example.com' });
  });

  it.each([
    ['wrong issuer', { iss: 'https://evil.supabase.co/auth/v1' }],
    ['wrong audience', { aud: 'anon' }],
    ['expired', { exp: Math.floor(Date.now() / 1000) - 60 }],
    ['anonymous user', { is_anonymous: true }],
    ['non-user role', { role: 'service_role' }],
    ['non-UUID subject', { sub: 'admin' }],
  ])('rejects a token with %s', async (_label, claims) => {
    await expect(verify(await sign(claims))).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects a token signed by a different key', async () => {
    await expect(verify(await sign({}, { key: otherKey }))).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects garbage and unsigned tokens', async () => {
    await expect(verify('not-a-jwt')).rejects.toBeInstanceOf(InvalidTokenError);
    const unsigned = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: USER, aud: 'authenticated', iss: ISSUER, role: 'authenticated' })).toString('base64url')}.`;
    await expect(verify(unsigned)).rejects.toBeInstanceOf(InvalidTokenError);
  });
});
