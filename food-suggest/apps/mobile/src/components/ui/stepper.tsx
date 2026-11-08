import { Pressable, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

import { AppText } from './app-text';

export interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Spoken label, e.g. "Servings". */
  label: string;
  /** Visible text, e.g. "2 servings". Defaults to the number. */
  format?: (value: number) => string;
}

/** − value + control, exposed to screen readers as an adjustable element. */
export function Stepper({ value, min, max, onChange, label, format = String }: StepperProps) {
  const { colors, radius, space } = useTheme();
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  const button = (text: string, delta: number, disabled: boolean) => (
    <Pressable
      onPress={() => set(value + delta)}
      disabled={disabled}
      importantForAccessibility="no"
      accessibilityElementsHidden
      hitSlop={6}
      style={({ pressed }) => ({
        width: minTouchTarget - 8,
        height: minTouchTarget - 8,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryMuted,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}>
      <AppText variant="headline" color="primary">
        {text}
      </AppText>
    </Pressable>
  );

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => set(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      {button('−', -1, value <= min)}
      <AppText variant="subhead" style={{ minWidth: 84, textAlign: 'center' }}>
        {format(value)}
      </AppText>
      {button('+', 1, value >= max)}
    </View>
  );
}
