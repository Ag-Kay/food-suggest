import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { UtensilsCrossed } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { foodTints } from '@/theme/tokens';

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface MealImageProps {
  slug: string;
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  /** Dark fade at the bottom so text on the photo stays readable. */
  scrim?: boolean;
  /** Load first (e.g. the hero on a detail page). */
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Meal photo: cached on disk, fades in, and falls back to a warm tint with an icon while
 * loading, when there is no photo, or when it fails. Decorative: the surrounding card or
 * screen names the meal for screen readers.
 */
export function MealImage({ slug, uri, style, scrim, priority = 'normal' }: MealImageProps) {
  const { scheme, radius } = useTheme();
  const [failed, setFailed] = useState(false);
  const tint = foodTints[scheme][hash(slug) % foodTints[scheme].length];
  const showPhoto = !!uri && !failed;

  return (
    <View
      aria-hidden
      style={[{ backgroundColor: tint, borderRadius: radius.lg, overflow: 'hidden' }, style]}>
      {showPhoto ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
          recyclingKey={slug}
          priority={priority}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Icon icon={UtensilsCrossed} size="xl" tint="rgba(0,0,0,0.25)" />
        </View>
      )}
      {scrim ? (
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.78)']}
          locations={[0.35, 0.55, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
