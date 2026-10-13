import { MigrationInterface, QueryRunner } from 'typeorm';

const MAIN_STORE = `(SELECT "id" FROM "store" WHERE "slug" = 'tienda-principal')`;
const DEFAULT_CUSTOMER = `(SELECT "id" FROM "customer" WHERE "isDefault" AND "id_store" = ${MAIN_STORE})`;
//The user's role, by name: the roles were created by the seed, their ids differ between databases
const WITH_ROLE = (name: string) => `"id_role" IN (SELECT "id" FROM "role" WHERE upper("name") = '${name}')`;

/**
 * Stores. Everything that existed goes to "Tienda principal": its products, categories, providers
 * and orders. ADMIN users become super admins and the store's owners, CASHIER users its cashiers.
 * CLIENT users become customers of the store (a customer does not log in), their accounts are
 * switched off, and their orders point to them. Every other order points to the store's default
 * customer, "Público en general". Codes and names stop being unique across the whole database and
 * become unique per store.
 */
export class Migration1791876605351 implements MigrationInterface {
  name = 'Migration1791876605351';

  public async up(queryRunner: QueryRunner): Promise<void> {
    //Tables
    await queryRunner.query(
      `CREATE TABLE "store" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(80) NOT NULL, "phone" character varying(50), "address" character varying(255), "logo" character varying(255), "timezone" character varying(64) NOT NULL DEFAULT 'America/Mexico_City', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_bff9b535dff86abbb2fe8779958" UNIQUE ("slug"), CONSTRAINT "PK_f3172007d4de5ae8e7692759d79" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "store_member" ("id" SERIAL NOT NULL, "role" character varying(20) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_user" integer NOT NULL, "id_store" integer NOT NULL, CONSTRAINT "PK_96dbf5e1c5b6cfcc4001d767a58" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c88c5fd7a6558c5c9ed891ab36" ON "store_member" ("id_user", "id_store") `
    );
    await queryRunner.query(
      `CREATE TABLE "customer" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "phone" character varying(50), "email" character varying(255), "notes" text, "isDefault" boolean NOT NULL DEFAULT false, "id_store" integer NOT NULL, CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bea948f413290c00edd47dd8f4" ON "customer" ("id_store") WHERE "isDefault" AND "deletedAt" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "store_member" ADD CONSTRAINT "FK_9f2b2ca2e7662daa894da9cf815" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "store_member" ADD CONSTRAINT "FK_cbff7e287397f690f989f686cbd" FOREIGN KEY ("id_store") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "FK_5d06ce27fe0407c887a6df82841" FOREIGN KEY ("id_store") REFERENCES "store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    //The store everything that exists moves into, with its default customer
    await queryRunner.query(`INSERT INTO "store" ("name", "slug") VALUES ('Tienda principal', 'tienda-principal')`);
    await queryRunner.query(
      `INSERT INTO "customer" ("name", "isDefault", "id_store") VALUES ('Público en general', true, ${MAIN_STORE})`
    );

    //Store data
    for (const table of ['products', 'category', 'provider', 'order']) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD "id_store" integer`);
      await queryRunner.query(`UPDATE "${table}" SET "id_store" = ${MAIN_STORE}`);
      await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "id_store" SET NOT NULL`);
    }
    await queryRunner.query(`ALTER TABLE "products" ADD "isPublic" boolean NOT NULL DEFAULT false`);

    //Users
    await queryRunner.query(`ALTER TABLE "user" ADD "isSuperAdmin" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "user" ADD "active" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`UPDATE "user" SET "isSuperAdmin" = true WHERE ${WITH_ROLE('ADMIN')}`);
    await queryRunner.query(
      `INSERT INTO "store_member" ("id_user", "id_store", "role") SELECT "id", ${MAIN_STORE}, 'OWNER' FROM "user" WHERE ${WITH_ROLE(
        'ADMIN'
      )}`
    );
    await queryRunner.query(
      `INSERT INTO "store_member" ("id_user", "id_store", "role") SELECT "id", ${MAIN_STORE}, 'CASHIER' FROM "user" WHERE ${WITH_ROLE(
        'CASHIER'
      )}`
    );

    //Clients become customers; the email ties each one back to the account it came from
    await queryRunner.query(`ALTER TABLE "order" ADD "id_customer" integer`);
    await queryRunner.query(
      `INSERT INTO "customer" ("name", "phone", "email", "notes", "id_store")
      SELECT trim(concat_ws(' ', "name", "lastName")), NULLIF("phone", ''), "email", 'Tenía cuenta de cliente', ${MAIN_STORE}
      FROM "user" WHERE ${WITH_ROLE('CLIENT')} AND "deletedAt" IS NULL`
    );
    await queryRunner.query(
      `UPDATE "order" o SET "id_customer" = c."id"
      FROM "user" u, "customer" c
      WHERE o."userId" = u."id" AND u.${WITH_ROLE('CLIENT')} AND c."email" = u."email" AND c."id_store" = ${MAIN_STORE}`
    );
    await queryRunner.query(`UPDATE "order" SET "id_customer" = ${DEFAULT_CUSTOMER} WHERE "id_customer" IS NULL`);
    await queryRunner.query(`ALTER TABLE "order" ALTER COLUMN "id_customer" SET NOT NULL`);
    await queryRunner.query(`UPDATE "user" SET "active" = false WHERE ${WITH_ROLE('CLIENT')}`);

    //Foreign keys
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_1383a633da66c6236260838a7c7" FOREIGN KEY ("id_store") REFERENCES "store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_6a56d28911ef44ca6a333fa2e23" FOREIGN KEY ("id_store") REFERENCES "store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "provider" ADD CONSTRAINT "FK_c77f076026c7c9f034bcc51b8d9" FOREIGN KEY ("id_store") REFERENCES "store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_582c6ec4129e8fd20f06b397c8b" FOREIGN KEY ("id_store") REFERENCES "store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_621f3cecd817d8e56a0c19b5854" FOREIGN KEY ("id_customer") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    //A code or a name is unique within its store, not across stores
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "UQ_7cfc24d6c24f0ec91294003d6b8"`);
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "UQ_23c05c292c439d77b0de816b500"`);
    await queryRunner.query(`ALTER TABLE "provider" DROP CONSTRAINT "UQ_39c1a7b4cdd7cfb27b9ee9e5002"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fd90dd617071e153f46e399d6d" ON "products" ("id_store", "code") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f0f13fe8d3682b9838659ebd78" ON "category" ("id_store", "name") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_aea883589a06716a58de537a7f" ON "provider" ("id_store", "name") `);
  }

  /** Back to one store: only possible while no two stores share a code or a name */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_aea883589a06716a58de537a7f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f0f13fe8d3682b9838659ebd78"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fd90dd617071e153f46e399d6d"`);
    await queryRunner.query(`ALTER TABLE "provider" ADD CONSTRAINT "UQ_39c1a7b4cdd7cfb27b9ee9e5002" UNIQUE ("name")`);
    await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name")`);
    await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "UQ_7cfc24d6c24f0ec91294003d6b8" UNIQUE ("code")`);

    //The customers that were clients get their accounts back
    await queryRunner.query(
      `UPDATE "user" SET "active" = true WHERE ${WITH_ROLE(
        'CLIENT'
      )} AND "email" IN (SELECT "email" FROM "customer" WHERE "notes" = 'Tenía cuenta de cliente')`
    );

    await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_621f3cecd817d8e56a0c19b5854"`);
    await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_582c6ec4129e8fd20f06b397c8b"`);
    await queryRunner.query(`ALTER TABLE "provider" DROP CONSTRAINT "FK_c77f076026c7c9f034bcc51b8d9"`);
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_6a56d28911ef44ca6a333fa2e23"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_1383a633da66c6236260838a7c7"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "id_customer"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "active"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isSuperAdmin"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "isPublic"`);
    for (const table of ['order', 'provider', 'category', 'products']) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "id_store"`);
    }

    await queryRunner.query(`ALTER TABLE "customer" DROP CONSTRAINT "FK_5d06ce27fe0407c887a6df82841"`);
    await queryRunner.query(`ALTER TABLE "store_member" DROP CONSTRAINT "FK_cbff7e287397f690f989f686cbd"`);
    await queryRunner.query(`ALTER TABLE "store_member" DROP CONSTRAINT "FK_9f2b2ca2e7662daa894da9cf815"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bea948f413290c00edd47dd8f4"`);
    await queryRunner.query(`DROP TABLE "customer"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c88c5fd7a6558c5c9ed891ab36"`);
    await queryRunner.query(`DROP TABLE "store_member"`);
    await queryRunner.query(`DROP TABLE "store"`);
  }
}
