"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

// Centros financeiros — placeholder de marcadores para a fase de shell.
const MARKERS: { location: [number, number]; size: number }[] = [
  { location: [40.71, -74.01], size: 0.05 }, // Nova York
  { location: [51.51, -0.13], size: 0.05 }, // Londres
  { location: [35.68, 139.69], size: 0.05 }, // Tóquio
  { location: [1.35, 103.82], size: 0.04 }, // Singapura
  { location: [50.11, 8.68], size: 0.04 }, // Frankfurt
  { location: [-23.55, -46.63], size: 0.05 }, // São Paulo
];

// #1B2440
const BASE_COLOR: [number, number, number] = [0.106, 0.141, 0.251];
// #7B3FE4
const MARKER_COLOR: [number, number, number] = [0.482, 0.247, 0.894];
// #2E6BFF, com a intensidade rebaixada para não estourar o fundo escuro
const GLOW_COLOR: [number, number, number] = [0.108, 0.252, 0.6];

const MOBILE_BREAKPOINT = 640;

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

    const globe = createGlobe(canvas, {
      devicePixelRatio,
      width,
      height,
      phi: 0,
      theta: 0.32,
      dark: 1,
      diffuse: 1.2,
      mapSamples,
      mapBrightness: 5,
      baseColor: BASE_COLOR,
      markerColor: MARKER_COLOR,
      glowColor: GLOW_COLOR,
      opacity: 0.9,
      markers: MARKERS,
    });

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

    return () => {
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
