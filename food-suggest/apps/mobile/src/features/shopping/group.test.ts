import { MANUAL_CATEGORY, type ShoppingItem } from '@/stores/shopping-lists';

import { groupByCategory } from './group';

const item = (name: string, category: string): ShoppingItem => ({
  id: name,
  name,
  amountText: '',
  category,
  checked: false,
  source: category === MANUAL_CATEGORY ? 'MANUAL' : 'GENERATED',
});

describe('groupByCategory', () => {
  it('orders aisles like a shop and puts your own items last', () => {
    const sections = groupByCategory([
      item('Soap', MANUAL_CATEGORY),
      item('Salt', 'Spices & seasonings'),
      item('Onion', 'Vegetables'),
      item('Tomato', 'Vegetables'),
      item('Rice', 'Grains & flours'),
    ]);
    expect(sections.map((s) => s.category)).toEqual(['Vegetables', 'Grains & flours', 'Spices & seasonings', MANUAL_CATEGORY]);
    expect(sections[0]!.items.map((i) => i.name)).toEqual(['Onion', 'Tomato']);
  });
});
