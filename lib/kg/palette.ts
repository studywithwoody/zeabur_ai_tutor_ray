import { DARK_CANVAS, unitColorsFor } from "./themeColors";

/** Stable fallback used while building graph elements. The canvas repaints from DaisyUI variables. */
export function unitColors(unit: string): { accent: string; fill: string } {
  return unitColorsFor(unit, DARK_CANVAS);
}
