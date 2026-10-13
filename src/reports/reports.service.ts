import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { Store } from '../stores/entities/store.entity';
import { Period, TopProductsDto } from './dtos/reports.dto';
import { groupInsights, LOW_STOCK, ProductInsights, ProductSalesRow, SALES_WINDOW_DAYS } from './product-insights';

/**
 * Days, weeks and months are the store's, not UTC's: in UTC a sale after 6 pm in Mexico City
 * would count toward the next day. Every range is built from local wall-clock time and turned
 * back into an instant with `AT TIME ZONE` before it is compared with `created_at`.
 */
export const STORE_TIMEZONE = 'America/Mexico_City';

//Orders in a range and their items. A deleted order or item is not a sale, whatever it once was
const soldItems = (from: string, to: string, store: string) => `
  "order" o ON o."deletedAt" IS NULL AND o."id_store" = ${store} AND o."created_at" >= ${from} AND o."created_at" < ${to}
  LEFT JOIN "order_item" oi ON oi."orderId" = o."id" AND oi."deletedAt" IS NULL`;

//Totals come from the price and cost kept on each item, never from the product's current price
const TOTALS = `
  COALESCE(SUM(oi."unitPrice" * oi."quantity"), 0) AS "revenue",
  COALESCE(SUM((oi."unitPrice" - oi."unitCost") * oi."quantity"), 0) AS "profit",
  COUNT(DISTINCT o."id") AS "orders"`;

export interface SalesTotals {
  revenue: number;
  profit: number;
  orders: number;
  averageTicket: number;
}

export interface PeriodTotals extends SalesTotals {
  from: Date;
  to: Date;
}

export interface Summary {
  period: Period;
  current: PeriodTotals;
  previous: PeriodTotals;
}

export interface TopProduct {
  id: number;
  name: string;
  image: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface MonthTotals extends SalesTotals {
  month: string;
}

export interface StockAlert {
  id: number;
  name: string;
  code: string;
  stock: number;
}

export interface StockAlerts {
  threshold: number;
  total: number;
  products: StockAlert[];
}

/** What a report needs to know about its store: whose sales, and in which zone days begin */
export type ReportStore = Pick<Store, 'id' | 'timezone'>;

/** Everything the PDF report shows */
export interface ReportData {
  generatedAt: Date;
  storeName: string;
  timezone: string;
  summary: Summary;
  topProducts: TopProduct[];
  monthly: MonthTotals[];
  stock: StockAlerts;
}

/** A store date as YYYY-MM-DD, what the date filters take */
export const storeDate = (instant: Date, timeZone = STORE_TIMEZONE) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);

//Postgres sends SUM and COUNT back as bigint, which the driver hands over as strings
const totals = (row: { revenue: string; profit: string; orders: string }): SalesTotals => {
  const revenue = Number(row.revenue);
  const orders = Number(row.orders);
  return {
    revenue,
    profit: Number(row.profit),
    orders,
    averageTicket: orders ? Math.round(revenue / orders) : 0,
  };
};

@Injectable()
export class ReportsService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * This day/week/month so far, next to the same stretch of the previous one: at 11 am the
   * comparison is with yesterday until 11 am, not with all of yesterday. Weeks start on Monday.
   */
  async summary(store: ReportStore, period: Period): Promise<Summary> {
    const rows: {
      label: 'current' | 'previous';
      from: Date;
      to: Date;
      revenue: string;
      profit: string;
      orders: string;
    }[] = await this.dataSource.query(
      `WITH "bounds" AS (
          SELECT date_trunc($1, now() AT TIME ZONE $2) AS "start", now() AT TIME ZONE $2 AS "now"
        ), "ranges" AS (
          SELECT 'current' AS "label", "start" AS "from", "now" AS "to" FROM "bounds"
          UNION ALL
          SELECT
            'previous',
            "start" - ('1 ' || $1)::interval,
            --A month is not always as long as the one before it: never reach into the current one
            LEAST("start" - ('1 ' || $1)::interval + ("now" - "start"), "start")
          FROM "bounds"
        )
        SELECT
          r."label",
          r."from" AT TIME ZONE $2 AS "from",
          r."to" AT TIME ZONE $2 AS "to",
          ${TOTALS}
        FROM "ranges" r
        LEFT JOIN ${soldItems(`r."from" AT TIME ZONE $2`, `r."to" AT TIME ZONE $2`, '$3')}
        GROUP BY r."label", r."from", r."to"`,
      [period, store.timezone, store.id]
    );

    const byLabel = Object.fromEntries(rows.map(row => [row.label, { ...totals(row), from: row.from, to: row.to }]));
    return { period, current: byLabel.current, previous: byLabel.previous };
  }

  /** `from` and `to` are store dates and both are included; by default, this month so far */
  async topProducts(store: ReportStore, { from, to, limit, by }: TopProductsDto): Promise<TopProduct[]> {
    if (from && to && from > to) {
      throw new BadRequestException('`from` must not be after `to`');
    }
    //Interpolated, not a parameter, so it is only ever one of these two
    const orderBy = by === 'revenue' ? '"revenue" DESC, "quantity" DESC' : '"quantity" DESC, "revenue" DESC';

    const rows: { id: number; name: string; image: string; quantity: string; revenue: string; profit: string }[] =
      await this.dataSource.query(
        `SELECT
          p."id",
          p."name",
          p."image",
          SUM(oi."quantity") AS "quantity",
          SUM(oi."unitPrice" * oi."quantity") AS "revenue",
          SUM((oi."unitPrice" - oi."unitCost") * oi."quantity") AS "profit"
        FROM "order_item" oi
        JOIN "order" o ON o."id" = oi."orderId" AND o."deletedAt" IS NULL AND o."id_store" = $5
        --A product deleted since still shows: it was sold
        JOIN "products" p ON p."id" = oi."productId"
        WHERE oi."deletedAt" IS NULL
          AND o."created_at" >= COALESCE($1::date, date_trunc('month', now() AT TIME ZONE $3)::date)::timestamp AT TIME ZONE $3
          AND o."created_at" < (COALESCE($2::date, (now() AT TIME ZONE $3)::date) + 1)::timestamp AT TIME ZONE $3
        GROUP BY p."id"
        ORDER BY ${orderBy}, p."name"
        LIMIT $4`,
        [from ?? null, to ?? null, store.timezone, limit ?? 10, store.id]
      );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      image: row.image,
      quantity: Number(row.quantity),
      revenue: Number(row.revenue),
      profit: Number(row.profit),
    }));
  }

  /** The last `months` months, this one included, oldest first */
  async monthly(store: ReportStore, months: number): Promise<MonthTotals[]> {
    const rows: { month: string; revenue: string; profit: string; orders: string }[] = await this.dataSource.query(
      `WITH "months" AS (
        SELECT generate_series(
          date_trunc('month', now() AT TIME ZONE $2) - ($1::int - 1) * interval '1 month',
          date_trunc('month', now() AT TIME ZONE $2),
          interval '1 month'
        ) AS "start"
      )
      SELECT
        to_char(m."start", 'YYYY-MM') AS "month",
        ${TOTALS}
      FROM "months" m
      LEFT JOIN ${soldItems(`m."start" AT TIME ZONE $2`, `(m."start" + interval '1 month') AT TIME ZONE $2`, '$3')}
      GROUP BY m."start"
      ORDER BY m."start"`,
      [months ?? 12, store.timezone, store.id]
    );

    return rows.map(row => ({ month: row.month, ...totals(row) }));
  }

  /** Products at or below `threshold` units, the emptiest first */
  async stockAlerts(storeId: number, threshold = LOW_STOCK, limit = 15): Promise<StockAlerts> {
    const rows: (StockAlert & { total: string })[] = await this.dataSource.query(
      `SELECT p."id", p."name", p."code", p."stock", COUNT(*) OVER () AS "total"
      FROM "products" p
      WHERE p."deletedAt" IS NULL AND p."stock" <= $1 AND p."id_store" = $3
      ORDER BY p."stock", p."name"
      LIMIT $2`,
      [threshold, limit, storeId]
    );

    return {
      threshold,
      total: rows.length ? Number(rows[0].total) : 0,
      products: rows.map(row => ({ id: row.id, name: row.name, code: row.code, stock: row.stock })),
    };
  }

  /** What is worth looking at in the catalogue: losing money, not moving, running out, incomplete */
  async productInsights(storeId: number): Promise<ProductInsights> {
    const rows: (Omit<ProductSalesRow, 'sold'> & { sold: string })[] = await this.dataSource.query(
      `WITH "sales" AS (
        SELECT
          oi."productId" AS "id",
          COALESCE(SUM(oi."quantity") FILTER (WHERE o."created_at" >= now() - $1::int * interval '1 day'), 0) AS "sold",
          MAX(o."created_at") AS "lastSale"
        FROM "order_item" oi
        JOIN "order" o ON o."id" = oi."orderId" AND o."deletedAt" IS NULL AND o."id_store" = $2
        WHERE oi."deletedAt" IS NULL
        GROUP BY oi."productId"
      )
      SELECT
        p."id", p."name", p."code", p."stock", p."price", p."priceSell", p."image", p."description",
        p."id_category" AS "categoryId",
        p."id_provider" AS "providerId",
        COALESCE(s."sold", 0) AS "sold",
        s."lastSale"
      FROM "products" p
      LEFT JOIN "sales" s ON s."id" = p."id"
      WHERE p."deletedAt" IS NULL AND p."id_store" = $2`,
      [SALES_WINDOW_DAYS, storeId]
    );

    return groupInsights(rows.map(row => ({ ...row, sold: Number(row.sold) })));
  }

  /** The summary of `period`, its best sellers by revenue, the last twelve months and the stock alerts */
  async reportData(store: Pick<Store, 'id' | 'name' | 'timezone'>, period: Period): Promise<ReportData> {
    const summary = await this.summary(store, period);
    const [topProducts, monthly, stock] = await Promise.all([
      this.topProducts(store, {
        from: storeDate(new Date(summary.current.from), store.timezone),
        to: storeDate(new Date(summary.current.to), store.timezone),
        limit: 10,
        by: 'revenue',
      }),
      this.monthly(store, 12),
      this.stockAlerts(store.id),
    ]);

    return {
      generatedAt: new Date(),
      storeName: store.name,
      timezone: store.timezone,
      summary,
      topProducts,
      monthly,
      stock,
    };
  }
}
