const CALLOUT_IMAGE_SELECTOR = [
  ".markdown-preview-view .callout .image-embed",
  ".markdown-source-view.mod-cm6.is-live-preview .callout .image-embed",
  ".markdown-source-view.mod-cm6.is-live-preview .HyperMD-quote > .image-embed"
].join(", ");
const SYNCED_IMAGE_SIZE_ATTRIBUTE = "data-image-alignment-callout-size-synced";

export function syncCalloutImageSizes(targetDocument: Document = document): void {
  for (const imageElement of targetDocument.querySelectorAll<HTMLElement>(CALLOUT_IMAGE_SELECTOR)) {
    syncImageSize(imageElement);
  }
}

export function clearCalloutImageSizeSync(targetDocument: Document = document): void {
  for (const image of targetDocument.querySelectorAll<HTMLImageElement>(`img[${SYNCED_IMAGE_SIZE_ATTRIBUTE}]`)) {
    clearSyncedImageSize(image);
  }
}

function syncImageSize(imageElement: HTMLElement): void {
  const image = imageElement.querySelector<HTMLImageElement>("img");
  if (!image) {
    return;
  }

  const width = getPositiveIntegerAttribute(imageElement, "width") ?? getPositiveIntegerAttribute(image, "width");
  const height = getPositiveIntegerAttribute(imageElement, "height") ?? getPositiveIntegerAttribute(image, "height");

  if (!width) {
    clearSyncedImageSize(image);
    return;
  }

  image.setAttribute(SYNCED_IMAGE_SIZE_ATTRIBUTE, "");
  image.setCssProps({
    "--image-alignment-synced-width": `${width}px`,
    "--image-alignment-synced-height": height ? `${height}px` : "auto"
  });
}

function clearSyncedImageSize(image: HTMLImageElement): void {
  image.setCssProps({
    "--image-alignment-synced-width": "",
    "--image-alignment-synced-height": ""
  });
  image.removeAttribute(SYNCED_IMAGE_SIZE_ATTRIBUTE);
}

function getPositiveIntegerAttribute(element: Element, attribute: string): number | null {
  const value = Number(element.getAttribute(attribute));
  return Number.isInteger(value) && value > 0 ? value : null;
}
