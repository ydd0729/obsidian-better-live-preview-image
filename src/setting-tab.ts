import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
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

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName(this.plugin.getText().defaultAlignmentName)
      .setDesc(this.plugin.getText().defaultAlignmentDesc)
      .addDropdown((dropdown) => {
        dropdown
          .addOption("center", this.plugin.getText().alignmentLabels.center)
          .addOption("left", this.plugin.getText().alignmentLabels.left)
          .addOption("right", this.plugin.getText().alignmentLabels.right)
          .setValue(this.plugin.settings.defaultAlignment)
          .onChange(async (value) => {
            this.plugin.settings.defaultAlignment = value as ImageAlignment;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(this.plugin.getText().clickImageToEditName)
      .setDesc(this.plugin.getText().clickImageToEditDesc)
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.clickImageToEditInLivePreview)
          .onChange(async (value) => {
            this.plugin.settings.clickImageToEditInLivePreview = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
