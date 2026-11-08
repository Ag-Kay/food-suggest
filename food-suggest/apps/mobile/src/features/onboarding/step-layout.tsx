import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Icon, type LucideIcon } from '@/components/ui';
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
  /** Optional icon above the title (e.g. on intro and confirmation screens). */
  icon?: LucideIcon;
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
  icon,
}: StepLayoutProps) {
  const { colors, layout, space, radius } = useTheme();
  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: layout.gutter, gap: space.xl }}
        >
          {step && totalSteps ? (
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={`Step ${step} of ${totalSteps}`}
              accessibilityValue={{ min: 0, max: totalSteps, now: step }}
              style={{ height: 6, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }}
            >
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
            {icon ? (
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: space.sm,
                }}
              >
                <Icon icon={icon} size="xl" color="link" />
              </View>
            ) : null}
            <AppText variant="largeTitle">{title}</AppText>
            {why ? <AppText color="textSecondary">{why}</AppText> : null}
          </View>
          {children}
        </ScrollView>
        <View
          style={{
            paddingHorizontal: layout.gutter,
            paddingVertical: space.md,
            gap: space.xs,
            backgroundColor: colors.background,
          }}
        >
          <Button label={primaryLabel} onPress={onPrimary} disabled={primaryDisabled} />
          {secondaryLabel && onSecondary ? (
            <Button label={secondaryLabel} variant="ghost" onPress={onSecondary} />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
