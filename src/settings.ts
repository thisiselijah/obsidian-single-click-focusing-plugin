import { App, PluginSettingTab, Setting } from 'obsidian';
import SingleClickFocusPlugin from './main';

export interface SingleClickFocusSettings {
	enableForFiles: boolean;
	enableForFolders: boolean;
	fileFocusDelay: number;
}

export const DEFAULT_SETTINGS: SingleClickFocusSettings = {
	enableForFiles: true,
	enableForFolders: true,
	fileFocusDelay: 150,
};

export class SingleClickFocusSettingTab extends PluginSettingTab {
	plugin: SingleClickFocusPlugin;

	constructor(app: App, plugin: SingleClickFocusPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Enable for files')
			.setDesc('Single-click a file to focus it (returns focus to the file explorer after the file opens).')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableForFiles)
					.onChange(async (value) => {
						this.plugin.settings.enableForFiles = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('File focus delay (ms)')
			.setDesc('How long to wait before focusing the file explorer after a file is clicked. Increase this if focus fails to return to the file explorer on slower devices.')
			.addSlider((slider) => 
				slider
					.setLimits(50, 500, 50)
					.setValue(this.plugin.settings.fileFocusDelay)
					.onChange(async (value) => {
						this.plugin.settings.fileFocusDelay = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Enable for folders')
			.setDesc('Single-click a folder name to focus it without toggling expansion. (Clicking the arrow will still expand/collapse).')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableForFolders)
					.onChange(async (value) => {
						this.plugin.settings.enableForFolders = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
