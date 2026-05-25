import {
  activateEditBlockButton,
  clearCodeMirrorImageSelection,
  isInLivePreview,
  selectCodeMirrorImage,
} from "./dom";

export function revealLivePreviewImageMarkdown(event: MouseEvent, isEnabled: boolean): void {
  if (!isEnabled || event.defaultPrevented || event.button !== 0) {
    return;
  }

  const target = event.target;
  if (
    !(target instanceof HTMLElement) ||
    target.closest(".edit-block-button, .image-resize-corner")
  ) {
    return;
  }

  const imageElement = target.closest<HTMLElement>(".image-embed, .internal-embed.image-embed");
  if (!imageElement || !isInLivePreview(imageElement)) {
    clearCodeMirrorImageSelection();
    return;
  }

  const editButton = imageElement.querySelector<HTMLElement>(".edit-block-button");
  if (!editButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  selectCodeMirrorImage(imageElement);
  activateEditBlockButton(editButton);
}
