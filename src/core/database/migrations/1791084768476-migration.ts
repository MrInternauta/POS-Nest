import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Each sold item keeps the price and cost it had at the moment of the sale.
 * Sales made before this migration only know today's prices, so they are filled in with those
 * and their totals stay approximate.
 */
export class Migration1791084768476 implements MigrationInterface {
  name = 'Migration1791084768476';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_item" ADD "unitPrice" integer`);
    await queryRunner.query(`ALTER TABLE "order_item" ADD "unitCost" integer`);
    await queryRunner.query(
      `UPDATE "order_item" SET "unitPrice" = COALESCE("products"."priceSell", 0), "unitCost" = COALESCE("products"."price", 0) FROM "products" WHERE "products"."id" = "order_item"."productId"`
    );
    await queryRunner.query(
      `UPDATE "order_item" SET "unitPrice" = 0, "unitCost" = 0 WHERE "unitPrice" IS NULL OR "unitCost" IS NULL`
    );
    await queryRunner.query(`ALTER TABLE "order_item" ALTER COLUMN "unitPrice" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "order_item" ALTER COLUMN "unitCost" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_item" DROP COLUMN "unitCost"`);
    await queryRunner.query(`ALTER TABLE "order_item" DROP COLUMN "unitPrice"`);
  }
}
