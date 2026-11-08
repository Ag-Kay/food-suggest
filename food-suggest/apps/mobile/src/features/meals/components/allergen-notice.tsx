import { ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import type { Allergen } from '@food-suggest/shared';

import { AppText, Icon } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { ALLERGEN_LABELS } from '@/lib/labels';

export interface AllergenNoticeProps {
  allergens: Allergen[];
  optionalAllergens: Allergen[];
  complete: boolean;
}

const list = (items: Allergen[]) => items.map((a) => ALLERGEN_LABELS[a]).join(', ');

/** Compact allergen summary. Safety information stays visible; wording is short. */
export function AllergenNotice({ allergens, optionalAllergens, complete }: AllergenNoticeProps) {
  const { colors, radius, space } = useTheme();
  const warn = allergens.length > 0 || !complete;
  return (
    <View
      accessibilityRole={warn ? 'alert' : undefined}
      style={{
        flexDirection: 'row',
        gap: space.md,
        backgroundColor: warn ? colors.primaryMuted : colors.successMuted,
        borderRadius: radius.lg,
        padding: space.lg,
      }}>
      <Icon icon={warn ? TriangleAlert : ShieldCheck} size="lg" color={warn ? 'warning' : 'success'} />
      <View style={{ flex: 1, gap: space.xs }}>
        <AppText variant="headline">{allergens.length ? `Contains ${list(allergens).toLowerCase()}` : 'No major allergens listed'}</AppText>
        {optionalAllergens.length ? (
          <AppText variant="footnote" color="textSecondary">
            Optional extras: {list(optionalAllergens).toLowerCase()}
          </AppText>
        ) : null}
        {!complete ? (
          <AppText variant="footnote" style={{ color: colors.warning, fontWeight: '600' }}>
            Spice blends and stock cubes vary by brand. Check their labels.
          </AppText>
        ) : null}
        <AppText variant="footnote" color="textSecondary">
          Recipes vary. If you have an allergy, always check.
        </AppText>
      </View>
    </View>
  );
}
