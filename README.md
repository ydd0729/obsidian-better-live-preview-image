# Better Live Preview Image

Better Live Preview Image improves image alignment and callout image sizing in Obsidian.

## Features

Better Live Preview Image currently has two features:

1. **Image alignment**: Align images left, center, or right from the image context menu, command palette, or user-assigned hotkeys.
2. **Callout image size markers**: Apply Obsidian image width and height markers to images inside callouts in Live Preview and Reading view.

## Usage

Right-click an image in Live Preview or Reading view and choose one of:

- `Align image left`
- `Align image center`
- `Align image right`

You can also run these commands from the command palette:

- `Better Live Preview Image: Set current image left aligned`
- `Better Live Preview Image: Set current image centered`
- `Better Live Preview Image: Set current image right aligned`

The plugin does not reserve default hotkeys. To assign shortcuts, use Obsidian's built-in **Settings -> Hotkeys** page and search for `Better Live Preview Image`.

When you use Obsidian's native **Edit this block** button, the image remains visible with its current alignment while the Markdown source is shown.

## Callout Image Size Markers

Enable **Apply image size markers inside callouts** in the plugin settings. When enabled, images inside callouts use Obsidian width and height markers in Live Preview and Reading view:

```md
> [!info] Example
> ![[image.png|240]]
> ![[image.png|240x160]]
```

This setting is enabled by default. Turning it off removes only the plugin-applied inline sizing from rendered callout images; it does not modify your Markdown.

## How Data Is Stored

Alignment is stored as an image alt marker:

```md
![[image.png|left]]
![[image.png|center|300]]
![[image.png|right|500x300]]
![left|caption|300](image.png)
```

When an image matches the default alignment configured in the plugin settings, the explicit alignment marker is removed. The plugin's CSS then applies the default alignment while the plugin is enabled.

## Settings

- **Default image alignment**: Choose the alignment used for images without an explicit `left`, `center`, or `right` marker.
- **Apply image size markers inside callouts**: Make callout images honor Obsidian width and height markers in Live Preview and Reading view.

## Notes And Limitations

- The plugin is designed for Markdown image embeds and standard Markdown image links.
- The context menu integration targets rendered images in Live Preview and Reading view.
- Alignment is implemented with CSS classes and Markdown alt markers. If you disable the plugin, explicit markers remain in your Markdown, but the default alignment setting no longer applies.

## Privacy

Better Live Preview Image runs entirely inside your vault. It does not use network access, telemetry, ads, accounts, or external services.

## Installation

After the plugin is published, install it from **Settings -> Community plugins -> Browse** and search for `Better Live Preview Image`.

Obsidian 1.13.0 or later is required.

For manual installation, copy these files into `.obsidian/plugins/better-live-preview-image/`:

- `manifest.json`
- `main.js`
- `styles.css`

Then enable `Better Live Preview Image` from **Settings -> Community plugins**.

## Support

If you find a bug, include:

- The image Markdown before and after the action
- Whether you used the context menu, a command, a hotkey, or Obsidian's native edit button
- Your Obsidian version

## Development

```powershell
pnpm install
pnpm run lint
pnpm run build
```

## Releasing

Update `manifest.json`, `package.json`, `versions.json`, and `CHANGELOG.md`, then run:

```powershell
pnpm run release
```

The script validates the release, runs lint and the build, commits all repository changes, creates the version tag, and atomically pushes `main` and the tag. The tag triggers the GitHub Actions release workflow. The default commit message is `Release <version>`; override it with `--message`:

```powershell
pnpm run release -- --message "Describe the release"
```

To validate everything without committing, tagging, or pushing:

```powershell
pnpm run release -- --dry-run
```
