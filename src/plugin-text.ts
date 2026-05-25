import { getLanguage } from "obsidian";
import type { ImageAlignment } from "./types";

type PluginLanguage = "en" | "zh";

export interface PluginText {
  alignmentLabels: Record<ImageAlignment, string>;
  alignedNotice(alignment: ImageAlignment): string;
  commandCenter: string;
  commandLeft: string;
  commandRight: string;
  clickImageToEditDesc: string;
  clickImageToEditName: string;
  defaultAlignmentDesc: string;
  defaultAlignmentName: string;
  menuTitle(alignment: ImageAlignment): string;
  noImage: string;
}

const PLUGIN_TEXT: Record<PluginLanguage, PluginText> = {
  en: {
    alignmentLabels: {
      center: "Center",
      left: "Left",
      right: "Right"
    },
    alignedNotice: (alignment) =>
      `Image alignment set to ${PLUGIN_TEXT.en.alignmentLabels[alignment].toLowerCase()}.`,
    commandCenter: "Set current image centered",
    commandLeft: "Set current image left aligned",
    commandRight: "Set current image right aligned",
    clickImageToEditDesc: "When enabled, hide the image edit button in Live Preview and reveal the image Markdown when you click the image.",
    clickImageToEditName: "Click image to edit Markdown in Live Preview",
    defaultAlignmentDesc: "Images without an explicit alignment marker use this default.",
    defaultAlignmentName: "Default image alignment",
    menuTitle: (alignment) => `Align image ${PLUGIN_TEXT.en.alignmentLabels[alignment].toLowerCase()}`,
    noImage: "No image found on the current selection or cursor line."
  },
  zh: {
    alignmentLabels: {
      center: "居中",
      left: "左对齐",
      right: "右对齐"
    },
    alignedNotice: (alignment) => `图片已设置为${PLUGIN_TEXT.zh.alignmentLabels[alignment]}。`,
    commandCenter: "将当前图片居中",
    commandLeft: "将当前图片左对齐",
    commandRight: "将当前图片右对齐",
    clickImageToEditDesc: "开启后，在实时预览中隐藏图片编辑按钮，点击图片时直接显示这张图片的 Markdown 链接。",
    clickImageToEditName: "实时预览中点击图片编辑 Markdown",
    defaultAlignmentDesc: "没有显式对齐标记的图片会使用这个默认值。",
    defaultAlignmentName: "默认图片对齐",
    menuTitle: (alignment) => `图片${PLUGIN_TEXT.zh.alignmentLabels[alignment]}`,
    noImage: "当前选区或光标所在行没有可设置对齐的图片。"
  }
};

export function getPluginText(): PluginText {
  return PLUGIN_TEXT[getPluginLanguage()];
}

function getPluginLanguage(): PluginLanguage {
  return getLanguage().toLowerCase().startsWith("zh") ? "zh" : "en";
}
