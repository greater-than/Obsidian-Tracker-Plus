import { App, PluginSettingTab, Setting } from 'obsidian';
import Tracker from './main';
import { TrackerSettings } from './types';

export const DEFAULT_SETTINGS: TrackerSettings = {
  folder: '/',
  dateFormat: 'YYYY-MM-DD',
};

export class TrackerSettingTab extends PluginSettingTab {
  plugin: Tracker;

  constructor(app: App, plugin: Tracker) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Default folder location')
      .setDesc(
        "Files in this folder will be parsed and used as input data of the tracker plugin.\nYou can also override it using 'folder' argument in the tracker codeblock."
      )
      .addText((text) =>
        text
          .setPlaceholder('Folder path')
          .setValue(this.plugin.settings.folder)
          .onChange(async (value) => {
            this.plugin.settings.folder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Default date format')
      .setDesc(
        "This format is used to parse the date in your diary title.\nYou can also override it using 'dateFormat' argument in the tracker codeblock."
      )
      .addText((text) =>
        text
          .setPlaceholder('YYYY-MM-DD')
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value) => {
            this.plugin.settings.dateFormat = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
