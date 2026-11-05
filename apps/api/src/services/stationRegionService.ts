import { Station } from "../entities/Station";

export type UgandaRegion = "central" | "north" | "east" | "west" | "south";
export const NEARBY_STATION_RADIUS_KM = 50;

const REGION_TERMS: Record<UgandaRegion, string[]> = {
  south: ["rakai", "kyotera", "lyantonde", "ssembabule", "kalangala"],
  north: [
    "kigumba", "kiryandongo", "gulu", "lira", "arua", "kitgum", "pader",
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
    "mbarara", "hoima", "fort portal", "fort-portal", "kabale", "kasese",
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
  if (text === "northern" || text === "northern uganda") return "north";
  if (text === "eastern" || text === "eastern uganda") return "east";
  if (text === "western" || text === "western uganda") return "west";
  if (text === "southern" || text === "southern uganda") return "south";
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
  const explicit = normalizeUgandaRegion(input.region);
  if (explicit) return explicit;

  const locationText = [input.name, input.city, input.address]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");

  // Use more specific southern/northern/eastern/western locality names first.
  for (const region of ["south", "north", "east", "west", "central"] as UgandaRegion[]) {
    if (REGION_TERMS[region].some((term) => locationText.includes(term))) return region;
  }

  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  if (
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -1.5 && latitude <= 4.5 &&
    longitude >= 29.5 && longitude <= 35
  ) {
    if (latitude >= 1.5) return "north";
    if (longitude >= 33) return "east";
    if (longitude <= 30.5) return "west";
    if (latitude <= -0.2) return "south";
    return "central";
  }
  return null;
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
