import { ReportData } from '../reports.service';
import { buildReportDocument, change, periodLabel, renderPdf } from './report-pdf';

//Noon in Mexico City, so the store date is the same whatever the machine's zone
const noon = (date: string) => new Date(`${date}T18:00:00Z`);

const data = (changes: Partial<ReportData> = {}): ReportData => ({
  generatedAt: noon('2026-10-13'),
  summary: {
    period: 'month',
    current: {
      from: noon('2026-10-01'),
      to: noon('2026-10-13'),
      revenue: 1200,
      profit: 300,
      orders: 20,
      averageTicket: 60,
    },
    previous: {
      from: noon('2026-09-01'),
      to: noon('2026-09-13'),
      revenue: 1000,
      profit: 0,
      orders: 20,
      averageTicket: 50,
    },
  },
  topProducts: [{ id: 1, name: 'Gansito', image: '', quantity: 12, revenue: 180, profit: 60 }],
  monthly: [
    { month: '2026-09', revenue: 1000, profit: 0, orders: 20, averageTicket: 50 },
    { month: '2026-10', revenue: 1200, profit: 300, orders: 20, averageTicket: 60 },
  ],
  stock: { threshold: 5, total: 1, products: [{ id: 2, name: 'Leche', code: '7501', stock: 0 }] },
  ...changes,
});

/** Every text the document would print, flattened, to look for one */
const texts = (node: unknown): string[] => {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  if (node && typeof node === 'object') return Object.values(node).flatMap(texts);
  return [];
};

describe('report pdf', () => {
  it('names the period the way someone would say it', () => {
    const range = { from: noon('2026-10-12'), to: noon('2026-10-14') };

    expect(periodLabel('day', range)).toBe('14 de octubre de 2026');
    expect(periodLabel('week', range)).toBe('Del 12 de octubre al 14 de octubre de 2026');
    expect(periodLabel('month', range)).toBe('Octubre de 2026, al día 14');
  });

  it('compares with the previous period, and says nothing when there is nothing to compare with', () => {
    expect(change(1200, 1000)).toBe(20);
    expect(change(800, 1000)).toBe(-20);
    expect(change(500, 0)).toBeNull();
  });

  it('prints the figures, the best sellers and what ran out', () => {
    const printed = texts(buildReportDocument(data()).content).join('\n');

    expect(printed).toContain('$1,200');
    expect(printed).toContain('+20%');
    expect(printed).toContain('Sin datos para comparar');
    expect(printed).toContain('Gansito');
    expect(printed).toContain('Agotado');
  });

  it('says so when there were no sales or nothing is running low', () => {
    const printed = texts(
      buildReportDocument(data({ topProducts: [], stock: { threshold: 5, total: 0, products: [] } })).content
    ).join('\n');

    expect(printed).toContain('Sin ventas en este periodo.');
    expect(printed).toContain('Ningún producto tiene 5 existencias o menos.');
  });

  it('renders a pdf without reading anything from disk or the network', async () => {
    const file = await renderPdf(buildReportDocument(data()));

    expect(file.subarray(0, 5).toString()).toBe('%PDF-');
    expect(file.length).toBeGreaterThan(5000);
  });
});
