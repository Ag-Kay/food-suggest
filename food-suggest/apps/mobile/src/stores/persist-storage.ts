import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** AsyncStorage-backed JSON storage for persisted Zustand stores (on-device only). */
export const deviceStorage = createJSONStorage(() => AsyncStorage);
