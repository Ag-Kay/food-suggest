/**
 * One photo per meal, chosen to show the actual dish where a free photo exists.
 *
 * Sources and licences (checked 2026-11-08):
 * - Wikimedia Commons: CC BY / CC BY-SA. Attribution is REQUIRED: the app shows the credit
 *   and licence on the meal page and on the Credits screen. We display the photo unmodified
 *   (cropped to fit only).
 * - Unsplash: Unsplash License (free, attribution appreciated; we credit anyway).
 * - Pexels: Pexels License (free, attribution appreciated; we credit anyway).
 *
 * `url` is the source's sized thumbnail. `pnpm photos:upload` copies each one to our Supabase
 * Storage bucket; with MEAL_PHOTOS_BASE_URL set, the seed points meals at those copies instead
 * (see `photoUrl`). Credits and licences are unchanged either way.
 */
export interface MealImageSeed {
  url: string;
  width: number;
  height: number;
  alt: string;
  /** "Photographer / Source". */
  credit: string;
  license: 'CC BY-SA 4.0' | 'CC BY 2.0' | 'Unsplash License' | 'Pexels License';
  /** The photo's page at the source (proof of licence, and where the credit links). */
  sourceUrl: string;
}

const commons = (path: string) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/960px-${path.split('/').pop()}`;

export const MEAL_IMAGES: Record<string, MealImageSeed> = {
  'jollof-rice-chicken': {
    url: commons('f/fa/Ghana_Jollof_Rice_with_Chicken.jpg'),
    width: 960,
    height: 1280,
    alt: 'Jollof rice with fried chicken and salad on a plate',
    credit: 'Queen Murja10 / Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=141385421',
  },
  waakye: {
    url: commons('9/94/Waakye101.jpg'),
    width: 960,
    height: 720,
    alt: 'A plate of waakye with its sides',
    credit: 'Xibitgh / Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=136845274',
  },
  'banku-grilled-tilapia': {
    url: commons('b/bf/Grilled_tilapia_with_banku.jpg'),
    width: 960,
    height: 717,
    alt: 'Grilled tilapia with banku, pepper and onions',
    credit: 'sshreeves / Wikimedia Commons',
    license: 'CC BY 2.0',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=23249661',
  },
  'kenkey-fried-fish': {
    url: commons('b/b8/Kenkey_and_fish_10111.jpg'),
    width: 960,
    height: 937,
    alt: 'Kenkey with fried fish and pepper',
    credit: 'Otuo-Akyampong Boakye / Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=101201541',
  },
  'fufu-light-soup-goat': {
    url: commons('c/c1/Fufu_with_light_soup_and_chicken.jpg'),
    width: 960,
    height: 921,
    alt: 'Fufu in light soup with meat',
    credit: 'Edithobayaa1 / Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=103212836',
  },
  'red-red': {
    url: commons('5/58/Beans%2C_Palm_oil%2C_Gari_and_Fried_Plantains.jpg'),
    width: 960,
    height: 720,
    alt: 'Beans stewed in palm oil with fried ripe plantain',
    credit: 'Enock4seth / Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=37057384',
  },
  kelewele: {
    url: commons('5/5c/%E2%80%9CKelewele%E2%80%9D_in_Ghana.jpg'),
    width: 960,
    height: 947,
    alt: 'Spiced fried plantain cubes (kelewele)',
    credit: 'Edithobayaa1 / Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=103212562',
  },
  'groundnut-soup-omo-tuo': {
    url: commons('8/83/Groundnut_Soup.JPG'),
    width: 960,
    height: 720,
    alt: 'A bowl of groundnut soup',
    credit: 'Blackmapapa / Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=35838246',
  },
  'kontomire-stew-plantain': {
    url: commons('0/08/Kontomire_Stew%2C_Eggs_and_Plantian.jpg'),
    width: 960,
    height: 1280,
    alt: 'Kontomire stew with boiled eggs and plantain',
    credit: 'Robertjamal12 / Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=112558601',
  },
  'hausa-koko': {
    url: commons('8/8a/Hausa_Koko_with_bofloat.jpg'),
    width: 960,
    height: 955,
    alt: 'Hausa koko porridge with bofrot',
    credit: 'Edithobayaa1 / Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=103213041',
  },
  'yam-garden-egg-stew': {
    url: commons('d/d6/Boiled_yam_and_garden_egg_stew.jpg'),
    width: 960,
    height: 1280,
    alt: 'Boiled yam with garden egg stew',
    credit: 'Maame1Yaa / Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=129824963',
  },
  'salmon-rice-spinach': {
    url: 'https://images.unsplash.com/photo-1675209705883-7aec595f5aa8?w=1280&q=80&auto=format&fit=crop',
    width: 1280,
    height: 875,
    alt: 'Salmon fillet with rice and greens on a black plate',
    credit: 'Camara Negra / Unsplash',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/a-black-plate-topped-with-salmon-and-broccoli-RZV1-tNbHy4',
  },
  'chicken-avocado-salad': {
    url: 'https://images.unsplash.com/photo-1761315600943-d8a5bb0c499f?w=1280&q=80&auto=format&fit=crop',
    width: 1280,
    height: 1863,
    alt: 'Grilled chicken salad with avocado and tomatoes',
    credit: 'Ani Augustine / Unsplash',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/grilled-chicken-salad-with-avocado-and-tomatoes-9TogNg01qzI',
  },
  'oats-banana-groundnut': {
    url: 'https://images.pexels.com/photos/6050721/pexels-photo-6050721.jpeg?auto=compress&cs=tinysrgb&w=1280',
    width: 1280,
    height: 960,
    alt: 'Bowl of oats with sliced banana and peanut butter',
    credit: 'Vegan Liftz / Pexels',
    license: 'Pexels License',
    sourceUrl: 'https://www.pexels.com/photo/sliced-bananas-in-white-ceramic-bowl-6050721/',
  },
  'spaghetti-sardine-tomato': {
    url: 'https://images.pexels.com/photos/31637791/pexels-photo-31637791.jpeg?auto=compress&cs=tinysrgb&w=1280',
    width: 1280,
    height: 854,
    // No free photo shows sardines: this is spaghetti in tomato sauce. Replace with our own shoot.
    alt: 'Spaghetti in tomato sauce',
    credit: 'Gu Ko / Pexels',
    license: 'Pexels License',
    sourceUrl: 'https://www.pexels.com/photo/delicious-spaghetti-in-tomato-sauce-close-up-31637791/',
  },
};

/** Where the app loads a meal's photo: our own storage when configured, else the source. */
export function photoUrl(slug: string, photo: MealImageSeed, baseUrl = process.env.MEAL_PHOTOS_BASE_URL): string {
  return baseUrl ? `${baseUrl.replace(/\/+$/, '')}/${slug}.jpg` : photo.url;
}
