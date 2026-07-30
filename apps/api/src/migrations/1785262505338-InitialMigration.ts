import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1785262505338 implements MigrationInterface {
    name = 'InitialMigration1785262505338'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`description\` \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`weight\` \`weight\` decimal(10,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`size\` \`size\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`imageUrl\` \`imageUrl\` varchar(500) NULL`);
        await queryRunner.query(`ALTER TABLE \`stations\` CHANGE \`phone\` \`phone\` varchar(20) NULL`);
        await queryRunner.query(`ALTER TABLE \`stations\` CHANGE \`email\` \`email\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_94754bc4f5522eee5c245371906\``);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`driverStatus\` \`driverStatus\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`currentLatitude\` \`currentLatitude\` decimal(10,7) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`currentLongitude\` \`currentLongitude\` decimal(10,7) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`lastLocationUpdate\` \`lastLocationUpdate\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`vehicleNumber\` \`vehicleNumber\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`vehicleType\` \`vehicleType\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`stationId\` \`stationId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` CHANGE \`vehicleNumber\` \`vehicleNumber\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` CHANGE \`currentLocation\` \`currentLocation\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` CHANGE \`deliveryPhoto\` \`deliveryPhoto\` varchar(500) NULL`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` CHANGE \`customerSignature\` \`customerSignature\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` CHANGE \`rating\` \`rating\` decimal(2,1) NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`deliveryCity\` \`deliveryCity\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`deliveryLatitude\` \`deliveryLatitude\` decimal(10,7) NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`deliveryLongitude\` \`deliveryLongitude\` decimal(10,7) NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`notes\` \`notes\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`cancellationReason\` \`cancellationReason\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`orderId\` \`orderId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`externalReference\` \`externalReference\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`description\` \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_94754bc4f5522eee5c245371906\` FOREIGN KEY (\`stationId\`) REFERENCES \`stations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_94754bc4f5522eee5c245371906\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`externalReference\` \`externalReference\` varchar(100) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`orderId\` \`orderId\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`cancellationReason\` \`cancellationReason\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`notes\` \`notes\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`deliveryLongitude\` \`deliveryLongitude\` decimal(10,7) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`deliveryLatitude\` \`deliveryLatitude\` decimal(10,7) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`deliveryCity\` \`deliveryCity\` varchar(100) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` CHANGE \`rating\` \`rating\` decimal(2,1) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` CHANGE \`customerSignature\` \`customerSignature\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` CHANGE \`deliveryPhoto\` \`deliveryPhoto\` varchar(500) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` CHANGE \`currentLocation\` \`currentLocation\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` CHANGE \`vehicleNumber\` \`vehicleNumber\` varchar(50) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`stationId\` \`stationId\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`vehicleType\` \`vehicleType\` varchar(50) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`vehicleNumber\` \`vehicleNumber\` varchar(50) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`lastLocationUpdate\` \`lastLocationUpdate\` timestamp NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`currentLongitude\` \`currentLongitude\` decimal(10,7) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`currentLatitude\` \`currentLatitude\` decimal(10,7) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`driverStatus\` \`driverStatus\` varchar(50) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_94754bc4f5522eee5c245371906\` FOREIGN KEY (\`stationId\`) REFERENCES \`stations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stations\` CHANGE \`email\` \`email\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`stations\` CHANGE \`phone\` \`phone\` varchar(20) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`imageUrl\` \`imageUrl\` varchar(500) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`size\` \`size\` varchar(50) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`weight\` \`weight\` decimal(10,2) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'`);
    }

}
