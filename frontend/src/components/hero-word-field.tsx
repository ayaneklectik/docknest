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

type TrailPoint = { x: number; y: number; time: number };

export function HeroWordField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new ResizeObserver(resize);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reducedMotion && frameId === 0) frameId = requestAnimationFrame(draw);
    });
    let width = 0;
    let height = 0;
    let dpr = 1;
    let visible = true;
    let frameId = 0;
    let lastTime = 0;
    let elapsed = 0;
    let pointer: { x: number; y: number } | null = null;
    const trail: TrailPoint[] = [];

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      if (!previous || Math.hypot(x - previous.x, y - previous.y) > 7 || now - previous.time > 24) {
        trail.push({ x, y, time: now });
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

      const rowGap = 39;
      const rows = Math.ceil((height + 30) / rowGap);
      const spacing = 126;
      const nowMs = now;
      while (trail.length && nowMs - trail[0].time > 1450) trail.shift();

      for (let row = 0; row < rows; row++) {
        const y = 26 + row * rowGap;
        const direction = row % 2 === 0 ? 1 : -1;
        const speed = 10 + (row % 4) * 4;
        const offset = reducedMotion ? 0 : ((elapsed * speed * direction) % spacing);
        for (let column = -2; column < Math.ceil(width / spacing) + 3; column++) {
          const word = WORDS[(row * 11 + column * 7 + WORDS.length * 4) % WORDS.length];
          const x = column * spacing + offset;
          const fontSize = 9 + ((row + column + 40) % 3);
          context!.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
          const baseAlpha = ACCENTS.has(word) ? 0.34 : 0.145;
          let heat = 0;
          for (const point of trail) {
            const age = (nowMs - point.time) / 1450;
            const distance = Math.hypot(x - point.x, y - point.y);
            if (distance < 118) {
              const influence = Math.pow(1 - distance / 118, 2) * Math.pow(1 - age, 1.35);
              heat = Math.max(heat, influence);
            }
          }
          context!.shadowBlur = heat > 0.04 ? 15 * heat : 0;
          context!.shadowColor = "rgba(255, 106, 43, 0.9)";
          context!.fillStyle = heat > 0.015
            ? `rgba(255, 106, 43, ${Math.min(0.95, baseAlpha + heat * 0.9)})`
            : lightTheme
              ? `rgba(23, 23, 23, ${ACCENTS.has(word) ? 0.3 : 0.16})`
              : `rgba(255, 255, 255, ${baseAlpha})`;
          context!.fillText(word, x, y);
        }
      }

      if (pointer && trail.length) {
        const glow = context!.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 92);
        glow.addColorStop(0, "rgba(255, 106, 43, 0.055)");
        glow.addColorStop(1, "rgba(255, 106, 43, 0)");
        context!.fillStyle = glow;
        context!.fillRect(pointer.x - 92, pointer.y - 92, 184, 184);
      }

      context!.shadowBlur = 0;
      if (!reducedMotion) frameId = requestAnimationFrame(draw);
    }

    observer.observe(canvas);
    visibility.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    resize();
    if (!reducedMotion) frameId = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      visibility.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-word-matrix" aria-hidden="true" />;
}
