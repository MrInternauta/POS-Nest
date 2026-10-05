import { MigrationInterface, QueryRunner } from 'typeorm';

/** Reports filter every sale by the day, week or month it was made in */
export class Migration1791159005399 implements MigrationInterface {
  name = 'Migration1791159005399';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_order_created_at" ON "order" ("created_at") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_order_created_at"`);
  }
}
