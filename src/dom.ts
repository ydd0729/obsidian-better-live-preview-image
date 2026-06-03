const CODEMIRROR_SELECTED_IMAGE_CLASS = "image-alignment-codemirror-selected";

export function isHTMLElement(value: unknown): value is HTMLElement {
  if (!value || typeof value !== "object") {
    return false;
  }

  const ownerDocument = (value as { ownerDocument?: Document }).ownerDocument;
  const HTMLElementConstructor = ownerDocument?.defaultView?.HTMLElement ?? HTMLElement;
  return value instanceof HTMLElementConstructor;
}

export function activateEditBlockButton(editButton: HTMLElement): void {
  const ownerWindow = editButton.ownerDocument.defaultView ?? window;
  for (const eventType of ["mousedown", "mouseup", "click"]) {
    editButton.dispatchEvent(new ownerWindow.MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      button: 0,
      view: ownerWindow
    }));
  }
}

export function selectCodeMirrorImage(imageElement: HTMLElement): void {
  clearCodeMirrorImageSelection(imageElement.ownerDocument);
  imageElement.classList.add(CODEMIRROR_SELECTED_IMAGE_CLASS);
}

export function clearCodeMirrorImageSelection(targetDocument: Document = document): void {
  targetDocument
    .querySelectorAll(`.${CODEMIRROR_SELECTED_IMAGE_CLASS}`)
    .forEach((element) => element.classList.remove(CODEMIRROR_SELECTED_IMAGE_CLASS));
}

export function isInMarkdownContent(element: Element): boolean {
  return Boolean(element.closest(".markdown-source-view, .markdown-preview-view"));
}

export function isInLivePreview(element: Element): boolean {
  return Boolean(element.closest(".markdown-source-view.mod-cm6.is-live-preview"));
}
