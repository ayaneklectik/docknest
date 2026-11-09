# Design System

## Direction

Docknest uses a restrained forest-green, warm-paper, and soft-lime palette. Large, tightly spaced headings and mono-style utility labels create a technical but approachable hierarchy. Visual motifs use orbit lines and an infrastructure status card rather than stock illustrations.

## Tokens and type

Core colors and light/dark theme values are CSS custom properties in `frontend/src/app/globals.css`. The interface uses locally installed system font stacks; it does not fetch remote fonts. Layout widths, spacing, borders, and card treatments are defined in the same stylesheet.

## Components

The initial component set includes the public header/footer, theme toggle, quotation form, hosting cards, domain request form, and admin quotation table. The mobile navigation uses native `<details>`; motion is reduced when `prefers-reduced-motion` is enabled.

## Brand assets

`public/docknest-mark.svg` is the compact mark. The wordmark in the header is currently rendered as text; a complete set of primary, compact, and alternate logo exports is not yet available.
