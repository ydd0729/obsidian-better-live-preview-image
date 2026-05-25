# Better Live Preview Image

Better Live Preview Image improves image editing in Obsidian Live Preview. It works by editing image Markdown directly, so notes stay portable and readable without the plugin.

## Features

Better Live Preview Image currently has two features:

1. **Image alignment**: Align images left, center, or right from the image context menu, command palette, or default hotkeys.
2. **Live Preview image Markdown editing**: Click an image in Live Preview to reveal its Markdown link, keep a selected image frame, and resize from the lower-right handle while the Markdown remains visible.

## Usage

Right-click an image in Live Preview or Reading view and choose one of:

- `Align image left`
- `Align image center`
- `Align image right`

You can also run these commands from the command palette:

- `Better Live Preview Image: Set current image left aligned`
- `Better Live Preview Image: Set current image centered`
- `Better Live Preview Image: Set current image right aligned`

Default hotkeys:

- `Ctrl/Cmd + Alt + Shift + Left`: align the selected or current image left
- `Ctrl/Cmd + Alt + Shift + Down`: align the selected or current image center
- `Ctrl/Cmd + Alt + Shift + Right`: align the selected or current image right

To change the hotkeys, use Obsidian's built-in **Settings -> Hotkeys** page and search for `Better Live Preview Image`.

## Live Preview Markdown Editing

Enable **Click image to edit Markdown in Live Preview** in the plugin settings. When enabled:

- Obsidian's image edit button is hidden.
- Clicking a Live Preview image reveals that image's Markdown link.
- The image keeps a selected frame while the Markdown link is visible.
- Dragging the lower-right resize handle updates the Markdown size token without hiding the Markdown link.

## How Data Is Stored

Alignment is stored as an image alt marker:

```md
![[image.png|left]]
![[image.png|center|300]]
![[image.png|right|500x300]]
![left|caption|300](image.png)
```

Resize updates standard Obsidian image size markers such as `|300` and preserves existing height tokens such as `|500x300`.

When an image matches the default alignment configured in the plugin settings, the explicit alignment marker is removed. The plugin's CSS then applies the default alignment while the plugin is enabled.

## Settings

- **Default image alignment**: Choose the alignment used for images without an explicit `left`, `center`, or `right` marker.
- **Click image to edit Markdown in Live Preview**: Hide Obsidian's image edit button, reveal the image Markdown when you click the image, and resize the image while the Markdown remains visible.

## Notes And Limitations

- The plugin is designed for Markdown image embeds and standard Markdown image links.
- The context menu integration targets rendered images in Live Preview and Reading view.
- Alignment is implemented with CSS classes and Markdown alt markers. If you disable the plugin, explicit markers remain in your Markdown, but the default alignment setting no longer applies.

## Privacy

Better Live Preview Image runs entirely inside your vault. It does not use network access, telemetry, ads, accounts, or external services.

## Installation

After the plugin is published, install it from **Settings -> Community plugins -> Browse** and search for `Better Live Preview Image`.

For manual installation, copy these files into `.obsidian/plugins/better-live-preview-image/`:

- `manifest.json`
- `main.js`
- `styles.css`

Then enable `Better Live Preview Image` from **Settings -> Community plugins**.

## Support

If you find a bug, include:

- The image Markdown before and after the action
- Whether you used the context menu, a command, a hotkey, or Live Preview click-to-edit
- Your Obsidian version

## Development

```powershell
pnpm install
pnpm run build
```
