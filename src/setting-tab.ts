import { App, Plugin, PluginSettingTab, type SettingDefinitionItem } from "obsidian";
import type { PluginText } from "./plugin-text";
import type { ImageAlignment, ImageAlignmentSettings } from "./types";

interface ImageAlignmentSettingsPlugin extends Plugin {
  settings: ImageAlignmentSettings;
  getText(): PluginText;
  saveSettings(): Promise<void>;
}

export class ImageAlignmentSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: ImageAlignmentSettingsPlugin) {
    super(app, plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const text = this.plugin.getText();

    return [
      {
        name: text.defaultAlignmentName,
        desc: text.defaultAlignmentDesc,
        render: (setting) => {
          setting.addDropdown((dropdown) => {
            dropdown
              .addOption("center", text.alignmentLabels.center)
              .addOption("left", text.alignmentLabels.left)
              .addOption("right", text.alignmentLabels.right)
              .setValue(this.plugin.settings.defaultAlignment)
              .onChange(async (value) => {
                this.plugin.settings.defaultAlignment = value as ImageAlignment;
                await this.plugin.saveSettings();
              });
          });
        }
      },
      {
        name: text.calloutImageSizeSyncName,
        desc: text.calloutImageSizeSyncDesc,
        render: (setting) => {
          setting.addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settings.syncCalloutImageSizes)
              .onChange(async (value) => {
                this.plugin.settings.syncCalloutImageSizes = value;
                await this.plugin.saveSettings();
              });
          });
        }
      }
    ];
  }
}
