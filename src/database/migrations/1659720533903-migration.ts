import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1659720533903 implements MigrationInterface {
  name = 'migration1659720533903';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "brand" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "product" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "category" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "user" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "customer" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "brand" DROP COLUMN "updateAt"`);
    await queryRunner.query(`ALTER TABLE "brand" ADD "updateAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "updateAt"`);
    await queryRunner.query(`ALTER TABLE "product" ADD "updateAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "updateAt"`);
    await queryRunner.query(`ALTER TABLE "category" ADD "updateAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updateAt"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "updateAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "updateAt"`);
    await queryRunner.query(`ALTER TABLE "customer" ADD "updateAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "updateAt"`);
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "updateAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updateAt"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "updateAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "updateAt"`);
    await queryRunner.query(
      `ALTER TABLE "category" ADD "updateAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "updateAt"`);
    await queryRunner.query(
      `ALTER TABLE "product" ADD "updateAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "brand" DROP COLUMN "updateAt"`);
    await queryRunner.query(
      `ALTER TABLE "brand" ADD "updateAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "brand" DROP COLUMN "deletedAt"`);
  }
}
