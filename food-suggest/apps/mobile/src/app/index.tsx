import { View } from 'react-native';

import { AppText, Card, Screen } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const { space } = useTheme();
  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <AppText variant="subhead" color="textSecondary">
          Welcome to
        </AppText>
        <AppText variant="largeTitle">Food Suggest</AppText>
      </View>
      <Card style={{ gap: space.sm }}>
        <AppText variant="headline">Personal meal ideas are on the way</AppText>
        <AppText color="textSecondary">
          Soon you&apos;ll see meals picked for your goals, from waakye to grilled salmon.
        </AppText>
      </Card>
      <AppText variant="footnote" color="textSecondary">
        Food Suggest offers general nutrition information, not medical advice. Nutrition values are
        estimates.
      </AppText>
    </Screen>
  );
}
