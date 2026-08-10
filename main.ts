import {
  Editor,
  MarkdownView,
  Menu,
  Notice,
  Plugin,
} from "obsidian";
import {
  applyImageAlignmentBodyClasses,
  clearImageAlignmentBodyClasses,
} from "./src/body-classes";
import {
  isHTMLElement,
  isInMarkdownContent,
} from "./src/dom";
import {
  findImageInSelection,
  findImageNearPosition,
  findImagesInLine,
  getImageSourceFromElement,
  imageMatchHasSource,
  setImageAlignment,
} from "./src/image-markdown";
import { clearCalloutImageSizeSync, syncCalloutImageSizes } from "./src/image-size";
import {
  clearLivePreviewImageEditPreviews,
  preserveLivePreviewImageDuringNativeEdit,
} from "./src/live-preview-edit";
import { getPluginText, type PluginText } from "./src/plugin-text";
import { ImageAlignmentSettingTab } from "./src/setting-tab";
import {
  DEFAULT_SETTINGS,
  type ImageAlignment,
  type ImageAlignmentSettings,
  type ImageTarget,
} from "./src/types";

export default class ImageAlignmentPlugin extends Plugin {
  settings: ImageAlignmentSettings = DEFAULT_SETTINGS;
  private selectedImageElement: Element | null = null;
  private registeredDocuments = new Set<Document>();
  private calloutImageSizeObservers = new Map<Document, MutationObserver>();

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new ImageAlignmentSettingTab(this.app, this));
    this.registerWorkspaceDocumentEvents();
    this.registerAlignmentCommands();
  }

  onunload(): void {
    for (const targetDocument of this.registeredDocuments) {
      clearImageAlignmentBodyClasses(targetDocument);
      clearCalloutImageSizeSync(targetDocument);
      clearLivePreviewImageEditPreviews(targetDocument);
    }
    this.disconnectCalloutImageSizeObservers();
  }

  getText(): PluginText {
    return getPluginText();
  }

  registerAlignmentCommands(): void {
    this.addCommand({
      id: getAlignmentCommandId("left"),
      name: this.getText().commandLeft,
      editorCallback: (editor) => this.alignSelectedOrCurrentImage(editor, "left")
    });

    this.addCommand({
      id: getAlignmentCommandId("center"),
      name: this.getText().commandCenter,
      editorCallback: (editor) => this.alignSelectedOrCurrentImage(editor, "center")
    });

    this.addCommand({
      id: getAlignmentCommandId("right"),
      name: this.getText().commandRight,
      editorCallback: (editor) => this.alignSelectedOrCurrentImage(editor, "right")
    });
  }

  async loadSettings(): Promise<void> {
    const savedSettings = (await this.loadData()) as Partial<ImageAlignmentSettings> | null;
    this.settings = {
      defaultAlignment: savedSettings?.defaultAlignment ?? DEFAULT_SETTINGS.defaultAlignment,
      syncCalloutImageSizes:
        savedSettings?.syncCalloutImageSizes ?? DEFAULT_SETTINGS.syncCalloutImageSizes
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.applyDefaultAlignmentClass();
    this.applyCalloutImageSizeSyncSetting();
  }

  applyDefaultAlignmentClass(): void {
    for (const targetDocument of this.registeredDocuments) {
      applyImageAlignmentBodyClasses(this.settings, targetDocument);
    }
  }

  private registerWorkspaceDocumentEvents(): void {
    this.app.workspace.onLayoutReady(() => this.registerExistingWorkspaceDocuments());
    this.registerDocumentEvents(document);
    this.registerEvent(this.app.workspace.on("window-open", (_workspaceWindow, targetWindow) => {
      this.registerDocumentEvents(targetWindow.document);
    }));
    this.registerEvent(this.app.workspace.on("window-close", (_workspaceWindow, targetWindow) => {
      clearImageAlignmentBodyClasses(targetWindow.document);
      clearLivePreviewImageEditPreviews(targetWindow.document);
      this.disableCalloutImageSizeSync(targetWindow.document);
      this.registeredDocuments.delete(targetWindow.document);
    }));
  }

  private registerExistingWorkspaceDocuments(): void {
    const documents = new Set<Document>([document]);
    this.app.workspace.iterateAllLeaves((leaf) => {
      documents.add(leaf.getContainer().doc);
    });

    for (const targetDocument of documents) {
      this.registerDocumentEvents(targetDocument);
    }
  }

  private registerDocumentEvents(targetDocument: Document): void {
    if (this.registeredDocuments.has(targetDocument)) {
      return;
    }

    this.registeredDocuments.add(targetDocument);
    applyImageAlignmentBodyClasses(this.settings, targetDocument);
    this.applyCalloutImageSizeSyncSetting(targetDocument);
    this.registerDomEvent(targetDocument, "contextmenu", (event) => this.captureImageContextMenu(event), true);
    this.registerDomEvent(targetDocument, "mousedown", (event) => this.captureSelectedImage(event), true);
    this.registerDomEvent(targetDocument, "pointerdown", (event) => {
      preserveLivePreviewImageDuringNativeEdit(event, this.settings.defaultAlignment);
    }, true);
    this.registerDomEvent(targetDocument, "click", (event) => {
      preserveLivePreviewImageDuringNativeEdit(event, this.settings.defaultAlignment);
    }, true);
  }

  private applyCalloutImageSizeSyncSetting(targetDocument?: Document): void {
    const documents = targetDocument ? [targetDocument] : Array.from(this.registeredDocuments);

    for (const documentToUpdate of documents) {
      if (this.settings.syncCalloutImageSizes) {
        this.enableCalloutImageSizeSync(documentToUpdate);
      } else {
        this.disableCalloutImageSizeSync(documentToUpdate);
      }
    }
  }

  private enableCalloutImageSizeSync(targetDocument: Document): void {
    syncCalloutImageSizes(targetDocument);

    if (this.calloutImageSizeObservers.has(targetDocument)) {
      return;
    }

    const ownerWindow = targetDocument.defaultView ?? window;
    const observer = new ownerWindow.MutationObserver(() => syncCalloutImageSizes(targetDocument));
    observer.observe(targetDocument.body, {
      attributeFilter: ["height", "src", "width"],
      attributes: true,
      childList: true,
      subtree: true
    });
    this.calloutImageSizeObservers.set(targetDocument, observer);
    this.register(() => observer.disconnect());
  }

  private disableCalloutImageSizeSync(targetDocument: Document): void {
    this.calloutImageSizeObservers.get(targetDocument)?.disconnect();
    this.calloutImageSizeObservers.delete(targetDocument);
    clearCalloutImageSizeSync(targetDocument);
  }

  private disconnectCalloutImageSizeObservers(): void {
    for (const observer of this.calloutImageSizeObservers.values()) {
      observer.disconnect();
    }
    this.calloutImageSizeObservers.clear();
  }

  private alignSelectedOrCurrentImage(editor: Editor, alignment: ImageAlignment): void {
    const selectedTarget =
      this.findImageTargetFromSelectedElement() ??
      findImageInSelection(editor);
    if (selectedTarget) {
      this.alignImageTarget(selectedTarget, alignment);
      return;
    }

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const match = findImageNearPosition(line, cursor.ch);

    if (!match) {
      new Notice(this.getText().noImage);
      return;
    }

    editor.replaceRange(
      setImageAlignment(match.value, alignment, this.settings.defaultAlignment),
      { line: cursor.line, ch: match.from },
      { line: cursor.line, ch: match.to }
    );
    this.showAlignedNotice(alignment);
  }

  private captureImageContextMenu(event: MouseEvent): void {
    const target = event.target;
    if (!isHTMLElement(target)) {
      return;
    }

    const imageElement = target.closest(".image-embed, .internal-embed.image-embed, img");
    if (!imageElement || !isInMarkdownContent(imageElement)) {
      return;
    }

    const imageTarget = this.findImageTargetFromElement(imageElement);
    if (!imageTarget) {
      return;
    }

    const menu = Menu.forEvent(event);
    menu.addSeparator();
    for (const alignment of ["left", "center", "right"] as const) {
      menu.addItem((item) => {
        item
          .setTitle(this.getText().menuTitle(alignment))
          .onClick(() => this.alignImageTarget(imageTarget, alignment));
      });
    }
  }

  private captureSelectedImage(event: MouseEvent): void {
    const target = event.target;
    if (!isHTMLElement(target)) {
      return;
    }

    const imageElement = target.closest(".image-embed, .internal-embed.image-embed, img");
    this.selectedImageElement =
      imageElement && isInMarkdownContent(imageElement)
        ? imageElement
        : null;
  }

  private findImageTargetFromElement(element: Element): ImageTarget | null {
    const imageSource = getImageSourceFromElement(element);
    if (!imageSource) {
      return null;
    }

    const owningView = this.getMarkdownViewContainingElement(element);
    if (owningView) {
      const occurrenceIndex = this.getImageSourceOccurrenceIndex(owningView, element, imageSource);
      if (occurrenceIndex !== null) {
        return this.findImageTargetBySource(owningView, imageSource, occurrenceIndex);
      }

      return this.findImageTargetBySource(owningView, imageSource, 0);
    }

    for (const view of this.getCandidateMarkdownViews()) {
      const imageTarget = this.findImageTargetBySource(view, imageSource, 0);
      if (imageTarget) {
        return imageTarget;
      }
    }

    return null;
  }

  private getCandidateMarkdownViews(): MarkdownView[] {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const views = activeView ? [activeView] : [];

    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      if (leaf.view instanceof MarkdownView && !views.includes(leaf.view)) {
        views.push(leaf.view);
      }
    }

    return views;
  }

  private getMarkdownViewContainingElement(element: Element): MarkdownView | null {
    return this.getCandidateMarkdownViews().find((view) => view.containerEl.contains(element)) ?? null;
  }

  private getImageSourceOccurrenceIndex(
    view: MarkdownView,
    element: Element,
    imageSource: string
  ): number | null {
    const targetImageElement = element.closest(".image-embed") ?? element;
    let occurrenceIndex = 0;

    for (const imageElement of view.containerEl.querySelectorAll<Element>(".image-embed")) {
      if (!isInMarkdownContent(imageElement) || getImageSourceFromElement(imageElement) !== imageSource) {
        continue;
      }

      if (imageElement === targetImageElement || imageElement.contains(targetImageElement)) {
        return occurrenceIndex;
      }

      occurrenceIndex += 1;
    }

    return null;
  }

  private findImageTargetBySource(
    view: MarkdownView,
    imageSource: string,
    occurrenceIndex: number
  ): ImageTarget | null {
    let remainingMatches = occurrenceIndex;

    for (let lineNumber = 0; lineNumber < view.editor.lineCount(); lineNumber += 1) {
      const line = view.editor.getLine(lineNumber);
      for (const match of findImagesInLine(line)) {
        if (!imageMatchHasSource(match.value, imageSource)) {
          continue;
        }

        if (remainingMatches === 0) {
          return {
            editor: view.editor,
            line: lineNumber,
            match
          };
        }

        remainingMatches -= 1;
      }
    }

    return null;
  }

  private findImageTargetFromSelectedElement(): ImageTarget | null {
    if (!this.selectedImageElement || !this.selectedImageElement.isConnected) {
      return null;
    }

    return this.findImageTargetFromElement(this.selectedImageElement);
  }

  private alignImageTarget(target: ImageTarget, alignment: ImageAlignment): void {
    target.editor.replaceRange(
      setImageAlignment(target.match.value, alignment, this.settings.defaultAlignment),
      { line: target.line, ch: target.match.from },
      { line: target.line, ch: target.match.to }
    );
    this.showAlignedNotice(alignment);
  }

  private showAlignedNotice(alignment: ImageAlignment): void {
    new Notice(this.getText().alignedNotice(alignment));
  }
}

function getAlignmentCommandId(alignment: ImageAlignment): string {
  return `align-current-image-${alignment}`;
}
