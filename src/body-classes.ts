import type { ImageAlignmentSettings } from "./types";

export function applyImageAlignmentBodyClasses(settings: ImageAlignmentSettings): void {
  clearImageAlignmentBodyClasses();
  document.body.classList.add(`image-alignment-default-${settings.defaultAlignment}`);
  document.body.classList.toggle(
    "image-alignment-click-image-to-edit",
    settings.clickImageToEditInLivePreview
  );
}

export function clearImageAlignmentBodyClasses(): void {
  for (const alignment of ["center", "left", "right"] as const) {
    document.body.classList.remove(`image-alignment-default-${alignment}`);
    document.body.classList.remove(`image-alignment-menu-default-${alignment}`);
  }
  document.body.classList.remove("image-alignment-click-image-to-edit");
}
