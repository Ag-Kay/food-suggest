import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while pressed (1 = no change). */
  pressedScale?: number;
}

/**
 * Pressable that gently shrinks while touched: the shared press feedback for cards,
 * tiles and buttons. Respects the system "Reduce Motion" setting.
 */
export function PressableScale({ style, pressedScale = 0.97, onPressIn, onPressOut, disabled, ...rest }: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const spring = { damping: 18, stiffness: 320, mass: 0.6 };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!reduceMotion) scale.set(withSpring(pressedScale, spring));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, spring));
        onPressOut?.(e);
      }}
      style={[style, animated]}
    />
  );
}
