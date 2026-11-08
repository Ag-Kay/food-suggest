import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/** Unknown (null) counts as online: only a definite "no" pauses requests. */
export const isOnlineState = (state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>) =>
  state.isConnected !== false && state.isInternetReachable !== false;

let started = false;

/**
 * Tells TanStack Query when the phone goes on or offline. Offline, queries pause (cached data
 * stays on screen instead of turning into errors) and resume on reconnect. The browser already
 * does this for web.
 */
export function startNetworkListener() {
  if (started || Platform.OS === 'web') return;
  started = true;
  onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((state) => setOnline(isOnlineState(state))));
}

/** True while the phone has (or might have) an internet connection. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true,
  );
}
