/**
 * Food Suggest design tokens: the single source of truth for colour, type,
 * spacing and shape. Components read these through `useTheme()`; screens should
 * not hard-code colours or sizes. (If we adopt NativeWind later, these values map
 * 1:1 onto a Tailwind theme.)
 *
 * Contrast: text and primary colours meet WCAG AA (≥ 4.5:1) on their backgrounds.
 */
import { Platform, type TextStyle } from 'react-native';

const light = {
  background: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F2EC',
  border: '#E3E5DE',
  text: '#15181A',
  textSecondary: '#5B6168',
  primary: '#1F7A4D', // fresh leaf green
  onPrimary: '#FFFFFF',
  primaryMuted: '#E3F2EA',
  accent: '#B8501A', // palm-oil orange (text-safe shade)
  onAccent: '#FFFFFF',
  success: '#1F7A4D',
  warning: '#8A5A00',
  danger: '#B42318',
  info: '#1D5FA8',
  overlay: 'rgba(0,0,0,0.4)',
} as const;

const dark: Record<keyof typeof light, string> = {
  background: '#0F1312',
  surface: '#171C1A',
  surfaceMuted: '#202725',
  border: '#2C3431',
  text: '#F2F4F1',
  textSecondary: '#A9B1AC',
  primary: '#5BD39A',
  onPrimary: '#08130D',
  primaryMuted: '#173A28',
  accent: '#F08A4B',
  onAccent: '#1A0C03',
  success: '#5BD39A',
  warning: '#F2B84B',
  danger: '#FF8A80',
  info: '#8AB8F2',
  overlay: 'rgba(0,0,0,0.6)',
};

export type ColorToken = keyof typeof light;
export type Palette = Record<ColorToken, string>;
export const palettes: { light: Palette; dark: Palette } = { light, dark };

/** 4-pt spacing scale. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Apple HIG minimum touch target (Android's is 48dp; we use the larger where it matters). */
export const minTouchTarget = 44;

const family = Platform.select({ ios: 'System', default: undefined });

/**
 * Type ramp modelled on the iOS text styles so it scales with Dynamic Type /
 * Android font scale (we never disable font scaling).
 */
export const typography = {
  largeTitle: { fontFamily: family, fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontFamily: family, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontFamily: family, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title3: { fontFamily: family, fontSize: 20, lineHeight: 25, fontWeight: '600' },
  headline: { fontFamily: family, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontFamily: family, fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontFamily: family, fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subhead: { fontFamily: family, fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontFamily: family, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontFamily: family, fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const theme = { palettes, space, radius, typography, minTouchTarget };
