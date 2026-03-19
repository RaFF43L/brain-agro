import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1742394819000 implements MigrationInterface {
  name = 'InitSchema1742394819000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "producers" (
        "id" SERIAL NOT NULL,
        "cpfCnpj" character varying NOT NULL,
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_producers_cpfCnpj" UNIQUE ("cpfCnpj"),
        CONSTRAINT "PK_producers" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "farms" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "city" character varying NOT NULL,
        "state" character varying NOT NULL,
        "totalArea" numeric(10,2) NOT NULL,
        "arableArea" numeric(10,2) NOT NULL,
        "vegetationArea" numeric(10,2) NOT NULL,
        "producerId" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_farms" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "farms"
        ADD CONSTRAINT "FK_farms_producerId"
        FOREIGN KEY ("producerId")
        REFERENCES "producers"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "crops" (
        "id" SERIAL NOT NULL,
        "season" character varying NOT NULL,
        "culture" character varying NOT NULL,
        "farmId" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_crops" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "crops"
        ADD CONSTRAINT "FK_crops_farmId"
        FOREIGN KEY ("farmId")
        REFERENCES "farms"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "cognito_id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_cognito_id" UNIQUE ("cognito_id"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "crops" DROP CONSTRAINT "FK_crops_farmId"`);
    await queryRunner.query(`ALTER TABLE "farms" DROP CONSTRAINT "FK_farms_producerId"`);
    await queryRunner.query(`DROP TABLE "crops"`);
    await queryRunner.query(`DROP TABLE "farms"`);
    await queryRunner.query(`DROP TABLE "producers"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
