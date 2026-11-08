import { useColorScheme } from 'react-native';

import { elevation, iconSize, layout, palettes, radius, space, typography, type Palette } from '@/theme/tokens';

export type Scheme = 'light' | 'dark';

export interface Theme {
  scheme: Scheme;
  colors: Palette;
  space: typeof space;
  radius: typeof radius;
  typography: typeof typography;
  layout: typeof layout;
  iconSize: typeof iconSize;
  /** Card shadow for the current scheme (empty in dark mode). */
  elevation: (typeof elevation)['light'];
}

/**
 * Current theme, following the system appearance. A user override
 * (light / dark / system) will be layered on top when settings exist.
 */
export function useTheme(): Theme {
  const scheme: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: palettes[scheme], space, radius, typography, layout, iconSize, elevation: elevation[scheme] };
}
