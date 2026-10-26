import type { CanvasTheme } from "./themeColors";
import { relationColor } from "./themeColors";

export function graphStylesheet(theme: CanvasTheme) {
  const prerequisite = relationColor("prerequisite", theme);
  const derived = relationColor("derived_from", theme);
  const applies = relationColor("applies_to", theme);
  const contrast = relationColor("contrasts_with", theme);
  const partOf = relationColor("part_of", theme);
  return [
    {
      selector: 'node[kind = "concept"]',
      style: {
        label: "data(label)",
        "background-color": "data(fill)",
        "border-color": "data(color)",
        "border-width": 2,
        color: theme.baseContent,
        "font-family": "ui-sans-serif, system-ui, sans-serif",
        "font-size": 11,
        "font-weight": 600,
        "text-wrap": "wrap",
        "text-max-width": 110,
        "text-valign": "center",
        "text-halign": "center",
        width: 128,
        height: 54,
        shape: "round-rectangle",
        "min-zoomed-font-size": 8,
      },
    },
    {
      selector: 'node[type = "equation"]',
      style: { shape: "diamond", width: 116, height: 80, "text-max-width": 78 },
    },
    {
      selector: 'node[type = "law"]',
      style: { shape: "octagon", width: 124, height: 62 },
    },
    {
      selector: 'node[type = "skill"]',
      style: { shape: "ellipse", width: 122, height: 56 },
    },
    {
      selector: 'node[kind = "unit"]',
      style: {
        label: "data(label)",
        "background-color": "data(color)",
        "background-opacity": theme.dark ? 0.16 : 0.08,
        "border-color": "data(color)",
        "border-width": 2,
        "border-opacity": 0.85,
        shape: "round-rectangle",
        color: theme.baseContent,
        "font-family": "ui-sans-serif, system-ui, sans-serif",
        "font-size": 14,
        "font-weight": 700,
        "text-valign": "top",
        "text-halign": "center",
        "text-margin-y": -18,
        "text-wrap": "ellipsis",
        "text-max-width": 220,
        "text-background-color": theme.base200,
        "text-background-opacity": 0.94,
        "text-background-padding": "3px",
        "text-background-shape": "roundrectangle",
        padding: "18px",
        "min-zoomed-font-size": 6,
        "compound-sizing-wrt-labels": "exclude",
      },
    },
    {
      selector: 'node[kind = "unit"][grouped = "no"]',
      style: {
        "text-valign": "center",
        "text-margin-y": 0,
        "text-background-opacity": 0,
        "text-max-width": 170,
        width: 188,
        height: 52,
        "background-opacity": 0.28,
        "font-size": 12,
        padding: "6px",
      },
    },
    {
      selector: "edge",
      style: {
        width: 1.7,
        "curve-style": "bezier",
        "line-color": prerequisite,
        "target-arrow-color": prerequisite,
        "target-arrow-shape": "triangle",
        "arrow-scale": 0.72,
        opacity: 0.85,
        "line-style": "solid",
        "overlay-padding": "6px",
      },
    },
    {
      selector: 'edge[relation = "prerequisite"]',
      style: { "line-color": prerequisite, "target-arrow-color": prerequisite },
    },
    {
      selector: 'edge[relation = "derived_from"]',
      style: { "line-color": derived, "target-arrow-color": derived },
    },
    {
      selector: 'edge[relation = "applies_to"]',
      style: { "line-color": applies, "target-arrow-color": applies },
    },
    {
      selector: 'edge[relation = "contrasts_with"]',
      style: {
        "line-color": contrast,
        "target-arrow-color": contrast,
        "source-arrow-color": contrast,
        "target-arrow-shape": "none",
        "source-arrow-shape": "none",
      },
    },
    {
      selector: 'edge[relation = "part_of"]',
      style: {
        "line-color": partOf,
        "target-arrow-color": partOf,
        width: 1.15,
        opacity: 0.5,
      },
    },
    {
      selector: 'edge[weak = "yes"]',
      style: { "line-style": "dotted", width: 1.25, opacity: 0.55 },
    },
    {
      selector: 'edge[basis = "inferred"]',
      style: { "line-style": "dashed", "line-dash-pattern": [6, 4], opacity: 0.8 },
    },
    {
      selector: ".faded",
      style: { opacity: 0.12 },
    },
    {
      selector: 'node[kind = "unit"].faded',
      style: {
        opacity: 1,
        "background-opacity": 0.04,
        "border-opacity": 0.25,
        "text-opacity": 0.35,
      },
    },
    {
      selector: "node.highlight",
      style: {
        "border-width": 4,
        "border-color": theme.primary,
        opacity: 1,
        "z-index": 20,
      },
    },
    {
      selector: "node.neighbor",
      style: { opacity: 1, "z-index": 12 },
    },
    {
      selector: "edge.highlight",
      style: {
        width: 3.3,
        opacity: 1,
        "line-color": theme.primary,
        "target-arrow-color": theme.primary,
        "source-arrow-color": theme.primary,
        "z-index": 19,
      },
    },
    {
      selector: "edge.hover",
      style: { width: 3, opacity: 1 },
    },
  ];
}
