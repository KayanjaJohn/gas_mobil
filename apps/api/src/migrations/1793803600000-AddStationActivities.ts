import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStationActivities1793803600000 implements MigrationInterface {
  name = "AddStationActivities1793803600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS `station_activities` (
        `id` varchar(36) NOT NULL,
        `stationId` varchar(36) NOT NULL,
        `eventType` varchar(60) NOT NULL,
        `title` varchar(255) NOT NULL,
        `description` text NOT NULL,
        `actorId` varchar(36) NULL,
        `orderId` varchar(36) NULL,
        `data` json NULL,
        `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (`id`),
        KEY `IDX_station_activities_stationId` (`stationId`),
        KEY `IDX_station_activities_createdAt` (`createdAt`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS `station_activities`");
  }
}
