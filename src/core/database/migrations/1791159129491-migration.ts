import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mercado Pago Point as a second way to pay. Every sale made before this was paid in cash,
 * which is what the defaults say. The store settings start with Mercado Pago off.
 */
export class Migration1791159129491 implements MigrationInterface {
  name = 'Migration1791159129491';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order" ADD "paymentMethod" character varying(16) NOT NULL DEFAULT 'cash'`);
    await queryRunner.query(`ALTER TABLE "order" ADD "paymentStatus" character varying(16) NOT NULL DEFAULT 'paid'`);
    await queryRunner.query(`ALTER TABLE "order" ADD "mpOrderId" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "UQ_order_mpOrderId" UNIQUE ("mpOrderId")`);
    await queryRunner.query(
      `CREATE TABLE "store_setting" ("id" integer NOT NULL, "mercadoPagoEnabled" boolean NOT NULL DEFAULT false, "mpTerminalId" character varying(128), CONSTRAINT "PK_store_setting" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`INSERT INTO "store_setting" ("id") VALUES (1)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "store_setting"`);
    await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "UQ_order_mpOrderId"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "mpOrderId"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "paymentStatus"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "paymentMethod"`);
  }
}
