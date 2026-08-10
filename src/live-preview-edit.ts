import { isElement } from "./dom";
import type { ImageAlignment } from "./types";

const EDIT_TOOLTIP_ALIGNMENT_ATTRIBUTE = "data-image-alignment-live-preview-edit";

interface NativeEditAlignmentState {
  activationTimeoutId: number | null;
  alignment: ImageAlignment;
  mutationObserver: MutationObserver;
  previousTooltip: HTMLElement | null;
  resizeObserver: ResizeObserver;
  targetTop: number;
  tooltip: HTMLElement | null;
  translateX: number | null;
  translateY: number | null;
}

const nativeEditAlignmentStates = new Map<HTMLElement, NativeEditAlignmentState>();
const originalTooltipTranslations = new WeakMap<HTMLElement, string>();

export function preserveLivePreviewImageDuringNativeEdit(
  event: MouseEvent | PointerEvent,
  defaultAlignment: ImageAlignment
): void {
  if (event.button !== 0) {
    return;
  }

  const target = event.target;
  if (!isElement(target)) {
    return;
  }

  const editButton = target.closest<HTMLElement>(".edit-block-button");
  if (!editButton) {
    // Obsidian removes the native tooltip after the new selection is applied.
    // Clearing it during pointerdown causes one frame at Obsidian's left position.
    return;
  }

  const imageElement = editButton.closest<HTMLElement>(".image-embed");
  const sourceView = imageElement?.closest<HTMLElement>(
    ".markdown-source-view.mod-cm6.is-live-preview"
  );
  if (!imageElement || !sourceView) {
    return;
  }

  if (event.type === "click" && nativeEditAlignmentStates.has(sourceView)) {
    return;
  }

  startNativeEditAlignment(
    sourceView,
    getImageAlignment(imageElement, defaultAlignment),
    imageElement.getBoundingClientRect().top
  );
}

export function clearLivePreviewImageEditPreviews(
  targetDocument: Document = document
): void {
  for (const sourceView of nativeEditAlignmentStates.keys()) {
    if (sourceView.ownerDocument === targetDocument) {
      clearNativeEditAlignment(sourceView);
    }
  }
}

function startNativeEditAlignment(
  sourceView: HTMLElement,
  alignment: ImageAlignment,
  targetTop: number
): void {
  const previousTooltip = findNativeEditTooltips(sourceView)[0] ?? null;
  // Keep the old tooltip aligned until Obsidian replaces it with the new one.
  // Removing its styles here causes a one-frame snap during direct switching.
  disposeNativeEditAlignment(sourceView, false);

  const ownerWindow = sourceView.ownerDocument.defaultView ?? window;
  const state: NativeEditAlignmentState = {
    activationTimeoutId: null,
    alignment,
    mutationObserver: new ownerWindow.MutationObserver(() => {
      syncNativeEditTooltip(sourceView);
    }),
    previousTooltip,
    resizeObserver: new ownerWindow.ResizeObserver(() => {
      positionNativeEditTooltip(sourceView);
    }),
    targetTop,
    tooltip: null,
    translateX: null,
    translateY: null
  };

  state.mutationObserver.observe(sourceView, {
    childList: true,
    subtree: true
  });
  nativeEditAlignmentStates.set(sourceView, state);
  ownerWindow.setTimeout(() => syncNativeEditTooltip(sourceView), 0);
  state.activationTimeoutId = ownerWindow.setTimeout(() => {
    const currentState = nativeEditAlignmentStates.get(sourceView);
    if (!currentState || currentState.tooltip) {
      return;
    }

    disposeNativeEditAlignment(
      sourceView,
      !currentState.previousTooltip?.isConnected
    );
  }, 1000);
}

function syncNativeEditTooltip(sourceView: HTMLElement): void {
  const state = nativeEditAlignmentStates.get(sourceView);
  if (!state) {
    return;
  }

  if (state.previousTooltip && !state.previousTooltip.isConnected) {
    clearTooltipAlignment(state.previousTooltip);
    state.previousTooltip = null;
  }

  const tooltip = findNativeEditTooltips(sourceView).find(
    (candidate) => candidate !== state.previousTooltip
  ) ?? null;

  if (!tooltip) {
    if (state.tooltip && !state.tooltip.isConnected) {
      clearNativeEditAlignment(sourceView);
    }
    return;
  }

  if (state.tooltip !== tooltip) {
    clearTooltipAlignment(state.tooltip);
    state.resizeObserver.disconnect();
    state.translateX = null;
    state.translateY = null;
    state.tooltip = tooltip;
    state.resizeObserver.observe(tooltip);

    const content = sourceView.querySelector<HTMLElement>(".cm-content");
    if (content) {
      state.resizeObserver.observe(content);
    }
  }

  if (state.activationTimeoutId !== null) {
    (sourceView.ownerDocument.defaultView ?? window).clearTimeout(
      state.activationTimeoutId
    );
    state.activationTimeoutId = null;
  }

  tooltip.setAttribute(EDIT_TOOLTIP_ALIGNMENT_ATTRIBUTE, state.alignment);
  positionNativeEditTooltip(sourceView);
}

function positionNativeEditTooltip(sourceView: HTMLElement): void {
  const state = nativeEditAlignmentStates.get(sourceView);
  const tooltip = state?.tooltip;
  const content = sourceView.querySelector<HTMLElement>(".cm-content");
  if (!state || !tooltip || !content) {
    return;
  }

  const contentRect = content.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  let targetLeft = contentRect.left;

  if (state.alignment === "center") {
    targetLeft += (contentRect.width - tooltipRect.width) / 2;
  } else if (state.alignment === "right") {
    targetLeft = contentRect.right - tooltipRect.width;
  }

  const nativeLeft = tooltipRect.left - (state.translateX ?? 0);
  state.translateX = targetLeft - nativeLeft;

  if (state.translateY === null) {
    state.translateY = state.targetTop - tooltipRect.top;
  }

  setTooltipTranslation(tooltip, state.translateX, state.translateY);
}

function clearNativeEditAlignment(sourceView: HTMLElement): void {
  disposeNativeEditAlignment(sourceView, true);
}

function disposeNativeEditAlignment(
  sourceView: HTMLElement,
  shouldClearTooltips: boolean
): void {
  const state = nativeEditAlignmentStates.get(sourceView);
  if (!state) {
    return;
  }

  state.mutationObserver.disconnect();
  state.resizeObserver.disconnect();
  if (state.activationTimeoutId !== null) {
    (sourceView.ownerDocument.defaultView ?? window).clearTimeout(
      state.activationTimeoutId
    );
  }
  if (shouldClearTooltips) {
    clearTooltipAlignment(state.previousTooltip);
    clearTooltipAlignment(state.tooltip);
  }
  nativeEditAlignmentStates.delete(sourceView);
}

function findNativeEditTooltips(sourceView: HTMLElement): HTMLElement[] {
  return Array.from(
    sourceView.querySelectorAll<HTMLElement>(".cm-image-reveal-tooltip")
  ).filter((candidate) => candidate.querySelector(".image-embed"));
}

function clearTooltipAlignment(tooltip: HTMLElement | null): void {
  if (!tooltip) {
    return;
  }

  tooltip.removeAttribute(EDIT_TOOLTIP_ALIGNMENT_ATTRIBUTE);
  const originalTranslation = originalTooltipTranslations.get(tooltip);
  if (originalTranslation === undefined) {
    return;
  }

  if (originalTranslation) {
    tooltip.style.setProperty("translate", originalTranslation);
  } else {
    tooltip.style.removeProperty("translate");
  }
  originalTooltipTranslations.delete(tooltip);
}

function setTooltipTranslation(
  tooltip: HTMLElement,
  translateX: number,
  translateY: number
): void {
  if (!originalTooltipTranslations.has(tooltip)) {
    originalTooltipTranslations.set(
      tooltip,
      tooltip.style.getPropertyValue("translate")
    );
  }

  tooltip.style.setProperty("translate", `${translateX}px ${translateY}px`);
}

function getImageAlignment(
  imageElement: HTMLElement,
  defaultAlignment: ImageAlignment
): ImageAlignment {
  const alignment = (imageElement.getAttribute("alt") ?? "")
    .split("|")
    .map((token) => token.trim().toLowerCase())
    .find((token): token is ImageAlignment =>
      token === "left" || token === "center" || token === "right"
    );

  return alignment ?? defaultAlignment;
}
