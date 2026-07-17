"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe, { type Marker } from "cobe";
import { CITIES, type City } from "@/lib/cities";

// #1B2440
const BASE_COLOR: [number, number, number] = [0.106, 0.141, 0.251];
// #2E6BFF, com a intensidade rebaixada para não estourar o fundo escuro
const GLOW_COLOR: [number, number, number] = [0.108, 0.252, 0.6];
// #38BDF8 — marcador "você está aqui"
const USER_MARKER_COLOR: [number, number, number] = [0.22, 0.741, 0.973];

// "luz de cidade": azul-claro/branco-azulado derivado de accent-blue,
// interpolado entre um tom mais apagado e um mais brilhante conforme a
// população — cidades maiores ficam maiores E um pouco mais "acesas".
const CITY_COLOR_DIM: [number, number, number] = [0.42, 0.55, 0.85];
const CITY_COLOR_BRIGHT: [number, number, number] = [0.75, 0.85, 1];
const CITY_MIN_SIZE = 0.02;
const CITY_MAX_SIZE = 0.08;
const USER_MARKER_SIZE = 0.09; // maior que qualquer cidade

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
      color: [
        lerp(CITY_COLOR_DIM[0], CITY_COLOR_BRIGHT[0], t),
        lerp(CITY_COLOR_DIM[1], CITY_COLOR_BRIGHT[1], t),
        lerp(CITY_COLOR_DIM[2], CITY_COLOR_BRIGHT[2], t),
      ],
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

    // Densidade de marcadores fixada no tamanho inicial da tela — evita
    // recriar o globo a cada resize (só o canvas/resolução acompanham).
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
        markerColor: CITY_COLOR_BRIGHT,
        glowColor: GLOW_COLOR,
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

    // Geolocalização aproximada por IP (sem navigator.geolocation — evita o
    // popup de permissão). Falha graciosa: sem marcador se bloquear/falhar.
    // Localização não é armazenada, só usada em memória para recriar o globo.
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

          // Aproximação: orienta o globo para a longitude do visitante ficar
          // de frente ao carregar. Heurística simples, não uma projeção exata.
          phi = (data.longitude * Math.PI) / 180;

          globe.destroy();
          globe = createGlobe(
            canvas,
            buildOptions([...cityMarkers, userMarker]),
          );
        },
      )
      .catch(() => {
        // API de geolocalização indisponível/bloqueada (rede, CORS, etc.) —
        // segue sem o marcador do usuário, sem quebrar o globo.
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
