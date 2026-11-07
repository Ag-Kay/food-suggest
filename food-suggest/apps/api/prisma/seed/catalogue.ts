/** Reference data: nutrition sources, cuisines and categories. */

export const SOURCES = [
  {
    slug: 'wafct-2019',
    name: 'FAO/INFOODS Food Composition Table for Western Africa (2019)',
    url: 'https://www.fao.org/infoods/infoods/tables-and-databases/africa/en/',
    license:
      '© FAO 2020. Free for private study, research, teaching and non-commercial use with acknowledgement. Commercial use requires a licence from FAO (www.fao.org/contact-us/licence-request, copyright@fao.org).',
    citation:
      'Vincent A. et al. (2020). FAO/INFOODS Food Composition Table for Western Africa (2019). Rome, FAO.',
    // Not cleared until FAO grants a commercial licence. See docs/APP_STORE_RISKS.md.
    commercialUseCleared: false,
  },
  {
    slug: 'usda-fdc',
    name: 'USDA FoodData Central',
    url: 'https://fdc.nal.usda.gov/',
    license: 'Public domain (CC0 1.0). Attribution requested.',
    citation:
      'U.S. Department of Agriculture, Agricultural Research Service. FoodData Central. fdc.nal.usda.gov.',
    commercialUseCleared: true,
  },
] as const;

export type SourceSlug = (typeof SOURCES)[number]['slug'];

export const CUISINES = [
  { slug: 'ghanaian', name: 'Ghanaian', countryCode: 'GH' },
  { slug: 'international', name: 'International', countryCode: null },
] as const;

export type CuisineSlug = (typeof CUISINES)[number]['slug'];

export const CATEGORIES = [
  { slug: 'rice-dishes', name: 'Rice dishes' },
  { slug: 'soups-and-stews', name: 'Soups & stews' },
  { slug: 'swallows', name: 'Fufu, banku & kenkey' },
  { slug: 'beans-and-legumes', name: 'Beans & legumes' },
  { slug: 'fish-and-seafood', name: 'Fish & seafood' },
  { slug: 'salads', name: 'Salads' },
  { slug: 'pasta', name: 'Pasta' },
  { slug: 'porridges', name: 'Porridges' },
  { slug: 'snacks', name: 'Snacks' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];
