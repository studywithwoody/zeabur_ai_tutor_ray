export interface PickedConcept {
  conceptId: string;
  label: string;
  type: string;
  unitName: string;
  isPrimary: boolean;
  confirmed: boolean;
  taggedBy: "manual" | "ai";
}
