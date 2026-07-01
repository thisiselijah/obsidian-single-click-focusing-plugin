import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, SingleClickFocusSettings, SingleClickFocusSettingTab } from './settings';


export default class SingleClickFocusPlugin extends Plugin {
	settings!: SingleClickFocusSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SingleClickFocusSettingTab(this.app, this));

		console.log('single-click-focus: plugin loaded');

		this.registerDomEvent(activeDocument, 'click', (evt: MouseEvent) => {
			if (evt.button !== 0) return;

			const target = evt.target as HTMLElement;

			// --- Files ---
			const fileTitle = target.closest('.nav-file-title') as HTMLElement;
			if (fileTitle && this.settings.enableForFiles) {
				console.log('single-click-focus: file clicked');
				// Let Obsidian open the file, then focus the item via internal API
				const dataPath = fileTitle.getAttribute('data-path');
				if (dataPath) {
					window.setTimeout(() => {
						this.focusExplorerItem(dataPath);
					}, this.settings.fileFocusDelay);
				}
				return;
			}

			// --- Folders ---
			const folderTitle = target.closest('.nav-folder-title') as HTMLElement;
			if (folderTitle && this.settings.enableForFolders) {
				const isArrow = target.closest('.collapse-icon');
				if (isArrow) {
					// Clicking the arrow → normal toggle behavior
					return;
				}

				// Block the click so the folder doesn't toggle
				evt.stopPropagation();
				evt.preventDefault();
				console.log('single-click-focus: folder name clicked, toggle blocked');

				const dataPath = folderTitle.getAttribute('data-path');
				if (dataPath) {
					this.focusExplorerItem(dataPath);
				}
				return;
			}
		}, { capture: true });
	}

	/**
	 * Focus a file or folder in the file explorer using Obsidian's internal
	 * tree.setFocusedItem API. This triggers the native focus state
	 * (border + keyboard navigation including Enter-to-rename).
	 */
	private focusExplorerItem(dataPath: string) {
		const feLeaves = this.app.workspace.getLeavesOfType('file-explorer');
		const feLeaf = feLeaves[0];
		if (!feLeaf) return;

		// Make the file explorer the active leaf
		this.app.workspace.setActiveLeaf(feLeaf, { focus: true });

		const feView = feLeaf.view as any; // eslint-disable-line @typescript-eslint/no-explicit-any

		// Look up the item and focus it via the tree API
		const fileItem = feView.fileItems?.[dataPath];
		if (fileItem && feView.tree?.setFocusedItem) {
			feView.tree.setFocusedItem(fileItem);
			console.log('single-click-focus: focused item via tree.setFocusedItem:', dataPath);
		}
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<SingleClickFocusSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
