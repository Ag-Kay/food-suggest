import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, TextInput, View } from 'react-native';

import { AppText, Badge, Button, Card, EmptyState, Screen } from '@/components/ui';
import { groupByCategory } from '@/features/shopping/group';
import { useMakeShoppingList } from '@/features/shopping/use-make-list';
import { useTheme } from '@/hooks/use-theme';
import { MAX_ITEM_TEXT, useShoppingLists, type ShoppingItem } from '@/stores/shopping-lists';
import { minTouchTarget } from '@/theme/tokens';

function confirm(title: string, message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}

function ItemRow({ listId, item, first }: { listId: string; item: ShoppingItem; first: boolean }) {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const toggle = () => useShoppingLists.getState().toggleItem(listId, item.id);
  const edit = () => router.push({ pathname: '/lists/edit', params: { listId, itemId: item.id } });
  const detail = [item.amountText, item.meals?.length ? `for ${item.meals.join(', ')}` : ''].filter(Boolean).join(' · ');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: first ? 0 : 1, borderTopColor: colors.border }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
        accessibilityLabel={`${item.name}${item.amountText ? `, ${item.amountText}` : ''}${item.optional ? ', optional' : ''}`}
        accessibilityActions={[{ name: 'longpress', label: 'Edit item' }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === 'longpress' && edit()}
        onPress={toggle}
        onLongPress={edit}
        style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, minHeight: minTouchTarget, opacity: pressed ? 0.6 : 1 })}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: radius.pill,
            borderWidth: 2,
            borderColor: item.checked ? colors.primary : colors.textSecondary,
            backgroundColor: item.checked ? colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {item.checked ? (
            <AppText variant="caption" style={{ color: colors.onPrimary, fontWeight: '700' }}>
              ✓
            </AppText>
          ) : null}
        </View>
        <View style={{ flex: 1, gap: space.xxs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
            <AppText
              variant="body"
              color={item.checked ? 'textSecondary' : 'text'}
              style={{ textDecorationLine: item.checked ? 'line-through' : 'none' }}>
              {item.name}
            </AppText>
            {item.optional ? <Badge label="Optional" /> : null}
          </View>
          {detail ? (
            <AppText variant="footnote" color="textSecondary" numberOfLines={2}>
              {detail}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.name}`}
        onPress={edit}
        hitSlop={4}
        style={({ pressed }) => ({ minWidth: minTouchTarget, minHeight: minTouchTarget, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
        <AppText variant="subhead" color="primary">
          Edit
        </AppText>
      </Pressable>
    </View>
  );
}

function AddItem({ listId }: { listId: string }) {
  const { colors, radius, space, typography } = useTheme();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const add = () => {
    if (!name.trim()) return;
    useShoppingLists.getState().addItem(listId, { name, amountText: amount });
    setName('');
    setAmount('');
  };
  const input = {
    ...typography.body,
    color: colors.text,
    minHeight: minTouchTarget,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.md,
  };
  return (
    <Card style={{ gap: space.sm }}>
      <AppText variant="headline">Add an item</AppText>
      <TextInput
        value={name}
        onChangeText={setName}
        onSubmitEditing={add}
        placeholder="e.g. Toilet roll"
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel="Item name"
        maxLength={MAX_ITEM_TEXT}
        returnKeyType="done"
        style={input}
      />
      <TextInput
        value={amount}
        onChangeText={setAmount}
        onSubmitEditing={add}
        placeholder="Amount (optional), e.g. 2 packs"
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel="Amount, optional"
        maxLength={MAX_ITEM_TEXT}
        returnKeyType="done"
        style={input}
      />
      <Button label="Add" variant="secondary" disabled={!name.trim()} onPress={add} />
    </Card>
  );
}

export default function ShoppingListScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const list = useShoppingLists((s) => s.lists.find((l) => l.id === id));
  const refresh = useMakeShoppingList();

  if (!list) {
    return (
      <Screen>
        <Stack.Screen options={{ title: '' }} />
        <EmptyState title="List not found" message="It may have been deleted." actionLabel="Back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const done = list.items.filter((i) => i.checked).length;
  const sections = groupByCategory(list.items);
  const store = useShoppingLists.getState();

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Shopping list' }} />
      <View style={{ gap: space.xs }}>
        <AppText variant="title2">{list.name}</AppText>
        <AppText color="textSecondary">
          {list.items.length ? `${done} of ${list.items.length} bought` : 'No items yet'}
          {list.fromPlan ? ' · from your meal plan' : ''}
        </AppText>
        {list.items.some((i) => i.source === 'GENERATED') ? (
          <AppText variant="footnote" color="textSecondary">
            Amounts are rounded up and only added together when the units match. Tap an item to tick it off.
          </AppText>
        ) : null}
      </View>

      {sections.map((section) => (
        <Card key={section.category} style={{ paddingVertical: space.sm, gap: space.xs }}>
          <AppText variant="subhead" color="textSecondary" accessibilityRole="header" style={{ fontWeight: '600' }}>
            {section.category}
          </AppText>
          {section.items.map((item, idx) => (
            <ItemRow key={item.id} listId={list.id} item={item} first={idx === 0} />
          ))}
        </Card>
      ))}

      <AddItem listId={list.id} />

      <View style={{ gap: space.sm }}>
        {list.fromPlan ? (
          <Button
            label="Update from meal plan"
            variant="secondary"
            loading={refresh.isPending}
            onPress={() => refresh.mutate({ ...list.fromPlan!, open: false })}
          />
        ) : null}
        {done ? <Button label="Remove ticked items" variant="secondary" onPress={() => store.clearChecked(list.id)} /> : null}
        <Button label="Rename list" variant="ghost" onPress={() => router.push({ pathname: '/lists/edit', params: { listId: list.id } })} />
        <Button
          label="Delete list"
          variant="ghost"
          onPress={() =>
            confirm('Delete this list?', `“${list.name}” will be removed from this phone.`, 'Delete', () => {
              router.back();
              store.remove(list.id);
            })
          }
        />
      </View>
    </Screen>
  );
}
