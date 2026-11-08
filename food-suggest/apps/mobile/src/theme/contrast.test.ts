import { palettes, type Palette } from './tokens';

/** WCAG 2.x relative luminance and contrast ratio for #RRGGBB colours. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Text (≥ 4.5:1) pairs used across the app: [text token, background token]. */
const TEXT_PAIRS: [keyof Palette, keyof Palette][] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['text', 'surfaceMuted'],
  ['textSecondary', 'background'],
  ['textSecondary', 'surface'],
  ['textSecondary', 'surfaceMuted'],
  ['link', 'background'],
  ['link', 'surface'],
  ['link', 'primaryMuted'],
  ['onPrimary', 'primary'],
  ['danger', 'background'],
  ['danger', 'surface'],
  ['danger', 'dangerMuted'],
  ['success', 'surface'],
  ['success', 'successMuted'],
  ['warning', 'surface'],
  ['text', 'primaryMuted'],
];

describe.each(Object.entries(palettes))('%s theme contrast', (_name, p) => {
  it.each(TEXT_PAIRS)('%s on %s meets WCAG AA for text', (fg, bg) => {
    expect(contrast(p[fg], p[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
