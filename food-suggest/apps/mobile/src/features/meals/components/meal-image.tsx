import { View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { foodTints } from '@/theme/tokens';

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Placeholder artwork until real food photography exists: a warm tint and the
 * meal's initials. Decorative, so hidden from screen readers.
 */
export function MealImage({ slug, name, style }: { slug: string; name: string; style?: ViewStyle }) {
  const { scheme, colors, radius } = useTheme();
  const tints = foodTints[scheme];
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !['and', 'with', 'the'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          backgroundColor: tints[hash(slug) % tints.length],
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <AppText variant="title2" style={{ color: colors.textSecondary, opacity: 0.8 }}>
        {initials}
      </AppText>
    </View>
  );
}
