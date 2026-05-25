import type { Editor } from "obsidian";
import type { ImageAlignment, ImageMatch, ImageTarget } from "./types";

const WIKI_IMAGE_PATTERN = /!\[\[(.*?)\]\]/g;
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g;
const ALIGNMENT_TOKENS = new Set(["left", "right", "center"]);
const SIZE_TOKEN_PATTERN = /^\d+(?:x\d+)?$/;

export function findImageNearPosition(line: string, ch: number): ImageMatch | null {
  const matches = findImagesInLine(line);
  if (matches.length === 0) {
    return null;
  }

  const containing = matches.find((match) => match.from <= ch && ch <= match.to);
  if (containing) {
    return containing;
  }

  return matches.reduce((nearest, match) => {
    const nearestDistance = distanceToRange(ch, nearest.from, nearest.to);
    const matchDistance = distanceToRange(ch, match.from, match.to);
    return matchDistance < nearestDistance ? match : nearest;
  });
}

export function findImagesInLine(line: string): ImageMatch[] {
  const matches: ImageMatch[] = [];

  for (const match of line.matchAll(WIKI_IMAGE_PATTERN)) {
    if (match.index === undefined) {
      continue;
    }
    matches.push({
      from: match.index,
      to: match.index + match[0].length,
      value: match[0]
    });
  }

  for (const match of line.matchAll(MARKDOWN_IMAGE_PATTERN)) {
    if (match.index === undefined) {
      continue;
    }
    matches.push({
      from: match.index,
      to: match.index + match[0].length,
      value: match[0]
    });
  }

  return matches.sort((a, b) => a.from - b.from);
}

export function findImageInSelection(editor: Editor): ImageTarget | null {
  const selection = editor.getSelection();
  if (!selection) {
    return null;
  }

  const from = editor.getCursor("from");
  const selectedLines = selection.split(/\r?\n/);
  for (let lineOffset = 0; lineOffset < selectedLines.length; lineOffset += 1) {
    const matches = findImagesInLine(selectedLines[lineOffset]);
    const match = matches[0];
    if (!match) {
      continue;
    }

    const line = from.line + lineOffset;
    const chOffset = lineOffset === 0 ? from.ch : 0;
    return {
      editor,
      line,
      match: {
        from: chOffset + match.from,
        to: chOffset + match.to,
        value: match.value
      }
    };
  }

  return null;
}

export function setImageAlignment(
  markdown: string,
  alignment: ImageAlignment,
  defaultAlignment: ImageAlignment
): string {
  if (markdown.startsWith("![[")) {
    return setWikiImageAlignment(markdown, alignment, defaultAlignment);
  }
  return setMarkdownImageAlignment(markdown, alignment, defaultAlignment);
}

export function setImageWidth(markdown: string, width: number): string {
  const widthToken = String(Math.max(1, Math.round(width)));
  if (markdown.startsWith("![[")) {
    return setWikiImageWidth(markdown, widthToken);
  }
  return setMarkdownImageWidth(markdown, widthToken);
}

export function getImageSourceFromElement(element: Element): string | null {
  const embed = element.closest(".image-embed") ?? element;
  const source = embed.getAttribute("src") ?? element.getAttribute("src");
  if (!source) {
    return null;
  }

  return decodeURIComponent(source)
    .replace(/^app:\/\/[^/]+\//, "")
    .replace(/^.*[\\/](?=attachments[\\/])/, "")
    .replace(/\\/g, "/");
}

export function imageMatchHasSource(markdown: string, imageSource: string): boolean {
  return getImageSourceFromMarkdown(markdown) === imageSource;
}

function distanceToRange(ch: number, from: number, to: number): number {
  if (ch < from) {
    return from - ch;
  }
  if (ch > to) {
    return ch - to;
  }
  return 0;
}

function setWikiImageAlignment(
  markdown: string,
  alignment: ImageAlignment,
  defaultAlignment: ImageAlignment
): string {
  const inner = markdown.slice(3, -2);
  const parts = inner.split("|");
  const target = parts.shift() ?? "";
  const modifiers = removeAlignmentTokens(parts);

  if (alignment !== defaultAlignment) {
    modifiers.unshift(alignment);
  }

  return modifiers.length > 0
    ? `![[${[target, ...modifiers].join("|")}]]`
    : `![[${target}]]`;
}

function setMarkdownImageAlignment(
  markdown: string,
  alignment: ImageAlignment,
  defaultAlignment: ImageAlignment
): string {
  const match = markdown.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!match) {
    return markdown;
  }

  const altParts = match[1].split("|").filter((part) => part.length > 0);
  const alt = removeAlignmentTokens(altParts);
  if (alignment !== defaultAlignment) {
    alt.unshift(alignment);
  }

  return `![${alt.join("|")}](${match[2]})`;
}

function setWikiImageWidth(markdown: string, widthToken: string): string {
  const inner = markdown.slice(3, -2);
  const parts = inner.split("|");
  const target = parts.shift() ?? "";
  const modifiers = setWidthToken(parts, widthToken);

  return `![[${[target, ...modifiers].join("|")}]]`;
}

function setMarkdownImageWidth(markdown: string, widthToken: string): string {
  const match = markdown.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!match) {
    return markdown;
  }

  const altParts = match[1].split("|").filter((part) => part.length > 0);
  return `![${setWidthToken(altParts, widthToken).join("|")}](${match[2]})`;
}

function setWidthToken(values: string[], widthToken: string): string[] {
  let hasSize = false;
  const updated = values.map((value) => {
    const trimmedValue = value.trim();
    if (!SIZE_TOKEN_PATTERN.test(trimmedValue)) {
      return value;
    }

    hasSize = true;
    const [, height] = trimmedValue.split("x");
    return height ? `${widthToken}x${height}` : widthToken;
  });

  return hasSize ? updated : [...updated, widthToken];
}

function removeAlignmentTokens(values: string[]): string[] {
  return values.filter((value) => !ALIGNMENT_TOKENS.has(value.trim().toLowerCase()));
}

function getImageSourceFromMarkdown(markdown: string): string | null {
  if (markdown.startsWith("![[")) {
    const inner = markdown.slice(3, -2);
    const target = inner.split("|")[0] ?? "";
    return target.replace(/\\/g, "/");
  }

  const match = markdown.match(/^!\[[^\]]*]\(([^)]+)\)$/);
  return match ? match[1].replace(/\\/g, "/") : null;
}
