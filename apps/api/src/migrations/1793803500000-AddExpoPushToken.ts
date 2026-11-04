import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpoPushToken1793803500000 implements MigrationInterface {
  name = "AddExpoPushToken1793803500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `users` ADD `expoPushToken` varchar(255) NULL"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `users` DROP COLUMN `expoPushToken`"
    );
  }
}
