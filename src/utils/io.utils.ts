import { MetadataCache, TFile, TFolder, Vault, normalizePath } from 'obsidian';
import { RenderInfo } from '../models/render-info';
import { parseFloatFromAny } from './number.utils';

export const getItemsInFolder = (
  folder: TFolder,
  includeSubFolders: boolean = true
): TFile[] => {
  let files: TFile[] = [];

  folder.children.forEach((item) =>
    item instanceof TFile && item.extension === 'md'
      ? files.push(item)
      : item instanceof TFolder && includeSubFolders
      ? (files = files.concat(getItemsInFolder(item)))
      : (files = [])
  );
  return files;
};

export const getFiles = async (
  renderInfo: RenderInfo,
  vault: Vault,
  metadataCache: MetadataCache,
  includeSubFolders: boolean = true
): Promise<TFile[]> => {
  const {
    folder: rootFolder,
    specifiedFilesOnly,
    file: specifiedFiles,
    fileContainsLinkedFiles: linkedFiles,
    fileMultiplierAfterLink,
    textValueMap,
  } = renderInfo;

  const files = [];
  // Include files in folder
  if (!specifiedFilesOnly) {
    const folder = vault.getAbstractFileByPath(normalizePath(rootFolder));
    if (folder && folder instanceof TFolder)
      getItemsInFolder(folder).forEach(
        (file) => files.push(file),
        includeSubFolders
      );
  }

  // Include specified files
  specifiedFiles.forEach((filePath) => {
    const path = filePath.endsWith('.md') ? filePath : `${filePath}.md`;
    const file = vault.getAbstractFileByPath(normalizePath(path));
    if (file && file instanceof TFile) files.push(file);
  });

  // Include files in pointed by links in file
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
    const path = filePath.endsWith('.md') ? filePath : `${filePath}.md`;
    const file = vault.getAbstractFileByPath(normalizePath(path));
    if (file && file instanceof TFile) {
      // Get linked files
      const fileCache = metadataCache.getFileCache(file);
      const fileContent = await vault.adapter.read(file.path);
      const lines = fileContent.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);

      if (!fileCache?.links) continue;

      for (const link of fileCache.links) {
        if (!link) continue;
        const linkedFile = metadataCache.getFirstLinkpathDest(link.link, path);
        if (linkedFile && linkedFile instanceof TFile) {
          if (!searchFileMultiplierAfterLink) continue;

          // Get the line of link in file
          const lineNumber = link.position.end.line;
          if (!(lineNumber >= 0 && lineNumber < lines.length)) continue;
          const line = lines[lineNumber];

          // Extract multiplier
          const splitLines = line.split(link.original);
          if (!(splitLines.length === 2)) continue;

          const toParse = splitLines[1].trim();
          const pattern = fileMultiplierAfterLink;
          const regex = new RegExp(pattern, 'gm');

          let match;
          while ((match = regex.exec(toParse))) {
            if (
              typeof match.groups !== 'undefined' &&
              typeof match.groups.value !== 'undefined'
            ) {
              // must have group name 'value'
              const parsed = parseFloatFromAny(
                match.groups.value.trim(),
                textValueMap
              );
              if (parsed.value === null) {
                linkedFileMultiplier = parsed.value;
                break;
              }
            }
          }
          for (let i = 0; i < linkedFileMultiplier; i++) files.push(linkedFile);
        }
      }
    }
  }
  return files;
};
