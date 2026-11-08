import {
  Apple,
  Banana,
  Bean,
  Carrot,
  Cookie,
  Droplet,
  Drumstick,
  Egg,
  Fish,
  Flame,
  Moon,
  Package,
  PenLine,
  ShoppingBasket,
  Sun,
  Sunrise,
  Wheat,
  type LucideIcon,
} from 'lucide-react-native';

import type { MealSlot } from '@food-suggest/shared';

/** One icon per meal of the day, used wherever slots appear. */
export const SLOT_ICONS: Record<MealSlot, LucideIcon> = { BREAKFAST: Sunrise, LUNCH: Sun, DINNER: Moon, SNACK: Cookie };


/** Shopping aisle → icon. Unknown aisles get a basket. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Vegetables: Carrot,
  Fruit: Apple,
  'Tubers & plantain': Banana,
  'Meat & poultry': Drumstick,
  'Fish & seafood': Fish,
  'Dairy & eggs': Egg,
  'Grains & flours': Wheat,
  'Beans, nuts & seeds': Bean,
  'Canned & jarred': Package,
  Oils: Droplet,
  'Spices & seasonings': Flame,
  'Added by you': PenLine,
};

export const categoryIcon = (category: string): LucideIcon => CATEGORY_ICONS[category] ?? ShoppingBasket;
