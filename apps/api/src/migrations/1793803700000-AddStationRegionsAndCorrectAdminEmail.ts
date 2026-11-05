import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStationRegionsAndCorrectAdminEmail1793803700000 implements MigrationInterface {
  name = "AddStationRegionsAndCorrectAdminEmail1793803700000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasRegion = await queryRunner.hasColumn("stations", "region");
    if (!hasRegion) {
      await queryRunner.query(
        "ALTER TABLE `stations` ADD COLUMN `region` varchar(20) NOT NULL DEFAULT 'central'"
      );
    }

    // Backfill the five-region classification using real town names first,
    // then coordinates. Kigumba is explicitly Northern Uganda; Kalerwe is Central.
    await queryRunner.query(`
      UPDATE stations
      SET region = CASE
        WHEN LOWER(CONCAT(name, ' ', address)) REGEXP 'kigumba|kiryandongo|gulu|lira|arua|kitgum|pader|agago|amuru|nwoya|omoro|otuke|alebtong|kole|dokolo|apac|nebbi|zombo|moyo|obongi|adjumani|yumbe|koboko|maracha|lamwo|karenga|kaabong|kotido|moroto|napak|nakapiripirit|abim' THEN 'north'
        WHEN LOWER(CONCAT(name, ' ', address)) REGEXP 'rakai|kyotera|lyantonde|ssembabule|kalangala' THEN 'south'
        WHEN LOWER(CONCAT(name, ' ', address)) REGEXP 'jinja|iganga|kamuli|mbale|tororo|busia|bugiri|mayuge|namutumba|buyende|pallisa|budaka|bududa|sironko|bulambuli|kapchorwa|kumi|katakwi|amuria|kaberamaido|serere|ngora|bukedea|butaleja|manafa|namisindwa' THEN 'east'
        WHEN LOWER(CONCAT(name, ' ', address)) REGEXP 'mbarara|hoima|fort portal|kabale|kasese|bushenyi|ibanda|ntungamo|rukungiri|kanungu|kisoro|bundibugyo|kabarole|kagadi|kibaale|mitooma|rubirizi|sheema|buhweju|kiruhura|kamwenge|kikuube' THEN 'west'
        WHEN latitude >= 1.5 THEN 'north'
        WHEN longitude >= 33.0 THEN 'east'
        WHEN longitude <= 30.5 THEN 'west'
        WHEN latitude <= -0.2 THEN 'south'
        ELSE 'central'
      END
    `);

    // Correct the known administrator email typo only when the canonical
    // address is not already taken; never merge or overwrite another account.
    const oldAdminAccounts: Array<{ id: string }> = await queryRunner.query(
      "SELECT `id` FROM `users` WHERE `role` = 'admin' AND LOWER(`email`) = 'admin@gas-mobil.om'"
    );
    const canonicalAccounts: Array<{ id: string }> = await queryRunner.query(
      "SELECT `id` FROM `users` WHERE LOWER(`email`) = 'admin@gas-mobil.com'"
    );
    if (oldAdminAccounts.length > 0 && canonicalAccounts.length === 0) {
      for (const account of oldAdminAccounts) {
        await queryRunner.query(
          "UPDATE `users` SET `email` = 'admin@gas-mobil.com' WHERE `id` = ? AND `role` = 'admin'",
          [account.id]
        );
      }
    } else if (oldAdminAccounts.length > 0 && canonicalAccounts.length > 0) {
      console.warn(
        "[Migration] Both admin@gas-mobil.om and admin@gas-mobil.com exist. The email was not changed automatically to avoid merging accounts."
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasRegion = await queryRunner.hasColumn("stations", "region");
    if (hasRegion) {
      await queryRunner.query("ALTER TABLE `stations` DROP COLUMN `region`");
    }
  }
}
