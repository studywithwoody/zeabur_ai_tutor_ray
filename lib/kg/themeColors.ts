export interface CanvasTheme {
  base100: string;
  base200: string;
  base300: string;
  baseContent: string;
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  info: string;
  success: string;
  warning: string;
  error: string;
  dark: boolean;
}

export const DARK_CANVAS: CanvasTheme = {
  base100: "rgb(29, 35, 42)",
  base200: "rgb(25, 30, 36)",
  base300: "rgb(33, 40, 48)",
  baseContent: "rgb(214, 220, 228)",
  primary: "rgb(116, 166, 255)",
  secondary: "rgb(255, 122, 214)",
  accent: "rgb(64, 224, 208)",
  neutral: "rgb(180, 188, 198)",
  info: "rgb(86, 196, 255)",
  success: "rgb(72, 214, 160)",
  warning: "rgb(255, 196, 72)",
  error: "rgb(255, 122, 122)",
  dark: true,
};

export const LIGHT_CANVAS: CanvasTheme = {
  base100: "rgb(255, 255, 255)",
  base200: "rgb(245, 245, 245)",
  base300: "rgb(229, 229, 229)",
  baseContent: "rgb(28, 28, 28)",
  primary: "rgb(37, 99, 235)",
  secondary: "rgb(190, 24, 93)",
  accent: "rgb(13, 148, 136)",
  neutral: "rgb(51, 65, 85)",
  info: "rgb(2, 132, 199)",
  success: "rgb(22, 163, 74)",
  warning: "rgb(194, 65, 12)",
  error: "rgb(185, 28, 28)",
  dark: false,
};

const LIGHT_THEMES = new Set(["light", "retro", "valentine"]);

export function canvasFallback(themeName: string | null | undefined): CanvasTheme {
  return LIGHT_THEMES.has(themeName || "") ? LIGHT_CANVAS : DARK_CANVAS;
}

/**
 * DaisyUI tokens are oklch(). Cytoscape only parses comma-form rgb()/hsl() and #hex.
 * A canvas fillStyle assignment resolves oklch/color-mix into #rrggbb.
 */
function toCanvasRgb(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (!trimmed || typeof document === "undefined") return fallback;
  const commaRgb = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i
  );
  if (commaRgb) {
    return `rgb(${commaRgb[1]}, ${commaRgb[2]}, ${commaRgb[3]})`;
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return fallback;
  context.fillStyle = "#010203";
  const sentinel = context.fillStyle;
  context.fillStyle = trimmed;
  const assigned = String(context.fillStyle);
  if (!assigned.startsWith("#")) return fallback;
  if (assigned === sentinel && trimmed.toLowerCase() !== sentinel) return fallback;
  const hex = assigned.slice(1, 7);
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  if ([red, green, blue].some((channel) => Number.isNaN(channel))) return fallback;
  return `rgb(${red}, ${green}, ${blue})`;
}

function luminance(color: string): number {
  const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 0;
  const channels = [Number(match[1]), Number(match[2]), Number(match[3])].map(
    (channel) => {
      const value = channel / 255;
      return value <= 0.03928
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    }
  );
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function readCanvasTheme(): CanvasTheme {
  if (typeof document === "undefined") return DARK_CANVAS;
  const root = document.documentElement;
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.left = "-9999px";
  document.body.appendChild(probe);
  const rgb = (variable: string, fallback: string) => {
    const raw = getComputedStyle(root).getPropertyValue(variable).trim();
    if (!raw) return fallback;
    probe.style.color = raw;
    const resolved = getComputedStyle(probe).color;
    return toCanvasRgb(resolved && resolved !== "rgba(0, 0, 0, 0)" ? resolved : raw, fallback);
  };
  const base100 = rgb("--color-base-100", DARK_CANVAS.base100);
  const theme: CanvasTheme = {
    base100,
    base200: rgb("--color-base-200", DARK_CANVAS.base200),
    base300: rgb("--color-base-300", DARK_CANVAS.base300),
    baseContent: rgb("--color-base-content", DARK_CANVAS.baseContent),
    primary: rgb("--color-primary", DARK_CANVAS.primary),
    secondary: rgb("--color-secondary", DARK_CANVAS.secondary),
    accent: rgb("--color-accent", DARK_CANVAS.accent),
    neutral: rgb("--color-neutral", DARK_CANVAS.neutral),
    info: rgb("--color-info", DARK_CANVAS.info),
    success: rgb("--color-success", DARK_CANVAS.success),
    warning: rgb("--color-warning", DARK_CANVAS.warning),
    error: rgb("--color-error", DARK_CANVAS.error),
    dark: luminance(base100) < 0.45,
  };
  probe.remove();
  return theme;
}

/** Cytoscape's canvas parser only accepts comma-form rgb()/hsl(), not modern hsl(h s% l%). */
function hslToRgb(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  const rgb = [channel(0), channel(8), channel(4)].map((value) =>
    Math.round(value * 255)
  );
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function unitColorsFor(
  unit: string,
  theme: CanvasTheme = DARK_CANVAS
): { accent: string; fill: string } {
  let hash = 0;
  for (const char of unit) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  if (theme.dark) {
    return {
      accent: hslToRgb(hue, 70, 70),
      fill: hslToRgb(hue, 28, 24),
    };
  }
  return {
    accent: hslToRgb(hue, 48, 32),
    fill: hslToRgb(hue, 52, 90),
  };
}

export function relationColor(
  relation: string,
  theme: CanvasTheme = DARK_CANVAS
): string {
  if (relation === "derived_from") return theme.primary;
  if (relation === "applies_to") return theme.success;
  if (relation === "contrasts_with") return theme.warning;
  if (relation === "part_of") return theme.baseContent;
  return theme.neutral;
}
