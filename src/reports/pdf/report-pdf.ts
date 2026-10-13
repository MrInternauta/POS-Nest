import * as pdfmake from 'pdfmake';
import type { Content, TableCell, TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';

import { Period } from '../dtos/reports.dto';
import { MonthTotals, PeriodTotals, ReportData, STORE_TIMEZONE, TopProduct } from '../reports.service';
import { LOGO_SVG } from './logo';

//The logo's purple, so the report reads as the app's
const COLOR = {
  brand: '#8231D3',
  brandSoft: '#E4D6F8',
  brandTint: '#F7F2FD',
  text: '#1F1F1F',
  muted: '#6B6B76',
  line: '#E6E3EC',
  up: '#15803D',
  down: '#DC2626',
  warn: '#C2410C',
};

const PAGE_WIDTH = 595.28;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const count = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
//Dates are written in the store's own zone, each store may be in a different one
const inZone = (timeZone: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-MX', { timeZone, ...options });

const PERIOD_TITLE: Record<Period, string> = {
  day: 'Reporte del día',
  week: 'Reporte de la semana',
  month: 'Reporte del mes',
};

const COMPARED_WITH: Record<Period, string> = {
  day: 'vs. ayer a esta hora',
  week: 'vs. la semana pasada',
  month: 'vs. el mes pasado',
};

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase('es-MX') + text.slice(1);

/** $12.3k under a bar, a full amount would not fit twelve across */
const shortMoney = (value: number) =>
  value >= 1000 ? `$${(value / 1000).toFixed(value >= 100_000 ? 0 : 1)}k` : money.format(value);

/** What the period covers, in the words someone would say it */
export function periodLabel(
  period: Period,
  current: Pick<PeriodTotals, 'from' | 'to'>,
  timeZone = STORE_TIMEZONE
): string {
  const from = new Date(current.from);
  const to = new Date(current.to);
  const longDate = inZone(timeZone, { day: 'numeric', month: 'long', year: 'numeric' });
  if (period === 'day') return capitalize(longDate.format(to));
  if (period === 'week') {
    return `Del ${inZone(timeZone, { day: 'numeric', month: 'long' }).format(from)} al ${longDate.format(to)}`;
  }
  const month = inZone(timeZone, { month: 'long', year: 'numeric' }).format(to);
  return `${capitalize(month)}, al día ${inZone(timeZone, { day: 'numeric' }).format(to)}`;
}

/** Percent change, null when there is nothing to compare with */
export function change(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function kpi(label: string, value: string, delta: number | null, comparedWith: string): TableCell {
  const deltaText: Content =
    delta === null
      ? { text: 'Sin datos para comparar', color: COLOR.muted }
      : {
          text: [
            //Roboto has no arrow triangles, the sign and the color carry the direction
            {
              text: `${delta >= 0 ? '+' : '−'}${Math.abs(delta)}%`,
              color: delta >= 0 ? COLOR.up : COLOR.down,
              bold: true,
            },
            { text: ` ${comparedWith}`, color: COLOR.muted },
          ],
        };

  return {
    fillColor: COLOR.brandTint,
    margin: [10, 9, 10, 9],
    stack: [
      { text: label.toLocaleUpperCase('es-MX'), fontSize: 7.5, color: COLOR.muted, characterSpacing: 0.6 },
      { text: value, fontSize: 17, bold: true, color: COLOR.text, margin: [0, 3, 0, 3] },
      { ...deltaText, fontSize: 7.5 } as Content,
    ],
  };
}

function kpis(data: ReportData): Content {
  const { current, previous, period } = data.summary;
  const comparedWith = COMPARED_WITH[period];
  return {
    table: {
      widths: ['*', '*', '*', '*'],
      body: [
        [
          kpi('Ventas', money.format(current.revenue), change(current.revenue, previous.revenue), comparedWith),
          kpi('Ganancia', money.format(current.profit), change(current.profit, previous.profit), comparedWith),
          kpi('Órdenes', count.format(current.orders), change(current.orders, previous.orders), comparedWith),
          kpi(
            'Ticket promedio',
            money.format(current.averageTicket),
            change(current.averageTicket, previous.averageTicket),
            comparedWith
          ),
        ],
      ],
    },
    //White gaps between the cards instead of lines
    layout: {
      hLineWidth: () => 0,
      vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length ? 0 : 6),
      vLineColor: () => '#FFFFFF',
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

/** A title and what it introduces never end up on different pages; the longest one is 15 rows */
function section(title: string, note: string, body: Content): Content {
  return { unbreakable: true, stack: [sectionTitle(title, note), body] };
}

function sectionTitle(text: string, note?: string): Content {
  return {
    margin: [0, 22, 0, 8],
    columns: [
      { text, fontSize: 12, bold: true, color: COLOR.text, width: 'auto' },
      note ? { text: note, fontSize: 8, color: COLOR.muted, alignment: 'right', margin: [0, 3, 0, 0] } : { text: '' },
    ],
  };
}

/** Twelve bars drawn as shapes, the month that is running in the brand color */
export function monthlyChart(months: MonthTotals[]): Content {
  const height = 120;
  const slot = CONTENT_WIDTH / Math.max(months.length, 1);
  const barWidth = Math.min(28, slot * 0.62);
  const max = Math.max(...months.map(month => month.revenue), 0);
  const label = inZone('UTC', { month: 'short' });

  const bars = months.map((month, index) => {
    const barHeight = max ? Math.max((month.revenue / max) * height, month.revenue ? 2 : 0) : 0;
    return {
      type: 'rect' as const,
      x: index * slot + (slot - barWidth) / 2,
      y: height - barHeight,
      w: barWidth,
      h: barHeight,
      r: 3,
      color: index === months.length - 1 ? COLOR.brand : COLOR.brandSoft,
    };
  });

  const row = (cells: string[], options: Partial<{ color: string; bold: boolean }>) => ({
    columns: cells.map(text => ({ text, width: slot, alignment: 'center' as const, fontSize: 7.5, ...options })),
    columnGap: 0,
  });

  return {
    unbreakable: true,
    stack: [
      {
        canvas: [
          //Quarter lines so a bar can be read against something
          ...[0, 0.25, 0.5, 0.75].map(step => ({
            type: 'line' as const,
            x1: 0,
            y1: height * step,
            x2: CONTENT_WIDTH,
            y2: height * step,
            lineWidth: 0.5,
            lineColor: COLOR.line,
            dash: { length: 2 },
          })),
          ...bars,
          { type: 'line', x1: 0, y1: height, x2: CONTENT_WIDTH, y2: height, lineWidth: 1, lineColor: COLOR.muted },
        ],
      },
      {
        margin: [0, 4, 0, 0],
        ...row(
          //YYYY-MM read as the first of the month in UTC, so the name never shifts a month
          months.map(month => label.format(new Date(`${month.month}-01T12:00:00Z`)).replace('.', '')),
          { color: COLOR.text, bold: true }
        ),
      },
      {
        margin: [0, 1, 0, 0],
        ...row(
          months.map(month => (month.revenue ? shortMoney(month.revenue) : '—')),
          { color: COLOR.muted }
        ),
      },
      max
        ? { text: '' }
        : { text: 'Todavía no hay ventas registradas', color: COLOR.muted, fontSize: 9, margin: [0, 6, 0, 0] },
    ],
  };
}

const header = (text: string, alignment: 'left' | 'right' = 'left'): TableCell => ({
  text,
  bold: true,
  color: '#FFFFFF',
  fillColor: COLOR.brand,
  fontSize: 8,
  alignment,
  margin: [0, 2, 0, 2],
});

//Thin rows with a tint every other one, no vertical lines
const zebra = {
  hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === node.table.body.length ? 1 : 0),
  vLineWidth: () => 0,
  hLineColor: () => COLOR.line,
  fillColor: (row: number) => (row > 0 && row % 2 === 0 ? COLOR.brandTint : null),
  paddingLeft: () => 6,
  paddingRight: () => 6,
  paddingTop: () => 5,
  paddingBottom: () => 5,
};

export function topProductsTable(products: TopProduct[]): Content {
  if (!products.length) {
    return { text: 'Sin ventas en este periodo.', color: COLOR.muted, fontSize: 9 };
  }

  const totals = products.reduce(
    (sum, product) => ({
      quantity: sum.quantity + product.quantity,
      revenue: sum.revenue + product.revenue,
      profit: sum.profit + product.profit,
    }),
    { quantity: 0, revenue: 0, profit: 0 }
  );
  const margin = (profit: number, revenue: number) => (revenue ? `${Math.round((profit / revenue) * 100)}%` : '—');

  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: [16, '*', 50, 70, 70, 44],
      body: [
        [
          header('#'),
          header('Producto'),
          header('Unidades', 'right'),
          header('Ventas', 'right'),
          header('Ganancia', 'right'),
          header('Margen', 'right'),
        ],
        ...products.map((product, index) => [
          { text: String(index + 1), color: COLOR.muted },
          { text: product.name, color: COLOR.text },
          { text: count.format(product.quantity), alignment: 'right' as const },
          { text: money.format(product.revenue), alignment: 'right' as const },
          {
            text: money.format(product.profit),
            alignment: 'right' as const,
            color: product.profit < 0 ? COLOR.down : COLOR.text,
          },
          { text: margin(product.profit, product.revenue), alignment: 'right' as const, color: COLOR.muted },
        ]),
        [
          { text: '' },
          { text: 'Total', bold: true },
          { text: count.format(totals.quantity), alignment: 'right' as const, bold: true },
          { text: money.format(totals.revenue), alignment: 'right' as const, bold: true },
          { text: money.format(totals.profit), alignment: 'right' as const, bold: true },
          { text: margin(totals.profit, totals.revenue), alignment: 'right' as const, bold: true },
        ],
      ],
    },
    layout: zebra,
    fontSize: 8.5,
  };
}

export function stockTable(stock: ReportData['stock']): Content {
  if (!stock.total) {
    return { text: `Ningún producto tiene ${stock.threshold} existencias o menos.`, color: COLOR.muted, fontSize: 9 };
  }

  const rest = stock.total - stock.products.length;
  return {
    stack: [
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: ['*', 110, 80],
          body: [
            [header('Producto'), header('Código'), header('Existencias', 'right')],
            ...stock.products.map(product => [
              { text: product.name, color: COLOR.text },
              { text: product.code, color: COLOR.muted },
              product.stock <= 0
                ? { text: 'Agotado', alignment: 'right' as const, color: COLOR.down, bold: true }
                : { text: count.format(product.stock), alignment: 'right' as const, color: COLOR.warn, bold: true },
            ]),
          ],
        },
        layout: zebra,
        fontSize: 8.5,
      },
      rest > 0
        ? { text: `y ${count.format(rest)} productos más`, color: COLOR.muted, fontSize: 8, margin: [0, 4, 0, 0] }
        : { text: '' },
    ],
  };
}

/** The whole report: header, figures, monthly sales, best sellers and stock to reorder */
export function buildReportDocument(data: ReportData): TDocumentDefinitions {
  const { period, current } = data.summary;
  const stamp = inZone(data.timezone, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const generated = `Generado el ${stamp.format(data.generatedAt)}`;

  return {
    pageSize: 'A4',
    pageMargins: [MARGIN, MARGIN, MARGIN, 50],
    info: { title: `${PERIOD_TITLE[period]} · MiniPOS`, author: 'MiniPOS', creator: 'MiniPOS' },
    defaultStyle: { font: 'Roboto', fontSize: 9, color: COLOR.text, lineHeight: 1.15 },
    footer: (page, pages) => ({
      margin: [MARGIN, 14, MARGIN, 0],
      columns: [
        { text: `MiniPOS · ${PERIOD_TITLE[period]}`, fontSize: 7.5, color: COLOR.muted },
        { text: `Página ${page} de ${pages}`, fontSize: 7.5, color: COLOR.muted, alignment: 'right' },
      ],
    }),
    content: [
      {
        columns: [
          { svg: LOGO_SVG, width: 124 },
          {
            width: '*',
            alignment: 'right',
            stack: [
              { text: PERIOD_TITLE[period], fontSize: 18, bold: true, color: COLOR.text },
              { text: data.storeName, fontSize: 11, bold: true, color: COLOR.muted, margin: [0, 2, 0, 0] },
              {
                text: periodLabel(period, current, data.timezone),
                fontSize: 10,
                color: COLOR.brand,
                margin: [0, 2, 0, 0],
              },
              { text: generated, fontSize: 7.5, color: COLOR.muted, margin: [0, 3, 0, 0] },
            ],
          },
        ],
      },
      {
        canvas: [{ type: 'rect', x: 0, y: 0, w: CONTENT_WIDTH, h: 2, color: COLOR.brand }],
        margin: [0, 12, 0, 16],
      },
      kpis(data),
      section('Ventas por mes', 'Últimos 12 meses', monthlyChart(data.monthly)),
      section('Productos más vendidos', 'Por ventas en el periodo', topProductsTable(data.topProducts)),
      section('Inventario por resurtir', `${data.stock.threshold} existencias o menos`, stockTable(data.stock)),
    ],
  };
}

let fontsReady = false;

/**
 * Roboto comes from pdfmake's own font module rather than its .ttf files: a required module is
 * always bundled into the Vercel function, a file read from disk at runtime may not be.
 */
function loadFonts() {
  if (fontsReady) return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const roboto = require('pdfmake/build/fonts/Roboto.js') as {
    vfs: Record<string, { data: string }>;
    fonts: TFontDictionary;
  };
  const virtualfs = (pdfmake as unknown as { virtualfs: { writeFileSync(name: string, content: Buffer): void } })
    .virtualfs;
  for (const [name, file] of Object.entries(roboto.vfs)) {
    virtualfs.writeFileSync(name, Buffer.from(file.data, 'base64'));
  }
  pdfmake.setFonts(roboto.fonts);
  //Everything the report draws is in the document itself, nothing is read from disk or the network
  pdfmake.setUrlAccessPolicy(() => false);
  pdfmake.setLocalAccessPolicy(() => false);
  fontsReady = true;
}

export function renderPdf(document: TDocumentDefinitions): Promise<Buffer> {
  loadFonts();
  return pdfmake.createPdf(document).getBuffer();
}
