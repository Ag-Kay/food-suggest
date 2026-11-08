import { createClient } from '@supabase/supabase-js';

/** Server-side Supabase Auth admin operations. */
export interface AuthAdmin {
  deleteUser(userId: string): Promise<void>;
}

export function createSupabaseAuthAdmin(supabaseUrl: string, secretKey: string): AuthAdmin {
  const client = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return {
    async deleteUser(userId) {
      const { error } = await client.auth.admin.deleteUser(userId);
      // Already gone counts as success (e.g. a retried deletion).
      if (error && error.status !== 404) throw new Error(`Auth user deletion failed: ${error.message}`);
    },
  };
}
