import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

export interface StepLayoutProps {
  step?: number;
  totalSteps?: number;
  title: string;
  /** Why we ask: shown under the title on every step. */
  why?: string;
  children: ReactNode;
  primaryLabel?: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function StepLayout({
  step,
  totalSteps,
  title,
  why,
  children,
  primaryLabel = 'Continue',
  onPrimary,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
}: StepLayoutProps) {
  const { colors, space, radius } = useTheme();
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
          {step && totalSteps ? (
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={`Step ${step} of ${totalSteps}`}
              accessibilityValue={{ min: 0, max: totalSteps, now: step }}
              style={{ height: 6, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }}>
              <View
                style={{
                  width: `${(step / totalSteps) * 100}%`,
                  height: 6,
                  backgroundColor: colors.primary,
                  borderRadius: radius.pill,
                }}
              />
            </View>
          ) : null}
          <View style={{ gap: space.sm }}>
            <AppText variant="title1">{title}</AppText>
            {why ? <AppText color="textSecondary">{why}</AppText> : null}
          </View>
          {children}
        </ScrollView>
        <View
          style={{
            padding: space.lg,
            gap: space.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}>
          <Button label={primaryLabel} onPress={onPrimary} disabled={primaryDisabled} />
          {secondaryLabel && onSecondary ? <Button label={secondaryLabel} variant="ghost" onPress={onSecondary} /> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
