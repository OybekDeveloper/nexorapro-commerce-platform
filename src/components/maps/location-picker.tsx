"use client";

import { LocateFixed, Loader2, MapPin, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type MapLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

type SearchResult = MapLocation & { id: string; label: string };

const DEFAULT_CENTER: [number, number] = [41.2995, 69.2401];
const SELECT_ZOOM = 17;
const BROWSE_ZOOM = 13;

type YandexMapEvent = {
  get: (name: string) => unknown;
};

type YandexMap = {
  container: {
    fitToViewport: () => void;
  };
  destroy: () => void;
  events: {
    add: (event: string, handler: (event: YandexMapEvent) => void) => void;
  };
  getCenter: () => number[];
  getZoom: () => number;
  panTo: (coordinates: [number, number], options?: Record<string, unknown>) => unknown;
  setCenter: (
    coordinates: [number, number],
    zoom?: number,
    options?: Record<string, unknown>,
  ) => unknown;
};

type YandexMapsApi = {
  Map: new (
    container: HTMLElement,
    state: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => YandexMap;
  ready: (onSuccess: () => void, onError?: (error: unknown) => void) => void;
};

declare global {
  interface Window {
    ymaps?: YandexMapsApi;
  }
}

let yandexMapsPromise: Promise<YandexMapsApi> | null = null;

function loadYandexMaps() {
  if (yandexMapsPromise) return yandexMapsPromise;

  yandexMapsPromise = new Promise<YandexMapsApi>((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_JS_API_KEY;
    if (!apiKey) {
      reject(new Error("Yandex Maps API kaliti topilmadi"));
      return;
    }

    const resolveWhenReady = () => {
      if (!window.ymaps) {
        reject(new Error("Yandex Maps API yuklanmadi"));
        return;
      }
      window.ymaps.ready(() => resolve(window.ymaps!), reject);
    };

    if (window.ymaps) {
      resolveWhenReady();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-yandex-maps-api="true"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", resolveWhenReady, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Yandex Maps API yuklanmadi")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;
    script.dataset.yandexMapsApi = "true";
    script.addEventListener("load", resolveWhenReady, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Yandex Maps API yuklanmadi")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return yandexMapsPromise;
}

async function reverseGeocode(coordinates: [number, number]) {
  const response = await fetch(
    `/api/maps/geocode?lat=${encodeURIComponent(coordinates[0])}&lon=${encodeURIComponent(coordinates[1])}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error("Manzil topilmadi");
  const payload = (await response.json()) as { address: string };
  return payload.address;
}

async function searchAddresses(query: string): Promise<SearchResult[]> {
  const response = await fetch(`/api/maps/geocode?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Manzil topilmadi");
  const payload = (await response.json()) as { results: SearchResult[] };
  return payload.results;
}

function nearlyEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.00001;
}

/** Yandex-style geolocation pin that sits at the map center; the whole map moves under it. */
function CenterPin({ lifted }: { lifted: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[600]">
      <span
        aria-hidden
        className={`absolute left-1/2 top-1/2 h-2.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-black/40 blur-[2px] transition-all duration-200 ${
          lifted ? "scale-75 opacity-25" : "opacity-45"
        }`}
      />
      <span
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 drop-shadow-[0_6px_10px_rgba(7,17,15,0.35)] transition-transform duration-200 ease-out ${
          lifted ? "-translate-y-[calc(100%+10px)]" : "-translate-y-full"
        }`}
      >
        <svg width="34" height="44" viewBox="0 0 34 44" fill="none" aria-hidden>
          <path
            d="M17 0C7.6 0 0 7.55 0 16.86 0 29.5 17 44 17 44s17-14.5 17-27.14C34 7.55 26.4 0 17 0Z"
            fill="#10a184"
          />
          <circle cx="17" cy="16.5" r="6.2" fill="#ffffff" />
        </svg>
      </span>
    </div>
  );
}

export function LocationPicker({
  value,
  onChange,
  readOnly = false,
  height = 280,
  className = "",
}: {
  value?: MapLocation | null;
  onChange?: (location: MapLocation | null) => void;
  readOnly?: boolean;
  height?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YandexMap | null>(null);
  const onChangeRef = useRef(onChange);
  const requestRef = useRef(0);
  const lastPublishedRef = useRef<[number, number] | null>(
    value ? [value.latitude, value.longitude] : null,
  );
  const resolvedAddressRef = useRef(value?.address ?? "");
  const skipResolveRef = useRef<string | null>(null);
  const autoLocateDoneRef = useRef(false);
  const initialValueRef = useRef(value);

  const [query, setQuery] = useState(value?.address ?? "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayAddress, setDisplayAddress] = useState(value?.address ?? "");

  const valueLatitude = value?.latitude;
  const valueLongitude = value?.longitude;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const publish = useCallback((coordinates: [number, number], address: string) => {
    lastPublishedRef.current = coordinates;
    resolvedAddressRef.current = address;
    setQuery(address);
    setDisplayAddress(address);
    setResults([]);
    onChangeRef.current?.({
      latitude: coordinates[0],
      longitude: coordinates[1],
      address,
    });
  }, []);

  const resolveCenter = useCallback(
    async (coordinates: [number, number]) => {
      const requestId = ++requestRef.current;
      setSearching(true);
      setError(null);
      try {
        const address = await reverseGeocode(coordinates);
        if (requestId !== requestRef.current) return;
        publish(
          coordinates,
          address || `${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`,
        );
      } catch {
        if (requestId !== requestRef.current) return;
        publish(coordinates, `${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`);
      } finally {
        if (requestId === requestRef.current) setSearching(false);
      }
    },
    [publish],
  );

  // Initialise Yandex Maps once, client-side only. Address lookup stays on OSM.
  useEffect(() => {
    let cancelled = false;
    let map: YandexMap | null = null;
    let resizeObserver: ResizeObserver | null = null;

    void loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const start = initialValueRef.current;
        const center: [number, number] = start
          ? [start.latitude, start.longitude]
          : DEFAULT_CENTER;

        map = new ymaps.Map(
          containerRef.current,
          {
            center,
            zoom: start ? SELECT_ZOOM : BROWSE_ZOOM,
            controls: readOnly ? [] : ["zoomControl"],
            behaviors: readOnly ? [] : ["default"],
            type: "yandex#map",
          },
          {
            suppressMapOpenBlock: true,
          },
        );

        mapRef.current = map;

        if (!readOnly) {
          map.events.add("actionbegin", () => setDragging(true));
          map.events.add("actionend", () => {
            const centerCoordinates = mapRef.current?.getCenter();
            if (!centerCoordinates) return;
            setDragging(false);
            const coordinates: [number, number] = [
              centerCoordinates[0],
              centerCoordinates[1],
            ];
            const known = skipResolveRef.current;
            if (known !== null) {
              skipResolveRef.current = null;
              publish(coordinates, known);
            } else {
              void resolveCenter(coordinates);
            }
          });
          // Tap-to-recenter: brings the picked spot under the fixed centre pin.
          map.events.add("click", (event) => {
            const coordinates = event.get("coords");
            if (!Array.isArray(coordinates) || coordinates.length < 2) return;
            setResults([]);
            void mapRef.current?.panTo([coordinates[0], coordinates[1]], {
              duration: 350,
              flying: false,
            });
          });
        }

        // The checkout panel animates in, so recompute the real viewport size.
        resizeObserver = new ResizeObserver(() => map?.container.fitToViewport());
        resizeObserver.observe(containerRef.current);
        window.setTimeout(() => map?.container.fitToViewport(), 60);

        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        setError("Yandex xaritasi yuklanmadi. API kalitini tekshiring.");
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      map?.destroy();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // Fly the map when the controlled value changes from the outside.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || valueLatitude === undefined || valueLongitude === undefined) return;
    const last = lastPublishedRef.current;
    if (last && nearlyEqual(last[0], valueLatitude) && nearlyEqual(last[1], valueLongitude)) {
      return;
    }
    lastPublishedRef.current = [valueLatitude, valueLongitude];
    skipResolveRef.current = value?.address ?? null;
    void map.setCenter(
      [valueLatitude, valueLongitude],
      readOnly ? SELECT_ZOOM : Math.max(map.getZoom(), SELECT_ZOOM),
      { duration: readOnly ? 0 : 350 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueLatitude, valueLongitude, readOnly]);

  // Auto-detect the shopper's location the first time the picker opens.
  // Runs silently in the background — no spinner, failure is ignored.
  useEffect(() => {
    if (readOnly || initialValueRef.current || autoLocateDoneRef.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    autoLocateDoneRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void mapRef.current?.setCenter(
          [position.coords.latitude, position.coords.longitude],
          SELECT_ZOOM,
          { duration: 350 },
        );
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 },
    );
  }, [readOnly]);

  const runSearch = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.length < 3) return;
    const requestId = ++requestRef.current;
    setSearching(true);
    setError(null);
    try {
      const next = await searchAddresses(trimmed);
      if (requestId !== requestRef.current) return;
      setResults(next);
      if (next.length === 0) setError("Manzil topilmadi. Aniqroq yozib ko‘ring.");
    } catch {
      if (requestId !== requestRef.current) return;
      setResults([]);
      setError("Manzil qidiruvi ishlamadi. Xaritadan nuqta tanlang.");
    } finally {
      if (requestId === requestRef.current) setSearching(false);
    }
  }, []);

  // Live search as the shopper types (debounced).
  useEffect(() => {
    if (readOnly) return;
    const trimmed = query.trim();
    if (trimmed.length < 3 || trimmed === resolvedAddressRef.current) return;
    const timer = window.setTimeout(() => void runSearch(trimmed), 550);
    return () => window.clearTimeout(timer);
  }, [query, readOnly, runSearch]);

  const chooseResult = (result: SearchResult) => {
    setResults([]);
    setQuery(result.address);
    setDisplayAddress(result.address);
    resolvedAddressRef.current = result.address;
    skipResolveRef.current = result.address;
    lastPublishedRef.current = [result.latitude, result.longitude];
    onChangeRef.current?.({
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.address,
    });
    void mapRef.current?.setCenter([result.latitude, result.longitude], SELECT_ZOOM, {
      duration: 350,
    });
  };

  const clearSelection = () => {
    setQuery("");
    setResults([]);
    setError(null);
    setDisplayAddress("");
    resolvedAddressRef.current = "";
    lastPublishedRef.current = null;
    onChangeRef.current?.(null);
  };

  const locateMe = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Brauzer geolokatsiyani qo‘llamaydi");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        void mapRef.current?.setCenter(
          [position.coords.latitude, position.coords.longitude],
          SELECT_ZOOM,
          { duration: 350 },
        );
      },
      () => {
        setLocating(false);
        setError("Joylashuvga ruxsat berilmadi. Xaritani suring va nuqtani tanlang.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 },
    );
  };

  const statusText = dragging
    ? "Kerakli joyni markazga qo‘ying"
    : searching
      ? "Manzil aniqlanmoqda…"
      : displayAddress
        ? displayAddress
        : "Xaritani suring — nuqta markazda tanlanadi";

  return (
    <div className={`space-y-3 ${className}`}>
      {!readOnly && (
        <div className="relative z-[2] flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Manzil qidirish</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void runSearch(query);
                }
              }}
              placeholder="Manzilni qidiring yoki xaritadan tanlang"
              className="h-11 w-full rounded-xl border border-black/10 bg-white pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
            {query && (
              <button
                type="button"
                onClick={clearSelection}
                aria-label="Qidiruvni tozalash"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => void runSearch(query)}
            disabled={searching || query.trim().length < 3}
            className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-brand text-white hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Manzilni qidirish"
          >
            {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </button>
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-black/10 bg-white text-brand hover:bg-brand/5 disabled:opacity-50"
            aria-label="Joriy joylashuvim"
          >
            {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
          </button>
          {results.length > 0 && (
            <div className="absolute inset-x-0 top-12 z-[1000] max-h-56 overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-2xl">
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => chooseResult(result)}
                  className="flex w-full cursor-pointer items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-zinc-100"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>{result.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>
      )}

      <div
        className="relative overflow-hidden rounded-2xl border border-black/10 bg-zinc-100"
        style={{ height }}
      >
        <div ref={containerRef} className="h-full w-full" />

        {!loading && <CenterPin lifted={dragging} />}

        {loading && (
          <div className="absolute inset-0 z-[700] flex items-center justify-center bg-zinc-100">
            <Loader2 className="size-6 animate-spin text-brand" />
          </div>
        )}

        {!readOnly && !loading && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[600] flex items-center gap-2 rounded-2xl border border-black/5 bg-white/95 px-3 py-2 text-xs font-medium text-zinc-700 shadow-lg backdrop-blur">
            {searching ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-brand" />
            ) : (
              <MapPin className="size-4 shrink-0 text-brand" />
            )}
            <span className="line-clamp-2">{statusText}</span>
          </div>
        )}
      </div>

      {!readOnly && (
        <p className="text-xs leading-5 text-zinc-500">
          Xaritani suring — nuqta doim markazda tanlanadi. Xarita{" "}
          <a
            href="https://yandex.com/maps"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            © Yandex Maps
          </a>
          , manzil qidiruvi esa{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            © OpenStreetMap
          </a>{" "}
          asosida ishlaydi.
        </p>
      )}
    </div>
  );
}
