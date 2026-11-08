/**
 * Food Suggest design tokens: the single source of truth for colour, type,
 * spacing and shape. Components read these through `useTheme()`; screens should
 * not hard-code colours or sizes.
 *
 * Direction (2026-11-08 redesign): charcoal surfaces, one saffron accent, food photography,
 * Fraunces for display headings and the system font for everything else.
 *
 * Contrast: text colours meet WCAG AA (≥ 4.5:1) on background and surface. Saffron is a
 * FILL colour (buttons, selected states) with dark text on it; saffron TEXT uses `link`,
 * which is a darker shade in the light theme.
 */
import { Platform, type TextStyle, type ViewStyle } from 'react-native';

const SAFFRON = '#F5B21A';

const dark = {
  background: '#0E1012',
  surface: '#181B1E',
  surfaceMuted: '#22262A',
  border: '#2B3034',
  text: '#F5F4F0',
  textSecondary: '#A2A8AD',
  /** Saffron fill for primary actions and selection. */
  primary: SAFFRON,
  onPrimary: '#1A1200',
  primaryMuted: '#3A2E12',
  /** Saffron for text and icons on background/surface. */
  link: SAFFRON,
  success: '#4CC38A',
  successMuted: '#173528',
  warning: '#F2A93B',
  danger: '#FF7A6E',
  dangerMuted: '#3A1F1C',
  info: '#7FB2F0',
  overlay: 'rgba(0,0,0,0.55)',
  /** Text and icons on top of photos (both themes). */
  onImage: '#FFFFFF',
  /** Frosted circle behind icons on photos. */
  imageButton: 'rgba(20,22,24,0.55)',
} as const;

const light: Record<keyof typeof dark, string> = {
  background: '#F6F5F1',
  surface: '#FFFFFF',
  surfaceMuted: '#EEECE6',
  border: '#E3E0D8',
  text: '#17191B',
  textSecondary: '#5D636A',
  primary: SAFFRON,
  onPrimary: '#1A1200',
  primaryMuted: '#FBEFCF',
  link: '#8A5B00',
  success: '#1F7A4D',
  successMuted: '#E2F2E9',
  warning: '#8A5A00',
  danger: '#B42318',
  dangerMuted: '#FBE7E4',
  info: '#1D5FA8',
  overlay: 'rgba(0,0,0,0.4)',
  onImage: '#FFFFFF',
  imageButton: 'rgba(20,22,24,0.45)',
};

export type ColorToken = keyof typeof dark;
export type Palette = Record<ColorToken, string>;
export const palettes: { light: Palette; dark: Palette } = { light, dark };

/** Warm tints for the image fallback (photo missing or failed to load). */
export const foodTints = {
  light: ['#F6E3C8', '#E3F2EA', '#F9DCCB', '#EDE7D3', '#E1ECD5', '#F3E0D9'],
  dark: ['#3A2C1B', '#1D3A2B', '#3D2418', '#2E2A1D', '#22301A', '#35231E'],
} as const;

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

/** Page gutter and the gap between major sections. */
export const layout = { gutter: 20, section: 32 } as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Icon sizes: inline with text, standard controls, prominent. */
export const iconSize = { sm: 16, md: 20, lg: 24, xl: 28 } as const;

/** Apple HIG minimum touch target (Android's is 48dp; we use the larger where it matters). */
export const minTouchTarget = 44;

/** Soft elevation for cards in the light theme (dark relies on surface tone). */
export const elevation: Record<'light' | 'dark', ViewStyle> = {
  light: {
    shadowColor: '#2B2410',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  dark: {},
};

/** Loaded in the root layout (`useFonts`). */
export const fonts = {
  display: 'Fraunces_700Bold',
  displaySemi: 'Fraunces_600SemiBold',
} as const;

const system = Platform.select({ ios: 'System', default: undefined });

/**
 * Type ramp modelled on the iOS text styles so it scales with Dynamic Type /
 * Android font scale (we never disable font scaling). Display styles use Fraunces;
 * custom fonts carry their weight in the family name, so no fontWeight there.
 */
export const typography = {
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40 },
  largeTitle: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36 },
  title1: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32 },
  title2: { fontFamily: fonts.displaySemi, fontSize: 21, lineHeight: 27 },
  title3: { fontFamily: system, fontSize: 19, lineHeight: 24, fontWeight: '600' },
  headline: { fontFamily: system, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontFamily: system, fontSize: 17, lineHeight: 23, fontWeight: '400' },
  callout: { fontFamily: system, fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subhead: { fontFamily: system, fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontFamily: system, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontFamily: system, fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const theme = { palettes, space, radius, typography, minTouchTarget, layout, iconSize };
