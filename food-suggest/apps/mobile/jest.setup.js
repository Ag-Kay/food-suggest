/* global jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Reanimated needs a device runtime; tests only need components to render.
// Covers the API the app uses (press feedback and layout animations).
jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  const layout = new Proxy({}, { get: () => ({ duration: () => layout, delay: () => layout, springify: () => layout }) });
  const Animated = {
    View: RN.View,
    Text: RN.Text,
    ScrollView: RN.ScrollView,
    createAnimatedComponent: (c) => c,
  };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (v) => { const sv = { value: v, get: () => sv.value, set: (n) => { sv.value = n; } }; return sv; },
    useAnimatedStyle: () => ({}),
    useReducedMotion: () => false,
    withSpring: (v) => v,
    withTiming: (v) => v,
    FadeIn: layout,
    FadeOut: layout,
    FadeInDown: layout,
    LinearTransition: layout,
  };
});
