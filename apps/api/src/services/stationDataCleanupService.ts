import AppDataSource from "../config/database";
import { Station } from "../entities/Station";

export type StationCleanupCounts = {
  orders: number;
  orderItems: number;
  deliveries: number;
  orderTransactions: number;
  orderNotifications: number;
  stationActivities: number;
};

export async function previewStationDataCleanup(stationId: string) {
  const station = await AppDataSource.getRepository(Station).findOne({ where: { id: stationId } });
  if (!station) return null;
  const rows = await AppDataSource.query(
    `SELECT
      (SELECT COUNT(*) FROM orders WHERE stationId = ?) AS orders,
      (SELECT COUNT(*) FROM order_items oi INNER JOIN orders o ON o.id = oi.orderId WHERE o.stationId = ?) AS orderItems,
      (SELECT COUNT(*) FROM deliveries d INNER JOIN orders o ON o.id = d.orderId WHERE o.stationId = ?) AS deliveries,
      (SELECT COUNT(*) FROM transactions t INNER JOIN orders o ON o.id = t.orderId WHERE o.stationId = ?) AS orderTransactions,
      (SELECT COUNT(*) FROM notifications n INNER JOIN orders o ON o.id = n.orderId WHERE o.stationId = ?) AS orderNotifications,
      (SELECT COUNT(*) FROM station_activities WHERE stationId = ?) AS stationActivities`,
    [stationId, stationId, stationId, stationId, stationId, stationId]
  );
  const counts = Object.fromEntries(
    Object.entries(rows[0] || {}).map(([key, value]) => [key, Number(value || 0)])
  ) as StationCleanupCounts;
  return { station, counts };
}

/**
 * Deletes station order history and dependent records only.
 * Preserves station, products/current stock, product catalogue, customers,
 * station agents/drivers, wallets and unrelated transactions/notifications.
 */
export async function clearStationTransactionalData(stationId: string): Promise<StationCleanupCounts> {
  const runner = AppDataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    const rows = await runner.query(
      `SELECT
        (SELECT COUNT(*) FROM orders WHERE stationId = ?) AS orders,
        (SELECT COUNT(*) FROM order_items oi INNER JOIN orders o ON o.id = oi.orderId WHERE o.stationId = ?) AS orderItems,
        (SELECT COUNT(*) FROM deliveries d INNER JOIN orders o ON o.id = d.orderId WHERE o.stationId = ?) AS deliveries,
        (SELECT COUNT(*) FROM transactions t INNER JOIN orders o ON o.id = t.orderId WHERE o.stationId = ?) AS orderTransactions,
        (SELECT COUNT(*) FROM notifications n INNER JOIN orders o ON o.id = n.orderId WHERE o.stationId = ?) AS orderNotifications,
        (SELECT COUNT(*) FROM station_activities WHERE stationId = ?) AS stationActivities`,
      [stationId, stationId, stationId, stationId, stationId, stationId]
    );
    const counts = Object.fromEntries(
      Object.entries(rows[0] || {}).map(([key, value]) => [key, Number(value || 0)])
    ) as StationCleanupCounts;

    // Child records first to satisfy foreign-key constraints.
    await runner.query("DELETE n FROM notifications n INNER JOIN orders o ON o.id = n.orderId WHERE o.stationId = ?", [stationId]);
    await runner.query("DELETE t FROM transactions t INNER JOIN orders o ON o.id = t.orderId WHERE o.stationId = ?", [stationId]);
    await runner.query("DELETE d FROM deliveries d INNER JOIN orders o ON o.id = d.orderId WHERE o.stationId = ?", [stationId]);
    await runner.query("DELETE oi FROM order_items oi INNER JOIN orders o ON o.id = oi.orderId WHERE o.stationId = ?", [stationId]);
    await runner.query("DELETE FROM station_activities WHERE stationId = ?", [stationId]);
    await runner.query("DELETE FROM orders WHERE stationId = ?", [stationId]);

    await runner.commitTransaction();
    return counts;
  } catch (error) {
    await runner.rollbackTransaction();
    throw error;
  } finally {
    await runner.release();
  }
}
