import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1783636441341 implements MigrationInterface {
    name = 'InitialMigration1783636441341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`products\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`price\` decimal(12,2) NOT NULL, \`stock\` int NOT NULL DEFAULT '0', \`weight\` decimal(10,2) NULL, \`size\` varchar(50) NULL, \`type\` enum ('cylinder', 'accessory') NOT NULL DEFAULT 'cylinder', \`isAvailable\` tinyint NOT NULL DEFAULT 1, \`imageUrl\` varchar(500) NULL, \`stationId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stations\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`address\` text NOT NULL, \`latitude\` decimal(10,7) NOT NULL, \`longitude\` decimal(10,7) NOT NULL, \`phone\` varchar(20) NULL, \`email\` varchar(255) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`phone\` varchar(20) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('admin', 'agent', 'driver', 'customer') NOT NULL DEFAULT 'customer', \`isActive\` tinyint NOT NULL DEFAULT 1, \`driverStatus\` varchar(50) NULL, \`currentLatitude\` decimal(10,7) NULL, \`currentLongitude\` decimal(10,7) NULL, \`lastLocationUpdate\` timestamp NULL, \`vehicleNumber\` varchar(50) NULL, \`vehicleType\` varchar(50) NULL, \`stationId\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_items\` (\`id\` varchar(36) NOT NULL, \`orderId\` varchar(255) NOT NULL, \`productId\` varchar(255) NOT NULL, \`quantity\` int NOT NULL DEFAULT '1', \`price\` decimal(12,2) NOT NULL, \`subtotal\` decimal(12,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`deliveries\` (\`id\` varchar(36) NOT NULL, \`orderId\` varchar(255) NOT NULL, \`driverId\` varchar(255) NOT NULL, \`driverName\` varchar(255) NOT NULL, \`driverPhone\` varchar(20) NOT NULL, \`vehicleNumber\` varchar(50) NULL, \`status\` enum ('pending', 'driver_assigned', 'picked_up', 'in_transit', 'nearby', 'delivered', 'failed') NOT NULL DEFAULT 'pending', \`currentLocation\` text NULL, \`deliveryPhoto\` varchar(500) NULL, \`customerSignature\` text NULL, \`rating\` decimal(2,1) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`orders\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`stationId\` varchar(255) NOT NULL, \`totalAmount\` decimal(12,2) NOT NULL, \`deliveryAddress\` text NOT NULL, \`deliveryCity\` varchar(100) NULL, \`deliveryLatitude\` decimal(10,7) NULL, \`deliveryLongitude\` decimal(10,7) NULL, \`status\` enum ('pending', 'confirmed', 'driver_assigned', 'picked_up', 'in_transit', 'nearby', 'delivered', 'completed', 'cancelled', 'failed', 'refunded') NOT NULL DEFAULT 'pending', \`paymentMethod\` enum ('cash', 'wallet', 'momo', 'airtel') NOT NULL DEFAULT 'cash', \`paymentStatus\` enum ('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending', \`notes\` text NULL, \`cancellationReason\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`transactions\` (\`id\` varchar(36) NOT NULL, \`walletId\` varchar(255) NOT NULL, \`orderId\` varchar(255) NULL, \`amount\` decimal(12,2) NOT NULL, \`type\` enum ('credit', 'debit') NOT NULL, \`status\` enum ('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending', \`externalReference\` varchar(100) NULL, \`description\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`wallets\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`balance\` decimal(12,2) NOT NULL DEFAULT '0.00', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_22c8e640d9c51a9e77e0733f134\` FOREIGN KEY (\`stationId\`) REFERENCES \`stations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_94754bc4f5522eee5c245371906\` FOREIGN KEY (\`stationId\`) REFERENCES \`stations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_f1d359a55923bb45b057fbdab0d\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_cdb99c05982d5191ac8465ac010\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` ADD CONSTRAINT \`FK_f7433e3639e213f901e22cf8640\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_151b79a83ba240b0cb31b2302d1\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_6229b6b048e99c564fd78497d84\` FOREIGN KEY (\`stationId\`) REFERENCES \`stations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_a88f466d39796d3081cf96e1b66\` FOREIGN KEY (\`walletId\`) REFERENCES \`wallets\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`wallets\` ADD CONSTRAINT \`FK_2ecdb33f23e9a6fc392025c0b97\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`wallets\` DROP FOREIGN KEY \`FK_2ecdb33f23e9a6fc392025c0b97\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_a88f466d39796d3081cf96e1b66\``);
        await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_6229b6b048e99c564fd78497d84\``);
        await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_151b79a83ba240b0cb31b2302d1\``);
        await queryRunner.query(`ALTER TABLE \`deliveries\` DROP FOREIGN KEY \`FK_f7433e3639e213f901e22cf8640\``);
        await queryRunner.query(`ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_cdb99c05982d5191ac8465ac010\``);
        await queryRunner.query(`ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_f1d359a55923bb45b057fbdab0d\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_94754bc4f5522eee5c245371906\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_22c8e640d9c51a9e77e0733f134\``);
        await queryRunner.query(`DROP TABLE \`wallets\``);
        await queryRunner.query(`DROP TABLE \`transactions\``);
        await queryRunner.query(`DROP TABLE \`orders\``);
        await queryRunner.query(`DROP TABLE \`deliveries\``);
        await queryRunner.query(`DROP TABLE \`order_items\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`stations\``);
        await queryRunner.query(`DROP TABLE \`products\``);
    }

}
