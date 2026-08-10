# Changelog

## 1.1.2

- Adopt Obsidian's declarative settings API and raise the minimum supported app version to 1.13.0.
- Remove default command hotkeys so users can assign conflict-free shortcuts themselves.
- Use Obsidian DOM helpers for synchronized image sizing.
- Replace broad CSS `:has()` selectors to avoid selector invalidation performance warnings.
- Add a single-command release script with validation, commit, atomic push, and automatic GitHub release triggering.

## 1.1.1

- Keep native image edit previews at their exact horizontal and vertical positions when opening, switching, or closing edits.
- Position native edit previews without CSS `!important` declarations.

## 1.1.0

- Fix Live Preview image alignment with current Obsidian editor DOM structures.
- Keep images aligned while using Obsidian's native **Edit this block** action, including direct switches between images without duplicate previews or alignment flashes.
- Remove the custom click-to-reveal Markdown and drag-to-resize interaction in favor of Obsidian's native editing flow.
- Keep image width and height markers working inside callouts.

## 1.0.4

- Fix image alignment for images inside callouts in Live Preview.

## 1.0.3

- Add an option to apply Obsidian image size markers inside callouts.
- Fix callout image size markers in Live Preview and Reading view.
- Fix Live Preview image Markdown reveal in popout windows.
- Fix image alignment selectors so callouts are not aligned as whole image blocks.

## 1.0.2

- Fix Live Preview resizing when the same image link appears multiple times in a note.
- Fix image alignment in Live Preview lists and callouts.

## 1.0.1

- Rename the plugin to Better Live Preview Image.
- Rename the plugin id to `better-live-preview-image`.

## 1.0.0

- Add image alignment controls for left, center, and right alignment.
- Add Live Preview image Markdown editing: click an image to reveal its Markdown, keep a selected image frame, and resize while the Markdown link remains visible.
