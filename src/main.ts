import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, SingleClickFocusSettings, SingleClickFocusSettingTab } from './settings';


export default class SingleClickFocusPlugin extends Plugin {
	settings!: SingleClickFocusSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SingleClickFocusSettingTab(this.app, this));

		this.registerDomEvent(activeDocument, 'click', (evt: MouseEvent) => {
			if (evt.button !== 0) return;

			const target = evt.target as HTMLElement;

			// --- Files ---
			const fileTitle = target.closest('.nav-file-title') as HTMLElement;
			if (fileTitle && this.settings.enableForFiles) {
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

		// Define an interface for the internal Obsidian FileExplorerView
		interface FileExplorerView {
			fileItems?: Record<string, unknown>;
			tree?: {
				setFocusedItem?: (item: unknown) => void;
			};
		}

		const feView = feLeaf.view as unknown as FileExplorerView;

		// Look up the item and focus it via the tree API
		const fileItem = feView.fileItems?.[dataPath];
		if (fileItem && feView.tree?.setFocusedItem) {
			feView.tree.setFocusedItem(fileItem);
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
