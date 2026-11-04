import AppDataSource from "../config/database";
import { StationActivity } from "../entities/StationActivity";

export interface StationActivityInput {
  stationId: string;
  eventType: string;
  title: string;
  description: string;
  actorId?: string | null;
  orderId?: string | null;
  data?: any;
}

export async function recordStationActivity(input: StationActivityInput): Promise<void> {
  if (!input.stationId) return;
  try {
    const repo = AppDataSource.getRepository(StationActivity);
    const record = repo.create({
      stationId: input.stationId,
      eventType: input.eventType,
      title: input.title,
      description: input.description,
      actorId: input.actorId || null,
      orderId: input.orderId || null,
      data: input.data || null,
    });
    await repo.save(record);
  } catch (error: any) {
    // History is operational audit data; a history outage must not fail orders.
    console.warn("[StationHistory] Could not record activity:", error?.message || error);
  }
}
