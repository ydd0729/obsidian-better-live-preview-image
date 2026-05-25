import { setImageWidth } from "./image-markdown";
import type { ImageTarget } from "./types";
import { isInLivePreview, selectCodeMirrorImage } from "./dom";

type FindImageTarget = (element: Element) => ImageTarget | null;

const MIN_IMAGE_WIDTH = 20;

let isResizeDragActive = false;

export function resizeLivePreviewImageMarkdown(
  event: MouseEvent | PointerEvent,
  isEnabled: boolean,
  findImageTarget: FindImageTarget
): void {
  if (!isEnabled || event.defaultPrevented || event.button !== 0) {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.closest(".image-resize-corner")) {
    return;
  }

  if (isResizeDragActive) {
    stopResizeEvent(event);
    return;
  }

  const imageElement = target.closest<HTMLElement>(".image-embed, .internal-embed.image-embed");
  if (!imageElement || !isInLivePreview(imageElement)) {
    return;
  }

  const image = imageElement.querySelector<HTMLImageElement>("img");
  const imageTarget = findImageTarget(imageElement);
  if (!image || !imageTarget) {
    return;
  }

  stopResizeEvent(event);
  selectCodeMirrorImage(imageElement);
  startResizeDrag(event, image, imageElement, imageTarget);
}

function startResizeDrag(
  event: MouseEvent | PointerEvent,
  image: HTMLImageElement,
  imageElement: HTMLElement,
  imageTarget: ImageTarget
): void {
  const ownerDocument = image.ownerDocument;
  const startClientX = event.clientX;
  const startWidth = getRenderedImageWidth(image);
  const isPointerDrag = isPointerEvent(event);
  const pointerId = isPointerDrag ? event.pointerId : null;
  let currentMatch = imageTarget.match;
  isResizeDragActive = true;

  const updateWidth = (clientX: number): void => {
    const nextWidth = Math.max(MIN_IMAGE_WIDTH, startWidth + clientX - startClientX);
    const nextMarkdown = setImageWidth(currentMatch.value, nextWidth);
    if (nextMarkdown === currentMatch.value) {
      return;
    }

    imageTarget.editor.replaceRange(
      nextMarkdown,
      { line: imageTarget.line, ch: currentMatch.from },
      { line: imageTarget.line, ch: currentMatch.to }
    );
    currentMatch = {
      from: currentMatch.from,
      to: currentMatch.from + nextMarkdown.length,
      value: nextMarkdown
    };
    imageTarget.editor.setSelection(
      { line: imageTarget.line, ch: currentMatch.from },
      { line: imageTarget.line, ch: currentMatch.to }
    );
    selectCodeMirrorImage(imageElement);
    requestAnimationFrame(() => {
      imageTarget.editor.setSelection(
        { line: imageTarget.line, ch: currentMatch.from },
        { line: imageTarget.line, ch: currentMatch.to }
      );
      if (imageElement.isConnected) {
        selectCodeMirrorImage(imageElement);
      }
    });
  };

  const handleMouseMove = (moveEvent: MouseEvent): void => {
    stopResizeEvent(moveEvent);
    updateWidth(moveEvent.clientX);
  };

  const handlePointerMove = (moveEvent: PointerEvent): void => {
    if (pointerId !== moveEvent.pointerId) {
      return;
    }

    stopResizeEvent(moveEvent);
    updateWidth(moveEvent.clientX);
  };

  const stopResizeDrag = (stopEvent: MouseEvent): void => {
    stopResizeEvent(stopEvent);
    isResizeDragActive = false;
    ownerDocument.removeEventListener("mousemove", handleMouseMove, true);
    ownerDocument.removeEventListener("mouseup", stopResizeDrag, true);
    ownerDocument.removeEventListener("pointermove", handlePointerMove, true);
    ownerDocument.removeEventListener("pointerup", stopResizeDrag, true);
    ownerDocument.removeEventListener("pointercancel", stopResizeDrag, true);
  };

  if (isPointerDrag) {
    ownerDocument.addEventListener("pointermove", handlePointerMove, true);
    ownerDocument.addEventListener("pointerup", stopResizeDrag, true);
    ownerDocument.addEventListener("pointercancel", stopResizeDrag, true);
    return;
  }

  ownerDocument.addEventListener("mousemove", handleMouseMove, true);
  ownerDocument.addEventListener("mouseup", stopResizeDrag, true);
}

function getRenderedImageWidth(image: HTMLImageElement): number {
  const renderedWidth = image.getBoundingClientRect().width;
  if (renderedWidth > 0) {
    return renderedWidth;
  }

  const width = Number(image.getAttribute("width"));
  if (Number.isFinite(width) && width > 0) {
    return width;
  }

  return Math.max(MIN_IMAGE_WIDTH, image.naturalWidth);
}

function isPointerEvent(event: MouseEvent | PointerEvent): event is PointerEvent {
  return typeof PointerEvent !== "undefined" && event instanceof PointerEvent;
}

function stopResizeEvent(event: MouseEvent | PointerEvent): void {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}
