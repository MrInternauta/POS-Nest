/** Sales are read over this many days to tell how a product is moving */
export const SALES_WINDOW_DAYS = 30;

/** A product that runs out within this many days at its current pace needs ordering */
export const RUNNING_OUT_DAYS = 7;

/** At or below this stock a product is low, for the stock alerts */
export const LOW_STOCK = 5;

/** Each group lists at most this many, `total` still counts all of them */
export const INSIGHTS_LIMIT = 10;

/** A product as the insights query reads it */
export interface ProductSalesRow {
  id: number;
  name: string;
  code: string;
  stock: number;
  price: number;
  priceSell: number;
  image: string;
  description: string;
  categoryId: number | null;
  providerId: number | null;
  /** Units sold within the window */
  sold: number;
  /** The last sale ever, null when it never sold */
  lastSale: Date | null;
}

export type MissingField = 'category' | 'provider' | 'image' | 'description';

export interface InsightProduct {
  id: number;
  name: string;
  code: string;
  stock: number;
  price: number;
  priceSell: number;
}

export interface InsightGroup<T> {
  total: number;
  items: T[];
}

export interface ProductInsights {
  windowDays: number;
  runningOutDays: number;
  /** Selling at or below what it costs */
  belowCost: InsightGroup<InsightProduct & { margin: number }>;
  /** Stock sitting on the shelf without a sale in the window */
  noRecentSales: InsightGroup<InsightProduct & { lastSale: Date | null; stockValue: number }>;
  /** Selling, and gone within `runningOutDays` at the current pace */
  runningOut: InsightGroup<InsightProduct & { sold: number; daysLeft: number }>;
  /** Missing what a product page and the reports use */
  incomplete: InsightGroup<InsightProduct & { missing: MissingField[] }>;
}

const group = <T>(items: T[]): InsightGroup<T> => ({ total: items.length, items: items.slice(0, INSIGHTS_LIMIT) });

const base = (row: ProductSalesRow): InsightProduct => ({
  id: row.id,
  name: row.name,
  code: row.code,
  stock: row.stock,
  price: row.price,
  priceSell: row.priceSell,
});

/** Turns the products and their recent sales into what is worth looking at, worst first in each group */
export function groupInsights(rows: ProductSalesRow[]): ProductInsights {
  const belowCost = rows
    //A product without a purchase price is not known to lose money
    .filter(row => row.price > 0 && row.priceSell <= row.price)
    .map(row => ({ ...base(row), margin: row.priceSell - row.price }))
    .sort((a, b) => a.margin - b.margin || a.name.localeCompare(b.name));

  const noRecentSales = rows
    .filter(row => row.stock > 0 && row.sold === 0)
    .map(row => ({ ...base(row), lastSale: row.lastSale, stockValue: row.stock * row.price }))
    //The money sitting still comes first
    .sort((a, b) => b.stockValue - a.stockValue || a.name.localeCompare(b.name));

  const runningOut = rows
    .filter(row => row.sold > 0)
    .map(row => ({
      ...base(row),
      sold: row.sold,
      //One decimal is enough to tell today from tomorrow
      daysLeft: Math.max(0, Math.round((row.stock / (row.sold / SALES_WINDOW_DAYS)) * 10) / 10),
    }))
    .filter(row => row.daysLeft <= RUNNING_OUT_DAYS)
    //An oversold product (negative stock) is worse off than one at zero
    .sort((a, b) => a.daysLeft - b.daysLeft || a.stock - b.stock || b.sold - a.sold);

  const incomplete = rows
    .map(row => ({ ...base(row), missing: missingFields(row) }))
    .filter(row => row.missing.length)
    .sort((a, b) => b.missing.length - a.missing.length || a.name.localeCompare(b.name));

  return {
    windowDays: SALES_WINDOW_DAYS,
    runningOutDays: RUNNING_OUT_DAYS,
    belowCost: group(belowCost),
    noRecentSales: group(noRecentSales),
    runningOut: group(runningOut),
    incomplete: group(incomplete),
  };
}

function missingFields(row: ProductSalesRow): MissingField[] {
  const missing: MissingField[] = [];
  if (!row.categoryId) missing.push('category');
  if (!row.providerId) missing.push('provider');
  if (!row.image?.trim()) missing.push('image');
  if (!row.description?.trim()) missing.push('description');
  return missing;
}
