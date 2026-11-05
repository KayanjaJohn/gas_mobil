import { Station } from "../entities/Station";

export type UgandaRegion = "central" | "north" | "east" | "west" | "south";
export const NEARBY_STATION_RADIUS_KM = 50;

const REGION_TERMS: Record<UgandaRegion, string[]> = {
  south: ["masaka", "kalungu", "bukomansimbi", "lwengo", "rakai", "kyotera", "lyantonde", "ssembabule", "kalangala"],
  north: [
    "gulu", "lira", "arua", "kitgum", "pader",
    "agago", "amuru", "nwoya", "omoro", "otuke", "alebtong", "kole",
    "dokolo", "apac", "nebbi", "zombo", "moyo", "obongi", "adjumani",
    "yumbe", "koboko", "maracha", "lamwo", "karenga", "kaabong", "kotido",
    "moroto", "napak", "nakapiripirit", "abim",
  ],
  east: [
    "jinja", "iganga", "kamuli", "mbale", "tororo", "busia", "bugiri",
    "mayuge", "namutumba", "buyende", "pallisa", "budaka", "bududa",
    "sironko", "bulambuli", "kapchorwa", "kumi", "katakwi", "amuria",
    "kaberamaido", "serere", "ngora", "bukedea", "butaleja", "manafa",
    "bududa", "namisindwa",
  ],
  west: [
    "mbarara", "hoima", "masindi", "kigumba", "kiryandongo", "buliisa", "fort portal", "fort-portal", "kabale", "kasese",
    "bushenyi", "ibanda", "ntungamo", "rukungiri", "kanungu", "kisoro",
    "bundibugyo", "kabarole", "kagadi", "kibaale", "mitooma", "rubirizi",
    "sheema", "buhweju", "kiruhura", "kamwenge", "kikuube", "bunyoro",
  ],
  central: [
    "kampala", "kalerwe", "wakiso", "mukono", "mpigi", "mityana", "mubende",
    "luwero", "nakaseke", "nakasongola", "kayunga", "buikwe", "gomba",
    "butambala", "kassanda", "kira", "entebbe", "wandegeya", "ntinda",
  ],
};

export function normalizeUgandaRegion(value: unknown): UgandaRegion | null {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return null;
  if (["northern", "northern uganda", "northern region"].includes(text)) return "north";
  if (["eastern", "eastern uganda", "eastern region"].includes(text)) return "east";
  if (["western", "western uganda", "western region"].includes(text)) return "west";
  if (["southern", "southern uganda", "southern region"].includes(text)) return "south";
  if (text === "central uganda") return "central";
  return (["central", "north", "east", "west", "south"] as UgandaRegion[])
    .find((region) => text === region) || null;
}

export function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const toRadians = (value: number) => value * Math.PI / 180;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) *
    Math.sin(deltaLongitude / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function inferUgandaRegion(input: {
  region?: unknown;
  city?: unknown;
  address?: unknown;
  name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
}): UgandaRegion | null {
  // Match known districts/localities first. Kigumba, Kiryandongo and
  // Masindi are in Western Uganda despite their relatively northern latitude.
  const locationText = [input.name, input.city, input.address]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");

  for (const region of ["south", "north", "east", "west", "central"] as UgandaRegion[]) {
    if (REGION_TERMS[region].some((term) => locationText.includes(term))) return region;
  }

  // Explicit non-central regions are intentional admin selections. "central"
  // is also the legacy database default, so do not let that default mask a
  // station whose GPS clearly places it in another region.
  const explicit = normalizeUgandaRegion(input.region);
  if (explicit && explicit !== "central") return explicit;

  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);

  // Bunyoro sub-region (Masindi, Hoima, Kigumba/Kiryandongo) lies north
  // of the Equator but is Western Uganda. Handle its GPS area before the
  // simplistic latitude-based north/central fallback.
  if (
    input.latitude != null && input.longitude != null &&
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= 1.0 && latitude <= 2.6 &&
    longitude >= 30.5 && longitude <= 32.6
  ) {
    return "west";
  }

  if (
    input.latitude != null && input.longitude != null &&
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -1.5 && latitude <= 4.5 &&
    longitude >= 29.5 && longitude <= 35
  ) {
    if (latitude >= 2.5) return "north";
    if (longitude >= 33) return "east";
    if (longitude <= 30.5) return "west";
    if (latitude <= -0.2) return "south";
    return "central";
  }

  // Keep a valid explicit Central selection as the final fallback when
  // coordinates are missing or inconclusive.
  return explicit;
}

export function isStationEligibleForLocation(
  station: Pick<Station, "latitude" | "longitude" | "region" | "name" | "address">,
  location: {
    latitude?: unknown;
    longitude?: unknown;
    region?: unknown;
    city?: unknown;
    address?: unknown;
  },
  nearbyRadiusKm = NEARBY_STATION_RADIUS_KM
): boolean {
  const stationLatitude = Number(station.latitude);
  const stationLongitude = Number(station.longitude);
  const customerLatitude = Number(location.latitude);
  const customerLongitude = Number(location.longitude);

  const validCustomerCoordinates =
    Number.isFinite(customerLatitude) && Number.isFinite(customerLongitude) &&
    customerLatitude >= -1.5 && customerLatitude <= 4.5 &&
    customerLongitude >= 29.5 && customerLongitude <= 35;
  const validStationCoordinates =
    Number.isFinite(stationLatitude) && Number.isFinite(stationLongitude) &&
    stationLatitude >= -1.5 && stationLatitude <= 4.5 &&
    stationLongitude >= 29.5 && stationLongitude <= 35;

  if (validCustomerCoordinates && validStationCoordinates) {
    const distance = calculateDistanceKm(
      customerLatitude, customerLongitude, stationLatitude, stationLongitude
    );
    if (distance <= nearbyRadiusKm) return true;
  }

  const customerRegion = inferUgandaRegion({
    region: location.region,
    city: location.city,
    address: location.address,
    latitude: validCustomerCoordinates ? customerLatitude : undefined,
    longitude: validCustomerCoordinates ? customerLongitude : undefined,
  });
  const stationRegion = inferUgandaRegion({
    region: station.region,
    name: station.name,
    address: station.address,
    latitude: stationLatitude,
    longitude: stationLongitude,
  });

  return Boolean(customerRegion && stationRegion && customerRegion === stationRegion);
}
