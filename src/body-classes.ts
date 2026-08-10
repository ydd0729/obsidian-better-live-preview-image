import type { ImageAlignmentSettings } from "./types";

export function applyImageAlignmentBodyClasses(
  settings: ImageAlignmentSettings,
  targetDocument: Document = document
): void {
  clearImageAlignmentBodyClasses(targetDocument);
  targetDocument.body.classList.add(`image-alignment-default-${settings.defaultAlignment}`);
}

export function clearImageAlignmentBodyClasses(targetDocument: Document = document): void {
  for (const alignment of ["center", "left", "right"] as const) {
    targetDocument.body.classList.remove(`image-alignment-default-${alignment}`);
    targetDocument.body.classList.remove(`image-alignment-menu-default-${alignment}`);
  }
}
