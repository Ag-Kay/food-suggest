import { hostFromHostUri } from './config';

describe('hostFromHostUri', () => {
  it('extracts the host from Expo host URIs', () => {
    expect(hostFromHostUri('192.168.1.20:8081')).toBe('192.168.1.20');
    expect(hostFromHostUri('exp://10.0.0.5:8081')).toBe('10.0.0.5');
    expect(hostFromHostUri('[::1]:8081')).toBe('[::1]');
    expect(hostFromHostUri(undefined)).toBeNull();
    expect(hostFromHostUri('')).toBeNull();
  });
});
