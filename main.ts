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
  clearCodeMirrorImageSelection,
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
import { revealLivePreviewImageMarkdown } from "./src/live-preview-edit";
import { resizeLivePreviewImageMarkdown } from "./src/live-preview-resize";
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

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new ImageAlignmentSettingTab(this.app, this));
    this.applyDefaultAlignmentClass();
    this.registerAlignmentCommands();

    this.registerDomEvent(document, "contextmenu", (event) => this.captureImageContextMenu(event), true);
    this.registerDomEvent(document, "pointerdown", (event) => this.resizeLivePreviewImageMarkdown(event), true);
    this.registerDomEvent(document, "mousedown", (event) => this.resizeLivePreviewImageMarkdown(event), true);
    this.registerDomEvent(document, "mousedown", (event) => this.captureSelectedImage(event), true);
    this.registerDomEvent(document, "click", (event) => this.revealLivePreviewImageMarkdown(event), true);
  }

  onunload(): void {
    clearCodeMirrorImageSelection();
    clearImageAlignmentBodyClasses();
  }

  getText(): PluginText {
    return getPluginText();
  }

  registerAlignmentCommands(): void {
    for (const alignment of ["left", "center", "right"] as const) {
      this.removeCommand(getAlignmentCommandId(alignment));
    }

    this.addCommand({
      id: getAlignmentCommandId("left"),
      name: this.getText().commandLeft,
      hotkeys: [{ modifiers: ["Mod", "Alt", "Shift"], key: "ArrowLeft" }],
      editorCallback: (editor) => this.alignSelectedOrCurrentImage(editor, "left")
    });

    this.addCommand({
      id: getAlignmentCommandId("center"),
      name: this.getText().commandCenter,
      hotkeys: [{ modifiers: ["Mod", "Alt", "Shift"], key: "ArrowDown" }],
      editorCallback: (editor) => this.alignSelectedOrCurrentImage(editor, "center")
    });

    this.addCommand({
      id: getAlignmentCommandId("right"),
      name: this.getText().commandRight,
      hotkeys: [{ modifiers: ["Mod", "Alt", "Shift"], key: "ArrowRight" }],
      editorCallback: (editor) => this.alignSelectedOrCurrentImage(editor, "right")
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await this.loadData())
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.applyDefaultAlignmentClass();
    this.registerAlignmentCommands();
  }

  applyDefaultAlignmentClass(): void {
    applyImageAlignmentBodyClasses(this.settings);
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
    if (!(target instanceof HTMLElement)) {
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
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const imageElement = target.closest(".image-embed, .internal-embed.image-embed, img");
    this.selectedImageElement =
      imageElement && isInMarkdownContent(imageElement)
        ? imageElement
        : null;
  }

  private revealLivePreviewImageMarkdown(event: MouseEvent): void {
    revealLivePreviewImageMarkdown(event, this.settings.clickImageToEditInLivePreview);
  }

  private resizeLivePreviewImageMarkdown(event: MouseEvent | PointerEvent): void {
    resizeLivePreviewImageMarkdown(
      event,
      this.settings.clickImageToEditInLivePreview,
      (element) =>
        this.findImageTargetFromElement(element) ??
        this.findImageTargetFromSelection()
    );
  }

  private findImageTargetFromElement(element: Element): ImageTarget | null {
    const imageSource = getImageSourceFromElement(element);
    if (!imageSource) {
      return null;
    }

    for (const view of this.getCandidateMarkdownViews()) {
      for (let lineNumber = 0; lineNumber < view.editor.lineCount(); lineNumber += 1) {
        const line = view.editor.getLine(lineNumber);
        const match = findImagesInLine(line).find((candidate) =>
          imageMatchHasSource(candidate.value, imageSource)
        );
        if (match) {
          return {
            editor: view.editor,
            line: lineNumber,
            match
          };
        }
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

  private findImageTargetFromSelectedElement(): ImageTarget | null {
    if (!this.selectedImageElement || !this.selectedImageElement.isConnected) {
      return null;
    }

    return this.findImageTargetFromElement(this.selectedImageElement);
  }

  private findImageTargetFromSelection(): ImageTarget | null {
    for (const view of this.getCandidateMarkdownViews()) {
      const imageTarget = findImageInSelection(view.editor);
      if (imageTarget) {
        return imageTarget;
      }
    }

    return null;
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
