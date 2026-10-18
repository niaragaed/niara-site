"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe, { type Marker } from "cobe";
import { CITIES, type City } from "@/lib/cities";

// #1B2440
const BASE_COLOR: [number, number, number] = [0.106, 0.141, 0.251];
// #2E6BFF, with the intensity lowered so it doesn't blow out the dark background
const GLOW_COLOR: [number, number, number] = [0.108, 0.252, 0.6];
// #38BDF8: the only highlighted marker, "you are here"
const USER_MARKER_COLOR: [number, number, number] = [0.22, 0.741, 0.973];

// "light dust": accent-blue pulled toward the map's own tone (baseColor),
// heavily dimmed. Cities should read as texture on the globe, not as dots
// floating over the content.
const CITY_COLOR: [number, number, number] = [0.128, 0.225, 0.476];
const CITY_MIN_SIZE = 0.008;
const CITY_MAX_SIZE = 0.02;
const USER_MARKER_SIZE = 0.055; // the single highlight, much larger than the cities
const MARKER_ELEVATION = 0.01; // flush with the surface (cobe's default is 0.05)

const MOBILE_BREAKPOINT = 640;
const MOBILE_CITY_COUNT = 50;
const GEO_ENDPOINT = "https://ipwho.is/";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function buildCityMarkers(cities: City[]): Marker[] {
  const logs = cities.map((city) => Math.log(city.pop));
  const minLog = Math.min(...logs);
  const maxLog = Math.max(...logs);
  const range = maxLog - minLog || 1;

  return cities.map((city) => {
    const t = (Math.log(city.pop) - minLog) / range;
    return {
      location: [city.lat, city.lng],
      size: lerp(CITY_MIN_SIZE, CITY_MAX_SIZE, t),
      color: CITY_COLOR,
    };
  });
}

export function HeroGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let mapSamples = 16000;
    let phi = 0;

    function readSize() {
      const rect = container!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      mapSamples = width < MOBILE_BREAKPOINT ? 9000 : 16000;
    }
    readSize();

    // Marker density is fixed at the initial screen size, so the globe isn't
    // recreated on every resize (only the canvas/resolution follow it).
    const isMobile = width < MOBILE_BREAKPOINT;
    const cities = isMobile
      ? [...CITIES].sort((a, b) => b.pop - a.pop).slice(0, MOBILE_CITY_COUNT)
      : CITIES;
    const cityMarkers = buildCityMarkers(cities);

    function buildOptions(markers: Marker[]) {
      return {
        devicePixelRatio,
        width,
        height,
        phi,
        theta: 0.32,
        dark: 1,
        diffuse: 1.2,
        mapSamples,
        mapBrightness: 5,
        baseColor: BASE_COLOR,
        markerColor: CITY_COLOR,
        glowColor: GLOW_COLOR,
        markerElevation: MARKER_ELEVATION,
        opacity: 0.9,
        markers,
      };
    }

    let globe = createGlobe(canvas, buildOptions(cityMarkers));

    let frame: number;
    function animate() {
      if (!prefersReducedMotion) {
        phi += 0.0025;
      }
      globe.update({ phi, width, height, mapSamples });
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver(() => {
      readSize();
    });
    resizeObserver.observe(container);

    const fadeInFrame = requestAnimationFrame(() => setReady(true));

    // Approximate IP geolocation (no navigator.geolocation, which would show a
    // permission popup). Fails gracefully: no marker if blocked or failing.
    // The location is never stored; it's only used in memory to rebuild the globe.
    let cancelled = false;
    const geoController = new AbortController();

    fetch(GEO_ENDPOINT, { signal: geoController.signal })
      .then((response) => {
        if (!response.ok) throw new Error("geo lookup failed");
        return response.json();
      })
      .then(
        (data: {
          success?: boolean;
          latitude?: number;
          longitude?: number;
        }) => {
          if (cancelled) return;
          if (
            data?.success === false ||
            typeof data.latitude !== "number" ||
            typeof data.longitude !== "number"
          ) {
            return;
          }

          const userMarker: Marker = {
            location: [data.latitude, data.longitude],
            size: USER_MARKER_SIZE,
            color: USER_MARKER_COLOR,
          };

          // Approximation: rotate the globe so the visitor's longitude faces
          // forward on load. A simple heuristic, not an exact projection.
          phi = (data.longitude * Math.PI) / 180;

          globe.destroy();
          globe = createGlobe(
            canvas,
            buildOptions([...cityMarkers, userMarker]),
          );
        },
      )
      .catch(() => {
        // Geolocation API unavailable or blocked (network, CORS, etc.):
        // carry on without the user marker, without breaking the globe.
      });

    return () => {
      cancelled = true;
      geoController.abort();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(fadeInFrame);
      resizeObserver.disconnect();
      globe.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`h-full w-full pointer-events-none transition-opacity duration-1000 ease-out ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
