import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1719728886472 implements MigrationInterface {
  name = 'Migration1719728886472';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "category" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "image" character varying(255), CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text NOT NULL, "code" text NOT NULL, "price" integer NOT NULL, "priceSell" integer NOT NULL, "stock" integer NOT NULL, "image" character varying NOT NULL, "id_category" integer, CONSTRAINT "UQ_7cfc24d6c24f0ec91294003d6b8" UNIQUE ("code"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_4fbc36ad745962e5c11001e1a8" ON "products" ("price", "stock") `);
    await queryRunner.query(
      `CREATE TABLE "permission" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" character varying(255) NOT NULL, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "role" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "lastName" character varying(255) NOT NULL, "phone" character varying(255) NOT NULL, "image" character varying NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "id_role" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "order" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "userId" integer, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "order_item" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "quantity" integer NOT NULL, "productId" integer, "orderId" integer, CONSTRAINT "PK_d01158fe15b1ead5c26fd7f4e90" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "permission_role" ("id_category" integer NOT NULL, "id_role" integer NOT NULL, CONSTRAINT "PK_bae85303344227e180759c482e2" PRIMARY KEY ("id_category", "id_role"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_3afb9805a4d3c8ef217250eeec" ON "permission_role" ("id_category") `);
    await queryRunner.query(`CREATE INDEX "IDX_4206b87fef57d4d8e3beb58efe" ON "permission_role" ("id_role") `);
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_0633fb8c8bf00bb25890f4b2ae2" FOREIGN KEY ("id_category") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_1a3abee4bf37fa00ebd698cedec" FOREIGN KEY ("id_role") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_caabe91507b3379c7ba73637b84" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" ADD CONSTRAINT "FK_904370c093ceea4369659a3c810" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" ADD CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "permission_role" ADD CONSTRAINT "FK_3afb9805a4d3c8ef217250eeecb" FOREIGN KEY ("id_category") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "permission_role" ADD CONSTRAINT "FK_4206b87fef57d4d8e3beb58efe1" FOREIGN KEY ("id_role") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "permission_role" DROP CONSTRAINT "FK_4206b87fef57d4d8e3beb58efe1"`);
    await queryRunner.query(`ALTER TABLE "permission_role" DROP CONSTRAINT "FK_3afb9805a4d3c8ef217250eeecb"`);
    await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0"`);
    await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_904370c093ceea4369659a3c810"`);
    await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_caabe91507b3379c7ba73637b84"`);
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_1a3abee4bf37fa00ebd698cedec"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_0633fb8c8bf00bb25890f4b2ae2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4206b87fef57d4d8e3beb58efe"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3afb9805a4d3c8ef217250eeec"`);
    await queryRunner.query(`DROP TABLE "permission_role"`);
    await queryRunner.query(`DROP TABLE "order_item"`);
    await queryRunner.query(`DROP TABLE "order"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query(`DROP TABLE "permission"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4fbc36ad745962e5c11001e1a8"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "category"`);
  }
}
