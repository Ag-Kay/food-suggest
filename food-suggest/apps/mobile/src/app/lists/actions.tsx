import { useLocalSearchParams, useRouter } from 'expo-router';
import { ListChecks, Pencil, RefreshCw, Trash2 } from 'lucide-react-native';
import { ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListGroup, ListRow } from '@/components/ui';
import { rangeLabel } from '@/features/plan/dates';
import { useMakeShoppingList } from '@/features/shopping/use-make-list';
import { useTheme } from '@/hooks/use-theme';
import { useShoppingLists } from '@/stores/shopping-lists';

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

/** List options sheet: update from plan, clear ticked, rename, delete. */
export default function ListActions() {
  const router = useRouter();
  const { colors, layout, space } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const list = useShoppingLists((s) => s.lists.find((l) => l.id === id));
  const refresh = useMakeShoppingList();
  const store = useShoppingLists.getState();

  if (!list) return null;
  const ticked = list.items.filter((i) => i.checked).length;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background, padding: layout.gutter, gap: space.lg }}>
      <ListGroup>
        {list.fromPlan ? (
          <ListRow
            icon={RefreshCw}
            iconColor="link"
            label="Update from meal plan"
            detail={`Meals for ${rangeLabel(list.fromPlan.start, list.fromPlan.end)}. Keeps your ticks and own items.`}
            accessory={refresh.isPending ? <ActivityIndicator /> : undefined}
            onPress={() => refresh.mutate({ ...list.fromPlan!, open: false }, { onSuccess: () => router.back() })}
          />
        ) : null}
        {ticked ? <ListRow icon={ListChecks} label={`Remove ${ticked} ticked item${ticked === 1 ? '' : 's'}`} onPress={() => (store.clearChecked(list.id), router.back())} /> : null}
        <ListRow icon={Pencil} label="Rename list" onPress={() => router.replace({ pathname: '/lists/edit', params: { listId: list.id } })} />
      </ListGroup>
      <ListGroup>
        <ListRow
          icon={Trash2}
          label="Delete list"
          danger
          onPress={() =>
            confirm('Delete this list?', `“${list.name}” will be removed.`, 'Delete', () => {
              router.dismissTo('/lists');
              store.remove(list.id);
            })
          }
        />
      </ListGroup>
    </SafeAreaView>
  );
}
