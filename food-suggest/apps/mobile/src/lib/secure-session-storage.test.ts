import AsyncStorage from '@react-native-async-storage/async-storage';

import { secureSessionStorage } from './secure-session-storage';

const mockSecure = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (k: string, v: string) => void mockSecure.set(k, v)),
  getItemAsync: jest.fn(async (k: string) => mockSecure.get(k) ?? null),
  deleteItemAsync: jest.fn(async (k: string) => void mockSecure.delete(k)),
}));
jest.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 37 + 11) % 256),
}));

const KEY = 'sb-project-auth-token';
const SESSION = JSON.stringify({ access_token: 'secret-access-token', refresh_token: 'secret-refresh' });

describe('secureSessionStorage', () => {
  beforeEach(async () => {
    mockSecure.clear();
    await AsyncStorage.clear();
  });

  it('stores only ciphertext in AsyncStorage and the key in SecureStore', async () => {
    await secureSessionStorage.setItem(KEY, SESSION);
    const stored = await AsyncStorage.getItem(KEY);
    expect(stored).not.toContain('secret-access-token');
    expect(stored).toMatch(/^[0-9a-f]+$/);
    expect(mockSecure.get(`${KEY}.key`)).toHaveLength(64); // 256-bit key as hex
  });

  it('decrypts what it stored', async () => {
    await secureSessionStorage.setItem(KEY, SESSION);
    await expect(secureSessionStorage.getItem(KEY)).resolves.toBe(SESSION);
  });

  it('treats a missing key as signed out', async () => {
    await secureSessionStorage.setItem(KEY, SESSION);
    mockSecure.clear();
    await expect(secureSessionStorage.getItem(KEY)).resolves.toBeNull();
  });

  it('removes both the data and the key', async () => {
    await secureSessionStorage.setItem(KEY, SESSION);
    await secureSessionStorage.removeItem(KEY);
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
    expect(mockSecure.size).toBe(0);
  });
});
