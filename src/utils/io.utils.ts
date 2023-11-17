import { MetadataCache, TFile, TFolder, Vault, normalizePath } from 'obsidian';
import { TrackerError } from '../errors';
import { RenderInfo } from '../models/render-info';
import { LineBreakPattern } from '../regex-patterns';
import { parseFloatFromAny } from './number.utils';

/**
 * @summary Traverses nested folders and returns all markdown files
 * @param {TFolder} folder
 * @param {boolean} includeSubFolders
 * @returns {TFile[]}
 */
export const getFilesInFolder = (
  folder: TFolder,
  includeSubFolders: boolean = true
): TFile[] => {
  let files: TFile[] = [];
  folder.children.forEach((item) => {
    if (item instanceof TFile && item.extension === 'md') files.push(item);
    else if (item instanceof TFolder && includeSubFolders)
      files = files.concat(getFilesInFolder(item, includeSubFolders));
  });
  return files;
};

/**
 * @summary Returns files to be used to collect data
 * @param {RenderInfo} renderInfo
 * @param {Vault} vault
 * @param {MetadataCache} metadataCache
 * @param {boolean} includeSubFolders
 * @returns
 */
export const getFiles = async (
  renderInfo: RenderInfo,
  vault: Vault,
  metadataCache: MetadataCache,
  includeSubFolders: boolean = true,
  throwErrors: boolean = true
): Promise<TFile[]> => {
  const files = [];

  const {
    folder: rootFolder,
    specifiedFilesOnly,
    file: specifiedFiles,
    fileContainsLinkedFiles: linkedFiles,
    fileMultiplierAfterLink,
    textValueMap,
  } = renderInfo;

  // Include files in folder
  if (!specifiedFilesOnly) {
    const folder = vault.getAbstractFileByPath(normalizePath(rootFolder));
    if (folder && folder instanceof TFolder)
      getFilesInFolder(folder, includeSubFolders).forEach((file) =>
        files.push(file)
      );
  }

  // Include specified files
  specifiedFiles.forEach((filePath) => {
    const path = filePath.endsWith('.md') ? filePath : `${filePath}.md`;
    const file = vault.getAbstractFileByPath(normalizePath(path));
    if (file && file instanceof TFile) files.push(file);
  });

  // Include linked files
  let linkedFileMultiplier = 1;
  let searchFileMultiplierAfterLink = true;

  if (fileMultiplierAfterLink === '') {
    searchFileMultiplierAfterLink = false;
  } else if (/^[0-9]+$/.test(fileMultiplierAfterLink)) {
    // integer
    linkedFileMultiplier = parseFloat(fileMultiplierAfterLink);
    searchFileMultiplierAfterLink = false;
  } else if (!/\?<value>/.test(fileMultiplierAfterLink)) {
    // no 'value' named group
    searchFileMultiplierAfterLink = false;
  }
  for (const filePath of linkedFiles) {
    const path = !filePath.endsWith('.md') ? `${filePath}.md` : filePath;

    const file = vault.getAbstractFileByPath(normalizePath(path));
    if (file && file instanceof TFile) {
      // Get linked files
      const metadata = metadataCache.getFileCache(file);
      const content = await vault.adapter.read(file.path);
      const lines = content.split(LineBreakPattern);

      if (!metadata?.links) continue;

      for (const link of metadata.links) {
        if (!link) continue;
        const linkedFile = metadataCache.getFirstLinkpathDest(link.link, path);
        if (linkedFile && linkedFile instanceof TFile) {
          if (searchFileMultiplierAfterLink) {
            // Get the line of link in file
            const lineNumber = link.position.end.line;
            if (lineNumber >= 0 && lineNumber < lines.length) {
              const line = lines[lineNumber];

              // Try extract multiplier
              // if (link.position)
              const splits = line.split(link.original);
              if (splits.length === 2) {
                const toParse = splits[1].trim();
                const pattern = fileMultiplierAfterLink;
                const regex = new RegExp(pattern, 'gm');
                let match;
                while ((match = regex.exec(toParse))) {
                  // console.log(match);
                  if (
                    typeof match.groups !== 'undefined' &&
                    typeof match.groups.value !== 'undefined'
                  ) {
                    // must have group name 'value'
                    const parsed = parseFloatFromAny(
                      match.groups.value.trim(),
                      textValueMap
                    );
                    if (parsed.value !== null) {
                      linkedFileMultiplier = parsed.value;
                      break;
                    }
                  }
                }
              }
            }
          }
          for (let i = 0; i < linkedFileMultiplier; i++) files.push(linkedFile);
        }
      }
    }
  }
  if (throwErrors && files.length === 0)
    throw new TrackerError(
      `Markdown files not found in folder '${renderInfo.folder}'`
    );
  return files;
};
