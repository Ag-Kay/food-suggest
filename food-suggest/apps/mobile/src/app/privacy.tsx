import { CloudUpload, Smartphone, Trash2, UserRoundCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText, Icon, Screen, type LucideIcon } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

function Point({ icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  const { colors, radius, space } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: space.md }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Icon icon={icon} color="link" />
      </View>
      <View style={{ flex: 1, gap: space.xs }}>
        <AppText variant="headline">{title}</AppText>
        <AppText color="textSecondary">{body}</AppText>
      </View>
    </View>
  );
}

/** Plain-language summary of where data lives (the full privacy policy comes with M6). */
export default function PrivacyScreen() {
  const { space } = useTheme();
  return (
    <Screen edges={['left', 'right']} gap={space.xl}>
      <Point
        icon={Smartphone}
        title="Stored on this phone"
        body="Your answers, recently viewed meals, meal plan and shopping lists are kept on this phone."
      />
      <Point
        icon={UserRoundCheck}
        title="Used, not saved, without an account"
        body="Your answers are sent to Food Suggest only to pick suggestions, and planned meals only to build shopping lists. Neither is saved on our servers."
      />
      <Point
        icon={CloudUpload}
        title="Synced when you're signed in"
        body="Your meal plan, shopping lists and saved meals are kept in your account so you can use them on other phones. Your preferences sync only if you agree."
      />
      <Point
        icon={Trash2}
        title="You're in control"
        body="Clear this phone's data in Profile at any time, or delete your account and everything in it."
      />
    </Screen>
  );
}
