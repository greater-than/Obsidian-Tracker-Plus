// cSpell: disable
import {
  App,
  EventRef,
  FileManager,
  Keymap,
  MetadataCache,
  Scope,
  TFile,
  TFolder,
  Vault,
  View,
  Workspace,
  WorkspaceContainer,
  WorkspaceItem,
  WorkspaceLeaf,
  WorkspaceRibbon,
  WorkspaceRoot,
  WorkspaceSidedock,
  WorkspaceWindow,
} from 'obsidian';

export const mockVault: Vault = {
  adapter: undefined,
  configDir: '',
  getName: jest.fn(),
  getAbstractFileByPath: jest.fn(),
  getRoot: jest.fn(),
  create: jest.fn(),
  createBinary: jest.fn(),
  createFolder: jest.fn(),
  read: jest.fn(),
  cachedRead: jest.fn(),
  readBinary: jest.fn(),
  getResourcePath: jest.fn(),
  delete: jest.fn(),
  trash: jest.fn(),
  rename: jest.fn(),
  modify: jest.fn(),
  modifyBinary: jest.fn(),
  append: jest.fn(),
  process: jest.fn(),
  copy: jest.fn(),
  getAllLoadedFiles: jest.fn(),
  getMarkdownFiles: jest.fn(),
  getFiles: jest.fn(),
  on: jest.fn(),
  getConfig: jest.fn(),
  off: jest.fn(),
  offref: jest.fn(),
  trigger: jest.fn(),
  tryTrigger: jest.fn(),
};

export const mockWorkspaceSidedock: WorkspaceSidedock = {
  collapsed: false,
  toggle: jest.fn(),
  collapse: jest.fn(),
  expand: jest.fn(),
  getRoot: jest.fn(),
  getContainer: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  offref: jest.fn(),
  trigger: jest.fn(),
  tryTrigger: jest.fn(),
};

export const mockMetadataCache: MetadataCache = {
  getFirstLinkpathDest: jest.fn(),
  getFileCache: jest.fn(),
  getCache: jest.fn(),
  fileToLinktext: jest.fn(),
  resolvedLinks: undefined,
  unresolvedLinks: undefined,
  on: jest.fn(),
  off: jest.fn(),
  offref: jest.fn(),
  trigger: jest.fn(),
  tryTrigger: jest.fn(),
};

export const mockFileManager: FileManager = {
  getNewFileParent: jest.fn(),
  renameFile: jest.fn(),
  generateMarkdownLink: jest.fn(),
  processFrontMatter: jest.fn(),
};

export const mockKeymap: Keymap = {
  pushScope: jest.fn(),
  popScope: jest.fn(),
};

export const mockScope: Scope = {
  register: jest.fn(),
  unregister: jest.fn(),
};

export const mockApp: App = {
  keymap: mockKeymap,
  scope: mockScope,
  workspace: new Workspace(),
  vault: mockVault,
  metadataCache: mockMetadataCache,
  fileManager: mockFileManager,
  lastEvent: undefined,
};

export const mockEventRef: EventRef = {};

// @ts-expect-error incomplete mock
export const mockView: View = {
  app: mockApp,
  icon: '',
  navigation: false,
  leaf: new WorkspaceLeaf(),
  containerEl: undefined,
  onOpen: jest.fn(),
  onClose: jest.fn(),
  getViewType: jest.fn(),
  getState: jest.fn(),
  setState: jest.fn(),
  getEphemeralState: jest.fn(),
  setEphemeralState: jest.fn(),
  getIcon: jest.fn(),
  onResize: jest.fn(),
  getDisplayText: jest.fn(),
  onPaneMenu: jest.fn(),
  load: jest.fn(),
  onload: jest.fn(),
  unload: jest.fn(),
  onunload: jest.fn(),
  addChild: jest.fn(),
  removeChild: jest.fn(),
  register: jest.fn(),
  registerEvent: jest.fn(),
  registerDomEvent: jest.fn(),
  registerInterval: jest.fn(),
};

export const mockWorkspaceRibbon: WorkspaceRibbon = {};

export const mockWorkspaceRoot: WorkspaceRoot = {
  win: undefined,
  doc: undefined,
  getRoot: jest.fn(),
  getContainer: jest.fn(),
  on: jest.fn().mockReturnValue(mockEventRef),
  off: jest.fn(),
  offref: jest.fn(),
  trigger: jest.fn(),
  tryTrigger: jest.fn(),
};

export const mockWorkspaceContainer: WorkspaceContainer = {
  win: undefined,
  doc: undefined,
  getRoot: jest.fn(),
  getContainer: jest.fn().mockReturnValue(this),
  on: jest.fn().mockReturnValue(mockEventRef),
  off: jest.fn(),
  offref: jest.fn(),
  trigger: jest.fn(),
  tryTrigger: jest.fn(),
};

export const mockWorkspaceItem: WorkspaceItem = {
  getRoot: jest.fn(),
  getContainer: jest.fn().mockReturnValue(mockWorkspaceContainer),
  on: jest.fn().mockReturnValue(mockEventRef),
  off: jest.fn(),
  offref: jest.fn(),
  trigger: jest.fn(),
  tryTrigger: jest.fn(),
};

export const mockWorkspaceWindow: WorkspaceWindow = {
  win: undefined,
  doc: undefined,
  getRoot: jest.fn(),
  getContainer: jest.fn(),
  on: jest.fn().mockReturnValue(mockEventRef),
  off: jest.fn(),
  offref: jest.fn(),
  trigger: jest.fn(),
  tryTrigger: jest.fn(),
};

export const mockFolder: TFolder = {
  children: [],
  isRoot: jest.fn(),
  vault: mockVault,
  path: '<folderPath>',
  name: '<folderName>',
  parent: this,
};

export const mockFile: TFile = {
  stat: undefined,
  basename: '<fileBaseName>',
  extension: '<fileExpression>',
  vault: mockVault,
  path: '<filePath>',
  name: '<fileName>',
  parent: mockFolder,
};

export const mockWorkspaceLeaf: WorkspaceLeaf = {
  view: undefined,
  openFile: jest.fn(),
  open: jest.fn().mockResolvedValue(mockView),
  getViewState: jest.fn(),
  setViewState: jest.fn(),
  getEphemeralState: jest.fn(),
  setEphemeralState: jest.fn(),
  togglePinned: jest.fn(),
  setPinned: jest.fn(),
  setGroupMember: jest.fn(),
  setGroup: jest.fn(),
  detach: jest.fn(),
  getIcon: jest.fn(),
  getDisplayText: jest.fn(),
  onResize: jest.fn(),
  on: jest.fn().mockReturnValue(mockEventRef),
  getRoot: jest.fn().mockReturnValue(mockWorkspaceItem),
  getContainer: jest.fn().mockReturnValue(mockWorkspaceContainer),
  off: jest.fn(),
  offref: jest.fn(),
  trigger: jest.fn(),
  tryTrigger: jest.fn(),
};

export const mockWorkspace: Workspace = {
  leftSplit: mockWorkspaceSidedock,
  rightSplit: mockWorkspaceSidedock,
  leftRibbon: mockWorkspaceRibbon,
  rightRibbon: mockWorkspaceRibbon,
  rootSplit: mockWorkspaceRoot,
  activeLeaf: mockWorkspaceLeaf,
  containerEl: undefined,
  layoutReady: false,
  requestSaveLayout: undefined,
  activeEditor: undefined,
  onLayoutReady: jest.fn(),
  changeLayout: jest.fn(),
  getLayout: jest.fn(),
  createLeafInParent: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  createLeafBySplit: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  splitActiveLeaf: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  duplicateLeaf: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  getUnpinnedLeaf: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  getLeaf: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  moveLeafToPopout: jest.fn().mockReturnValue(mockWorkspaceWindow),
  openPopoutLeaf: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  openLinkText: jest.fn(),
  setActiveLeaf: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  getLeafById: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  getGroupLeaves: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  getMostRecentLeaf: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  getLeftLeaf: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  getRightLeaf: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  getActiveViewOfType: jest.fn(),
  getActiveFile: jest.fn().mockReturnValue(mockFile),
  iterateRootLeaves: jest.fn(),
  iterateAllLeaves: jest.fn(),
  getLeavesOfType: jest.fn().mockReturnValue(mockWorkspaceLeaf),
  detachLeavesOfType: jest.fn(),
  revealLeaf: jest.fn(),
  getLastOpenFiles: jest.fn(),
  updateOptions: jest.fn(),
  iterateCodeMirrors: jest.fn(),
  on: jest.fn().mockReturnValue(mockEventRef),
  off: jest.fn(),
  offref: jest.fn(),
  trigger: jest.fn(),
  tryTrigger: jest.fn(),
};
// cSpell: disable
