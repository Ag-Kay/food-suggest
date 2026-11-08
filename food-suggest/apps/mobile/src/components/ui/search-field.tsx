import { Search, X } from 'lucide-react-native';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

import { Icon } from './icon';

export interface SearchFieldProps extends Pick<TextInputProps, 'autoFocus' | 'onSubmitEditing'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Extra control on the right (e.g. a filter button). */
  trailing?: React.ReactNode;
}

/** Pill search field with a search icon and clear button. */
export function SearchField({ value, onChangeText, placeholder = 'Search', trailing, ...rest }: SearchFieldProps) {
  const { colors, radius, space, typography } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.pill,
        paddingLeft: space.lg,
        paddingRight: trailing ? space.xs : 0,
        minHeight: minTouchTarget + 6,
      }}>
      <Icon icon={Search} size="md" color="textSecondary" />
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        style={[typography.body, { flex: 1, color: colors.text, paddingVertical: space.sm }]}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          style={{ minWidth: minTouchTarget, minHeight: minTouchTarget, alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={X} size="md" color="textSecondary" />
        </Pressable>
      ) : null}
      {trailing}
    </View>
  );
}
