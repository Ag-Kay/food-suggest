import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';
import { MAX_ITEM_TEXT, useShoppingLists } from '@/stores/shopping-lists';
import { minTouchTarget } from '@/theme/tokens';

/** Edit one item (with itemId) or rename the list (without). */
export default function EditShopping() {
  const router = useRouter();
  const { colors, radius, space, typography } = useTheme();
  const { listId, itemId } = useLocalSearchParams<{ listId: string; itemId?: string }>();
  const list = useShoppingLists((s) => s.lists.find((l) => l.id === listId));
  const item = itemId ? list?.items.find((i) => i.id === itemId) : undefined;
  const [name, setName] = useState(item?.name ?? list?.name ?? '');
  const [amount, setAmount] = useState(item?.amountText ?? '');
  const store = useShoppingLists.getState();

  const input = {
    ...typography.body,
    color: colors.text,
    minHeight: minTouchTarget + 4,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
  };

  if (!list || (itemId && !item)) {
    return (
      <StepLayout title="Not found" why="It may have been deleted." primaryLabel="Close" onPrimary={() => router.back()}>
        <View />
      </StepLayout>
    );
  }

  if (!item) {
    return (
      <StepLayout
        title="Rename list"
        primaryLabel="Save"
        primaryDisabled={!name.trim()}
        onPrimary={() => {
          store.rename(list.id, name);
          router.back();
        }}
        secondaryLabel="Cancel"
        onSecondary={() => router.back()}>
        <Stack.Screen options={{ title: 'Rename list' }} />
        <TextInput value={name} onChangeText={setName} autoFocus maxLength={MAX_ITEM_TEXT} accessibilityLabel="List name" style={input} />
      </StepLayout>
    );
  }

  return (
    <StepLayout
      title="Edit item"
      why={item.source === 'GENERATED' ? 'This item came from your meal plan. Updating the list from the plan will reset it.' : undefined}
      primaryLabel="Save"
      primaryDisabled={!name.trim()}
      onPrimary={() => {
        store.updateItem(list.id, item.id, { name, amountText: amount });
        router.back();
      }}
      secondaryLabel="Remove from list"
      onSecondary={() => {
        store.removeItem(list.id, item.id);
        router.back();
      }}>
      <Stack.Screen options={{ title: 'Edit item' }} />
      <Card tone="muted" style={{ gap: space.sm }}>
        <AppText variant="subhead" color="textSecondary">
          Name
        </AppText>
        <TextInput value={name} onChangeText={setName} maxLength={MAX_ITEM_TEXT} accessibilityLabel="Item name" style={input} />
        <AppText variant="subhead" color="textSecondary">
          Amount
        </AppText>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          maxLength={MAX_ITEM_TEXT}
          placeholder="e.g. 2 packs"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Amount"
          style={input}
        />
      </Card>
    </StepLayout>
  );
}
