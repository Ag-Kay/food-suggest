import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';

import { IconButton } from '@/components/ui';
import { useIsFavorite, useToggleFavorite } from '@/features/account/api';
import { useTheme } from '@/hooks/use-theme';
import { isAuthConfigured } from '@/lib/supabase';
import { useIsSignedIn } from '@/stores/auth';

type Props = { slug: string; name: string; tone?: 'onImage' | 'surface' };

/**
 * Heart toggle for photos and headers. Saving needs an account: signed-out users
 * are taken to sign-in. Hidden when this build has no sign-in configured.
 */
export function FavoriteButton(props: Props) {
  // A build without sign-in has no favourites (and no query client work to do).
  return isAuthConfigured ? <FavoriteToggle {...props} /> : null;
}

function FavoriteToggle({ slug, name, tone = 'onImage' }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const signedIn = useIsSignedIn();
  const saved = useIsFavorite(slug);
  const toggle = useToggleFavorite();

  return (
    <IconButton
      icon={Heart}
      tone={tone}
      active={signedIn && saved}
      activeColor={colors.danger}
      label={!signedIn ? `Sign in to save ${name}` : saved ? `Remove ${name} from saved meals` : `Save ${name}`}
      accessibilityState={{ selected: signedIn && saved, busy: toggle.isPending }}
      disabled={toggle.isPending}
      onPress={() => (signedIn ? toggle.mutate({ slug, save: !saved }) : router.push('/sign-in'))}
    />
  );
}
