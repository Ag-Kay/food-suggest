import type { LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ColorToken } from '@/theme/tokens';
import { iconSize } from '@/theme/tokens';

export type { LucideIcon };

export interface IconProps {
  icon: LucideIcon;
  size?: keyof typeof iconSize | number;
  color?: ColorToken;
  /** Raw colour, for icons on photos or on saffron fills. */
  tint?: string;
  strokeWidth?: number;
}

/**
 * The one way to draw an icon (Lucide, 2 px stroke). Icons are decorative:
 * the control that contains them carries the accessibility label.
 */
export function Icon({ icon: Glyph, size = 'md', color = 'text', tint, strokeWidth = 2 }: IconProps) {
  const { colors } = useTheme();
  const px = typeof size === 'number' ? size : iconSize[size];
  return (
    <Glyph
      size={px}
      color={tint ?? colors[color]}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}
