import { groupInsights, INSIGHTS_LIMIT, ProductSalesRow } from './product-insights';

const product = (changes: Partial<ProductSalesRow>): ProductSalesRow => ({
  id: 1,
  name: 'Gansito',
  code: '750100',
  stock: 10,
  price: 10,
  priceSell: 15,
  image: 'gansito.png',
  description: 'Pastelito',
  categoryId: 1,
  providerId: 1,
  sold: 0,
  lastSale: null,
  ...changes,
});

describe('groupInsights', () => {
  it('flags a product sold at or below its cost, the biggest loss first', () => {
    const { belowCost } = groupInsights([
      product({ id: 1, name: 'Even', price: 10, priceSell: 10 }),
      product({ id: 2, name: 'Loss', price: 10, priceSell: 6 }),
      product({ id: 3, name: 'Fine', price: 10, priceSell: 12 }),
      //No purchase price: not known to lose money
      product({ id: 4, name: 'Unknown', price: 0, priceSell: 0 }),
    ]);

    expect(belowCost.items.map(item => [item.name, item.margin])).toEqual([
      ['Loss', -4],
      ['Even', 0],
    ]);
  });

  it('lists stock without sales in the window, the most money sitting still first', () => {
    const lastSale = new Date('2026-08-01');
    const { noRecentSales } = groupInsights([
      product({ id: 1, name: 'Cheap', stock: 10, price: 5 }),
      product({ id: 2, name: 'Pricey', stock: 4, price: 50, lastSale }),
      product({ id: 3, name: 'Selling', stock: 4, sold: 3 }),
      product({ id: 4, name: 'Empty', stock: 0 }),
    ]);

    expect(noRecentSales.items.map(item => [item.name, item.stockValue, item.lastSale])).toEqual([
      ['Pricey', 200, lastSale],
      ['Cheap', 50, null],
    ]);
  });

  it('works out the days left at the current pace and keeps the ones about to run out', () => {
    const { runningOut } = groupInsights([
      //30 sold in 30 days: one a day
      product({ id: 1, name: 'Three days', stock: 3, sold: 30 }),
      product({ id: 2, name: 'Twenty days', stock: 20, sold: 30 }),
      product({ id: 3, name: 'Gone', stock: 0, sold: 5 }),
      product({ id: 4, name: 'Oversold', stock: -2, sold: 5 }),
    ]);

    expect(runningOut.items.map(item => [item.name, item.daysLeft])).toEqual([
      ['Oversold', 0],
      ['Gone', 0],
      ['Three days', 3],
    ]);
  });

  it('says what each incomplete product is missing, the most incomplete first', () => {
    const { incomplete } = groupInsights([
      product({ id: 1, name: 'Complete' }),
      product({ id: 2, name: 'Bare', categoryId: null, providerId: null, image: '', description: '  ' }),
      product({ id: 3, name: 'No provider', providerId: null }),
    ]);

    expect(incomplete.items.map(item => [item.name, item.missing])).toEqual([
      ['Bare', ['category', 'provider', 'image', 'description']],
      ['No provider', ['provider']],
    ]);
  });

  it('lists a few per group but counts all of them', () => {
    const rows = Array.from({ length: INSIGHTS_LIMIT + 5 }, (_, index) =>
      product({ id: index, name: `P${index}`, providerId: null })
    );

    const { incomplete } = groupInsights(rows);

    expect(incomplete.total).toBe(INSIGHTS_LIMIT + 5);
    expect(incomplete.items).toHaveLength(INSIGHTS_LIMIT);
  });
});
