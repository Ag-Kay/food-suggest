import { View } from 'react-native';

import type { Allergen } from '@food-suggest/shared';

import { AppText, Card } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { ALLERGEN_LABELS } from '@/lib/labels';

export interface AllergenNoticeProps {
  allergens: Allergen[];
  optionalAllergens: Allergen[];
  complete: boolean;
}

const list = (items: Allergen[]) => items.map((a) => ALLERGEN_LABELS[a]).join(', ');

export function AllergenNotice({ allergens, optionalAllergens, complete }: AllergenNoticeProps) {
  const { space, colors } = useTheme();
  return (
    <Card style={{ gap: space.sm, borderColor: !complete || allergens.length ? colors.warning : colors.border }}>
      <AppText variant="headline">Allergens</AppText>
      <AppText>{allergens.length ? `Contains: ${list(allergens)}.` : 'No major allergens in the listed ingredients.'}</AppText>
      {optionalAllergens.length ? (
        <AppText color="textSecondary">Optional extras contain: {list(optionalAllergens)}.</AppText>
      ) : null}
      {!complete ? (
        <View accessibilityRole="alert">
          <AppText color="warning" style={{ fontWeight: '600' }}>
            Some ingredients (such as spice blends or stock cubes) vary by brand. Check their labels.
          </AppText>
        </View>
      ) : null}
      <AppText variant="footnote" color="textSecondary">
        Recipes vary between cooks and sellers. If you have a food allergy, always check the ingredients.
      </AppText>
    </Card>
  );
}
