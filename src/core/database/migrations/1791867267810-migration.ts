import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Providers, and the one a product is bought from. Every product starts without a provider, and
 * removing a provider for good leaves its products without one.
 */
export class Migration1791867267810 implements MigrationInterface {
  name = 'Migration1791867267810';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "provider" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "contactName" character varying(255), "phone" character varying(50), "email" character varying(255), CONSTRAINT "UQ_39c1a7b4cdd7cfb27b9ee9e5002" UNIQUE ("name"), CONSTRAINT "PK_6ab2f66d8987bf1bfdd6136a2d5" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`ALTER TABLE "products" ADD "id_provider" integer`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_3d6d671142671e08f24862bba11" FOREIGN KEY ("id_provider") REFERENCES "provider"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_3d6d671142671e08f24862bba11"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "id_provider"`);
    await queryRunner.query(`DROP TABLE "provider"`);
  }
}
