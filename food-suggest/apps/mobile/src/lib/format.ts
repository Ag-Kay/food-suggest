const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾', '0.33': '⅓', '0.67': '⅔' };

/** 0.5 → "½", 1.5 → "1½", 400 → "400", 2.25 → "2¼", 0.2 → "0.2". */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '';
  const whole = Math.floor(value);
  const fraction = Math.round((value - whole) * 100) / 100;
  if (fraction === 0) return String(whole);
  const symbol = FRACTIONS[String(fraction)];
  if (!symbol) return String(Math.round(value * 10) / 10);
  return whole ? `${whole}${symbol}` : symbol;
}

/** "2 piece" → "2 pieces"; grams stay "400 g". */
export function formatIngredientAmount(quantity: number, unit: string): string {
  const q = formatQuantity(quantity);
  if (unit === 'g' || unit === 'ml') return `${q} ${unit}`;
  const plural = quantity > 1 && unit === 'piece' ? 'pieces' : unit;
  return `${q} ${plural}`;
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatGrams(value: number | null): string {
  if (value == null) return '–';
  return `${Math.round(value)} g`;
}
