import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSupportTickets1793900000000 implements MigrationInterface {
  name = "CreateSupportTickets1793900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query([
"      CREATE TABLE `support_tickets` (",
"        `id` varchar(36) NOT NULL,",
"        `customerId` varchar(36) NOT NULL,",
"        `stationId` varchar(36) NULL,",
"        `assignedToId` varchar(36) NULL,",
"        `subject` varchar(255) NOT NULL,",
"        `description` text NOT NULL,",
"        `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',",
"        `priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',",
"        `messages` json NULL,",
"        `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),",
"        `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),",
"        INDEX `IDX_support_customer` (`customerId`),",
"        INDEX `IDX_support_station` (`stationId`),",
"        INDEX `IDX_support_assignee` (`assignedToId`),",
"        INDEX `IDX_support_status` (`status`),",
"        PRIMARY KEY (`id`)",
"      ) ENGINE=InnoDB"
    ].join("\n"));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `support_tickets`");
  }
}
