import { useRouter } from 'expo-router';

import { Button } from '@/components/ui';
import { isAuthConfigured } from '@/lib/supabase';
import { useIsSignedIn } from '@/stores/auth';

import { useIsFavorite, useToggleFavorite } from './api';

/** Save / Saved toggle. Signed-out users are invited to sign in. */
export function SaveMealButton({ slug }: { slug: string }) {
  const router = useRouter();
  const signedIn = useIsSignedIn();
  const saved = useIsFavorite(slug);
  const toggle = useToggleFavorite();

  if (!isAuthConfigured) return null;
  if (!signedIn) {
    return <Button label="Sign in to save this meal" variant="secondary" onPress={() => router.push('/sign-in')} />;
  }
  return (
    <Button
      label={saved ? 'Saved ✓' : 'Save meal'}
      variant={saved ? 'secondary' : 'primary'}
      loading={toggle.isPending}
      accessibilityState={{ selected: saved }}
      onPress={() => toggle.mutate({ slug, save: !saved })}
    />
  );
}
