import {
  canvasFallback,
  readCanvasTheme,
  relationColor,
  unitColorsFor,
  type CanvasTheme,
} from "../../lib/kg/themeColors";

export function useKgColors() {
  const themeName = useState<string>("theme", () => "dark");
  const applied = ref(false);

  function currentTheme(): CanvasTheme {
    if (import.meta.client && applied.value) {
      const live = document.documentElement.getAttribute("data-theme");
      if (live === themeName.value) return readCanvasTheme();
    }
    return canvasFallback(themeName.value);
  }

  onMounted(() => {
    const mark = () => {
      applied.value = true;
    };
    mark();
    const observer = new MutationObserver(mark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    onBeforeUnmount(() => observer.disconnect());
  });

  function unitColor(unit: string) {
    return unitColorsFor(unit, currentTheme());
  }

  function edgeColor(relation: string) {
    return relationColor(relation, currentTheme());
  }

  return { themeName, unitColor, edgeColor, currentTheme };
}
