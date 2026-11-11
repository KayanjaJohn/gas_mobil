import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderArchiving1794000000000 implements MigrationInterface {
  name = "AddOrderArchiving1794000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query([
      "ALTER TABLE `orders`",
      "  ADD `isArchived` tinyint NOT NULL DEFAULT 0,",
      "  ADD `archivedAt` datetime NULL,",
      "  ADD `archivedBy` varchar(36) NULL,",
      "  ADD `archiveReason` text NULL,",
      "  ADD INDEX `IDX_orders_isArchived_stationId` (`isArchived`, `stationId`)"
    ].join("\n"));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query([
      "ALTER TABLE `orders`",
      "  DROP INDEX `IDX_orders_isArchived_stationId`,",
      "  DROP COLUMN `archiveReason`,",
      "  DROP COLUMN `archivedBy`,",
      "  DROP COLUMN `archivedAt`,",
      "  DROP COLUMN `isArchived`"
    ].join("\n"));
  }
}
