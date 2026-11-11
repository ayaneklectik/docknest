"use client";

import { useEffect, useRef } from "react";

const WORDS = [
  "domain", "hosting", "startup", "cloud", "brand", "launch", "website",
  "design", "support", "commerce", "security", "growth", ".com", ".net",
  "email", "api", "digital", "software", ".org", "studio", "dns",
  "creative", "global", "online", "business", "platform", ".io", "edge",
  "managed", "server", "build", "ideas",
];

const ACCENTS = new Set(["hosting", "launch", "security", ".com", ".org", "dns", ".io", "edge"]);
const WORD_GAP = 5;
const TRAIL_LIFETIME = 1350;

type TrailPoint = { x: number; y: number; time: number };
type WordPosition = { word: string; x: number; width: number };

export function HeroWordField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let visible = true;
    let frameId = 0;
    let lastTime = 0;
    let elapsed = 0;
    let pointer: { x: number; y: number } | null = null;
    let rows: Array<{ y: number; speed: number; direction: number; period: number; words: WordPosition[] }> = [];
    const trail: TrailPoint[] = [];

    function buildRows() {
      const rowGap = 39;
      const rowCount = Math.ceil((height + 30) / rowGap);
      rows = [];

      for (let row = 0; row < rowCount; row++) {
        const fontSize = 9 + (row % 3);
        context!.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        const words: WordPosition[] = [];
        let cursor = 0;

        for (let index = 0; index < WORDS.length; index++) {
          const word = WORDS[(index + row * 7) % WORDS.length];
          const wordWidth = context!.measureText(word).width;
          words.push({ word, x: cursor, width: wordWidth });
          cursor += wordWidth + WORD_GAP;
        }

        rows.push({
          y: 25 + row * rowGap,
          speed: 17 + (row % 5) * 3.5,
          direction: row % 2 === 0 ? -1 : 1,
          period: cursor,
          words,
        });
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildRows();
      if (reducedMotion) draw(performance.now());
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        pointer = null;
        return;
      }

      pointer = { x, y };
      const now = performance.now();
      const previous = trail[trail.length - 1];

      if (!previous || Math.hypot(x - previous.x, y - previous.y) > 6 || now - previous.time > 16) {
        trail.push({ x, y, time: now });
        if (trail.length > 80) trail.shift();
      }
    }

    function draw(now = performance.now()) {
      if (!visible && !reducedMotion) {
        frameId = 0;
        return;
      }

      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
      lastTime = now;
      elapsed += delta;
      context!.clearRect(0, 0, width, height);
      context!.textBaseline = "middle";
      context!.lineJoin = "round";

      const lightTheme = document.documentElement.dataset.theme === "light";
      while (trail.length && now - trail[0].time > TRAIL_LIFETIME) trail.shift();

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        context!.font = `600 ${9 + (rowIndex % 3)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        const offset = reducedMotion ? 0 : (elapsed * row.speed * row.direction) % row.period;
        const firstCycle = Math.floor((offset - row.period) / row.period);
        const lastCycle = Math.ceil((width + offset) / row.period);

        for (let cycle = firstCycle; cycle <= lastCycle; cycle++) {
          const cycleStart = cycle * row.period - offset;

          for (const item of row.words) {
            const x = cycleStart + item.x;
            if (x > width + 10 || x + item.width < -10) continue;

            const centerX = x + item.width / 2;
            let heat = 0;

            for (const point of trail) {
              const age = Math.max(0, (now - point.time) / TRAIL_LIFETIME);
              const distance = Math.hypot(centerX - point.x, row.y - point.y);
              if (distance < 112) {
                const proximity = 1 - distance / 112;
                const influence = proximity * proximity * (1 - age) * (1 - age);
                heat = Math.max(heat, influence);
              }
            }

            const accent = ACCENTS.has(item.word);
            const baseAlpha = accent ? 0.34 : 0.145;
            context!.shadowBlur = heat > 0.015 ? 13 * heat : 0;
            context!.shadowColor = "rgba(255, 106, 43, 0.8)";
            context!.fillStyle = heat > 0.008
              ? `rgba(255, 106, 43, ${Math.min(0.96, baseAlpha + heat * 0.88)})`
              : lightTheme
                ? `rgba(23, 23, 23, ${accent ? 0.3 : 0.16})`
                : `rgba(255, 255, 255, ${baseAlpha})`;
            context!.fillText(item.word, x, row.y);
          }
        }
      }

      if (pointer && trail.length) {
        const glow = context!.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 84);
        glow.addColorStop(0, "rgba(255, 106, 43, 0.045)");
        glow.addColorStop(1, "rgba(255, 106, 43, 0)");
        context!.fillStyle = glow;
        context!.fillRect(pointer.x - 84, pointer.y - 84, 168, 168);
      }

      context!.shadowBlur = 0;
      if (!reducedMotion) frameId = requestAnimationFrame(draw);
    }

    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reducedMotion && frameId === 0) frameId = requestAnimationFrame(draw);
    });

    resizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    resize();
    if (!reducedMotion) frameId = requestAnimationFrame(draw);

    return () => {
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-word-matrix" aria-hidden="true" />;
}
