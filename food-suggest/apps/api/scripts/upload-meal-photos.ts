/**
 * Copies every meal photo in prisma/seed/images.ts into our own Supabase Storage bucket, so the
 * app no longer loads images from Wikimedia, Unsplash or Pexels (their CDNs can change or
 * rate-limit, and hot-linking is discouraged). Credits and licences stay in the seed.
 *
 * Photos land at  <bucket>/<meal-slug>.jpg  in a PUBLIC bucket (the photos are public anyway).
 * After uploading, set MEAL_PHOTOS_BASE_URL in .env to the printed value and re-run the seed.
 *
 * Usage: pnpm photos:upload [--force]   (needs SUPABASE_URL and SUPABASE_SECRET_KEY in .env)
 */
import { createClient } from '@supabase/supabase-js';

import { MEAL_IMAGES } from '../prisma/seed/images.js';

export const MEAL_PHOTOS_BUCKET = 'meal-photos';
const MAX_BYTES = 5 * 1024 * 1024;
const force = process.argv.includes('--force');

try {
  process.loadEnvFile();
} catch {
  // no .env
}

const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !secretKey) {
  console.error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in apps/api/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(MEAL_PHOTOS_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(MEAL_PHOTOS_BUCKET, {
    public: true,
    allowedMimeTypes: ['image/jpeg'],
    fileSizeLimit: MAX_BYTES,
  });
  if (error) throw new Error(`Couldn't create the bucket: ${error.message}`);
  console.log(`Created public bucket "${MEAL_PHOTOS_BUCKET}"`);
}

async function existing(): Promise<Set<string>> {
  const { data, error } = await supabase.storage.from(MEAL_PHOTOS_BUCKET).list('', { limit: 1000 });
  if (error) throw new Error(`Couldn't list the bucket: ${error.message}`);
  return new Set(data.map((f) => f.name));
}

async function download(url: string, attempt = 1): Promise<Uint8Array> {
  // Wikimedia asks automated clients to identify themselves.
  const res = await fetch(url, { headers: { 'User-Agent': 'FoodSuggestPhotoCopy/1.0 (one-off copy of credited meal photos)' } });
  if (res.status === 429 && attempt < 5) {
    // Rate limited: wait as asked (or back off) and try again.
    const wait = Math.min(Number(res.headers.get('retry-after')) || 5 * attempt, 60);
    console.log(`  rate limited, retrying in ${wait}s`);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return download(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/jpeg')) throw new Error(`expected a JPEG, got "${type}"`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) throw new Error(`too large (${bytes.byteLength} bytes)`);
  return bytes;
}

await ensureBucket();
const already = await existing();
let failed = 0;

for (const [slug, photo] of Object.entries(MEAL_IMAGES)) {
  const name = `${slug}.jpg`;
  if (already.has(name) && !force) {
    console.log(`= ${name} (already uploaded)`);
    continue;
  }
  try {
    const bytes = await download(photo.url);
    const { error } = await supabase.storage
      .from(MEAL_PHOTOS_BUCKET)
      .upload(name, bytes, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' });
    if (error) throw new Error(error.message);
    console.log(`✓ ${name} (${Math.round(bytes.byteLength / 1024)} KB)`);
  } catch (err) {
    failed++;
    console.error(`✗ ${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
  await new Promise((r) => setTimeout(r, 1500)); // be gentle with the source sites
}

const base = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${MEAL_PHOTOS_BUCKET}`;
console.log(`\nMEAL_PHOTOS_BASE_URL=${base}`);
if (failed) {
  console.error(`${failed} photo(s) failed. Fix and re-run; uploaded ones are skipped.`);
  process.exit(1);
}
