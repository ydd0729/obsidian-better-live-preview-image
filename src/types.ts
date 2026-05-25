import type { Editor } from "obsidian";

export type ImageAlignment = "center" | "left" | "right";

export interface ImageMatch {
  from: number;
  to: number;
  value: string;
}

export interface ImageTarget {
  editor: Editor;
  line: number;
  match: ImageMatch;
}

export interface ImageAlignmentSettings {
  defaultAlignment: ImageAlignment;
  clickImageToEditInLivePreview: boolean;
}

export const DEFAULT_SETTINGS: ImageAlignmentSettings = {
  defaultAlignment: "center",
  clickImageToEditInLivePreview: false
};
