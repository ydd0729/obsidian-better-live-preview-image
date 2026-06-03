import type { ImageAlignmentSettings } from "./types";

export function applyImageAlignmentBodyClasses(
  settings: ImageAlignmentSettings,
  targetDocument: Document = document
): void {
  clearImageAlignmentBodyClasses(targetDocument);
  targetDocument.body.classList.add(`image-alignment-default-${settings.defaultAlignment}`);
  targetDocument.body.classList.toggle(
    "image-alignment-click-image-to-edit",
    settings.clickImageToEditInLivePreview
  );
}

export function clearImageAlignmentBodyClasses(targetDocument: Document = document): void {
  for (const alignment of ["center", "left", "right"] as const) {
    targetDocument.body.classList.remove(`image-alignment-default-${alignment}`);
    targetDocument.body.classList.remove(`image-alignment-menu-default-${alignment}`);
  }
  targetDocument.body.classList.remove("image-alignment-click-image-to-edit");
}
