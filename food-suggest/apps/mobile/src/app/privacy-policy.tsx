import { View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { POLICY_UPDATED, PRIVACY_POLICY } from '@/features/legal/privacy-policy';
import { useTheme } from '@/hooks/use-theme';

/** The full privacy policy (same text as docs/PRIVACY_POLICY.md). */
export default function PrivacyPolicyScreen() {
  const { colors, space } = useTheme();
  return (
    <Screen edges={['left', 'right', 'bottom']} gap={space.xl}>
      <AppText variant="footnote" color="textSecondary">
        Last updated {POLICY_UPDATED}
      </AppText>
      {PRIVACY_POLICY.map((section) => (
        <View key={section.heading} style={{ gap: space.sm }}>
          <AppText variant="title3">{section.heading}</AppText>
          {section.paragraphs?.map((p) => (
            <AppText key={p} color="textSecondary">
              {p}
            </AppText>
          ))}
          {section.bullets?.map((b) => (
            <View key={b} style={{ flexDirection: 'row', gap: space.sm }}>
              <View aria-hidden style={{ width: 5, height: 5, borderRadius: 3, marginTop: 9, backgroundColor: colors.textSecondary }} />
              <AppText color="textSecondary" style={{ flex: 1 }}>
                {b}
              </AppText>
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}
