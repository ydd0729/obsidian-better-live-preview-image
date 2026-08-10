export function isHTMLElement(value: unknown): value is HTMLElement {
  if (!value || typeof value !== "object") {
    return false;
  }

  const ownerDocument = (value as { ownerDocument?: Document }).ownerDocument;
  const HTMLElementConstructor = ownerDocument?.defaultView?.HTMLElement ?? HTMLElement;
  return value instanceof HTMLElementConstructor;
}

export function isElement(value: unknown): value is Element {
  if (!value || typeof value !== "object") {
    return false;
  }

  const ownerDocument = (value as { ownerDocument?: Document }).ownerDocument;
  const ElementConstructor = ownerDocument?.defaultView?.Element ?? Element;
  return value instanceof ElementConstructor;
}

export function isInMarkdownContent(element: Element): boolean {
  return Boolean(element.closest(".markdown-source-view, .markdown-preview-view"));
}
