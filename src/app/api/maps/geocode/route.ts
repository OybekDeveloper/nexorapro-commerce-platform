import { z } from "zod";

import { apiError, enforceRateLimit, HttpError } from "@/server/http";

export const dynamic = "force-dynamic";

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  neighbourhood?: string;
  quarter?: string;
  suburb?: string;
  residential?: string;
  village?: string;
  town?: string;
  city_district?: string;
  city?: string;
  state?: string;
  amenity?: string;
  shop?: string;
  building?: string;
  country?: string;
};

type NominatimPlace = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: NominatimAddress;
};

const DROP_PARTS = new Set(["uzbekistan", "oʻzbekiston", "o'zbekiston", "узбекистан"]);

/** Builds a short, courier-friendly address from Nominatim's structured fields. */
function formatAddress(place: NominatimPlace) {
  const address = place.address;
  if (!address) {
    return trimDisplayName(place.display_name);
  }
  const street = address.road || address.pedestrian || address.residential;
  const line1 = [street, address.house_number].filter(Boolean).join(", ");
  const area =
    address.neighbourhood ||
    address.quarter ||
    address.suburb ||
    address.village ||
    address.town;
  const city = address.city || address.city_district || address.state;
  const point = place.name || address.amenity || address.shop || address.building;

  const seen = new Set<string>();
  const parts = [line1 || point, area, city]
    .filter((part): part is string => Boolean(part && part.trim()))
    .filter((part) => {
      const key = part.toLocaleLowerCase("uz");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return parts.length > 0 ? parts.join(", ") : trimDisplayName(place.display_name);
}

function trimDisplayName(displayName: string) {
  return displayName
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && !/^\d{5,6}$/.test(part) && !DROP_PARTS.has(part.toLocaleLowerCase("uz")))
    .join(", ");
}

const searchSchema = z.object({ q: z.string().trim().min(3).max(160) });
const reverseSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const geocodingBaseUrl = `${process.env.GEOCODING_BASE_URL?.replace(/\/$/, "") || "https://nominatim.openstreetmap.org"}/`;
let requestQueue = Promise.resolve();
let lastRequestAt = 0;

function readCache(key: string) {
  const cached = responseCache.get(key);
  if (!cached) return undefined;
  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return undefined;
  }
  return cached.value;
}

function writeCache(key: string, value: unknown) {
  if (responseCache.size >= 200) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
  responseCache.set(key, {
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    value,
  });
}

function fetchNominatim<T>(url: URL) {
  const task = requestQueue.then(async () => {
    const delay = Math.max(0, 1_050 - (Date.now() - lastRequestAt));
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    lastRequestAt = Date.now();
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "uz,ru;q=0.9,en;q=0.7",
        "User-Agent": "nexorapro-commerce/0.1 (+https://nexorapro.uz)",
      },
      cache: "no-store",
    });
    if (!response.ok)
      throw new HttpError(502, "Manzil xizmati vaqtincha ishlamayapti");
    return response.json() as Promise<T>;
  });
  requestQueue = task.then(
    () => undefined,
    () => undefined,
  );
  return task;
}

export async function GET(request: Request) {
  try {
    enforceRateLimit(request, "geocode", 60, 60_000);
    const params = new URL(request.url).searchParams;
    const query = params.get("q");

    if (query !== null) {
      const { q } = searchSchema.parse({ q: query });
      const key = `search:${q.toLocaleLowerCase("uz")}`;
      const cached = readCache(key);
      if (cached) return Response.json(cached);

      const url = new URL("search", geocodingBaseUrl);
      url.search = new URLSearchParams({
        format: "jsonv2",
        q,
        limit: "5",
        countrycodes: "uz",
        addressdetails: "1",
        viewbox: "68.7,42.0,70.4,40.7",
        bounded: "0",
      }).toString();
      const places = await fetchNominatim<NominatimPlace[]>(url);
      const payload = {
        results: places.map((place) => {
          const address = formatAddress(place);
          return {
            id: String(place.place_id),
            latitude: Number(place.lat),
            longitude: Number(place.lon),
            address,
            label: address,
          };
        }),
      };
      writeCache(key, payload);
      return Response.json(payload);
    }

    const { lat, lon } = reverseSchema.parse({
      lat: params.get("lat"),
      lon: params.get("lon"),
    });
    const key = `reverse:${lat.toFixed(5)}:${lon.toFixed(5)}`;
    const cached = readCache(key);
    if (cached) return Response.json(cached);

    const url = new URL("reverse", geocodingBaseUrl);
    url.search = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lon),
      zoom: "18",
      addressdetails: "1",
    }).toString();
    const place = await fetchNominatim<NominatimPlace>(url);
    const payload = {
      address:
        formatAddress(place) || `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
    };
    writeCache(key, payload);
    return Response.json(payload);
  } catch (error) {
    return apiError(error, request);
  }
}
