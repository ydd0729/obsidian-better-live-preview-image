const CODEMIRROR_SELECTED_IMAGE_CLASS = "image-alignment-codemirror-selected";

export function activateEditBlockButton(editButton: HTMLElement): void {
  for (const eventType of ["mousedown", "mouseup", "click"]) {
    editButton.dispatchEvent(new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      button: 0,
      view: window
    }));
  }
}

export function selectCodeMirrorImage(imageElement: HTMLElement): void {
  clearCodeMirrorImageSelection();
  imageElement.classList.add(CODEMIRROR_SELECTED_IMAGE_CLASS);
}

export function clearCodeMirrorImageSelection(): void {
  document
    .querySelectorAll(`.${CODEMIRROR_SELECTED_IMAGE_CLASS}`)
    .forEach((element) => element.classList.remove(CODEMIRROR_SELECTED_IMAGE_CLASS));
}

export function isInMarkdownContent(element: Element): boolean {
  return Boolean(element.closest(".markdown-source-view, .markdown-preview-view"));
}

export function isInLivePreview(element: Element): boolean {
  return Boolean(element.closest(".markdown-source-view.mod-cm6.is-live-preview"));
}
