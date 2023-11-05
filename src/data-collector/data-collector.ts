import { CachedMetadata, TFile } from 'obsidian';
import { DataMap } from '../models/data-map';
import { SearchType, ValueType } from '../models/enums';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';
import { TNumberValueMap } from '../models/types';
import * as helper from '../utils/helper';
import { WordCharacters } from './constants';
import {
  extractDataUsingRegexWithMultipleValues,
  extractDateUsingRegexWithValue,
} from './data-collector.helper';
import Moment = moment.Moment;

/**
 * @summary Returns a Moment object from a note file name
 * @param {TFile} file file.basename is a string that should contain dateFormat only
 * @param {RenderInfo} renderInfo
 * @returns {Moment}
 */
export const getDateFromFilename = (
  file: TFile,
  renderInfo: RenderInfo
): Moment => {
  // console.log(`getDateFromFilename: ${file.name}`);
  // Get date form fileBaseName

  const fileBaseName = file.basename;

  const dateString = helper.getDateStringFromInputString(
    fileBaseName,
    renderInfo.dateFormatPrefix,
    renderInfo.dateFormatSuffix
  );
  // console.log(dateString);

  const fileDate = helper.strToDate(dateString, renderInfo.dateFormat);
  // console.log(fileDate);

  return fileDate;
};

// Not support multiple targets
// In form 'key: value', target used to identify 'frontmatter key'
export const getDateFromFrontmatter = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromFrontmatter");
  // Get date from 'frontMatterKey: date'

  let date = window.moment('');

  const frontMatter = fileCache.frontmatter;
  if (frontMatter) {
    if (helper.deepValue(frontMatter, query.target)) {
      let strDate = helper.deepValue(frontMatter, query.target);

      // We only support single value for now
      if (typeof strDate === 'string') {
        strDate = helper.getDateStringFromInputString(
          strDate,
          renderInfo.dateFormatPrefix,
          renderInfo.dateFormatSuffix
        );

        date = helper.strToDate(strDate, renderInfo.dateFormat);
        // console.log(date);
      }
    }
  }

  return date;
};

// Not support multiple targets
// In form 'key: value', name group 'value' from plugin, not from users
export const getDateFromTag = (
  content: string,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // Get date from '#tagName: date'
  // Inline value-attached tag only

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = window.moment('');

  let tagName = query.target;
  if (query.parentTarget) {
    tagName = query.parentTarget; // use parent tag name for multiple values
  }

  const pattern =
    '(^|\\s)#' +
    tagName +
    '(\\/[\\w-]+)*(:(?<value>[\\d\\.\\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\\s|$)';

  return extractDateUsingRegexWithValue(content, pattern, renderInfo);
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getDateFromText = (
  content: string,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // Get date from text using regex with value

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = window.moment('');

  const strRegex = query.target;
  // console.log(strTextRegex);

  return extractDateUsingRegexWithValue(content, strRegex, renderInfo);
};

// Not support multiple targets
// In form 'key::value', named group 'value' from plugin
export const getDateFromDvField = (
  content: string,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromDvField");
  // Get date form 'targetName:: date'

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = window.moment('');

  let dvTarget = query.target;
  if (query.parentTarget) {
    dvTarget = query.parentTarget; // use parent tag name for multiple values
  }
  // Dataview ask user to add dashes for spaces as search target
  // So a dash may stands for a real dash or a space
  dvTarget = dvTarget.replace('-', '[\\s\\-]');

  // Test this in Regex101
  // remember '\s' includes new line
  // (^| |\t)\*{0,2}dvTarget\*{0,2}(::[ |\t]*(?<value>[\d\.\/\-\w,@; \t:]*))(\r?\n|\r|$)
  const strRegex =
    '(^| |\\t)\\*{0,2}' +
    dvTarget +
    '\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-\\w,@; \\t:]*))(\\r\\?\\n|\\r|$)';

  return extractDateUsingRegexWithValue(content, strRegex, renderInfo);
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getDateFromWiki = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // Get date from '[[regex with value]]'

  const date = window.moment('');

  const links = fileCache.links;
  if (!links) return date;

  const searchTarget = query.target;
  const searchType = query.type;

  for (const link of links) {
    if (!link) continue;

    let wikiText = '';
    if (searchType === SearchType.Wiki) {
      if (link.displayText) {
        wikiText = link.displayText;
      } else {
        wikiText = link.link;
      }
    } else if (searchType === SearchType.WikiLink) {
      // wiki.link point to a file name
      // a colon is not allowed be in file name
      wikiText = link.link;
    } else if (searchType === SearchType.WikiDisplay) {
      if (link.displayText) {
        wikiText = link.displayText;
      }
    } else {
      if (link.displayText) {
        wikiText = link.displayText;
      } else {
        wikiText = link.link;
      }
    }
    wikiText = wikiText.trim();

    const strRegex = '^' + searchTarget + '$';
    return extractDateUsingRegexWithValue(wikiText, strRegex, renderInfo);
  }

  return date;
};

// Not support multiple targets
export const getDateFromFileMeta = (
  file: TFile,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // Get date from cDate, mDate or baseFileName

  let date = window.moment('');

  if (file && file instanceof TFile) {
    const target = query.target;
    if (target === 'cDate') {
      const ctime = file.stat.ctime; // unix time
      date = helper.getDateFromUnixTime(ctime, renderInfo.dateFormat);
    } else if (target === 'mDate') {
      const mtime = file.stat.mtime; // unix time
      date = helper.getDateFromUnixTime(mtime, renderInfo.dateFormat);
    } else if (target === 'name') {
      date = getDateFromFilename(file, renderInfo);
    }
  }
  return date;
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getDateFromTask = (
  content: string,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // Get date from '- [ ] regex with value' or '- [x] regex with value'

  // Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = window.moment('');
  const searchType = query.type;

  let strRegex = query.target;
  if (searchType === SearchType.Task) {
    strRegex = '\\[[\\sx]\\]\\s' + strRegex;
  } else if (searchType === SearchType.TaskDone) {
    strRegex = '\\[x\\]\\s' + strRegex;
  } else if (searchType === SearchType.TaskNotDone) {
    strRegex = '\\[\\s\\]\\s' + strRegex;
  } else {
    strRegex = '\\[[\\sx]\\]\\s' + strRegex;
  }

  return extractDateUsingRegexWithValue(content, strRegex, renderInfo);
};

// No value, count occurrences only
export const collectDataFromFrontmatterTag = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  const frontMatter = fileCache.frontmatter;
  let frontMatterTags: string[] = [];
  if (frontMatter && frontMatter.tags) {
    let tagMeasure = 0.0;
    let tagExist = false;
    if (Array.isArray(frontMatter.tags)) {
      frontMatterTags = frontMatterTags.concat(frontMatter.tags);
    } else if (typeof frontMatter.tags === 'string') {
      const splitted = frontMatter.tags.split(query.getSeparator(true));
      for (const splittedPart of splitted) {
        const part = splittedPart.trim();
        if (part !== '') {
          frontMatterTags.push(part);
        }
      }
    }

    for (const tag of frontMatterTags) {
      if (tag === query.target) {
        // simple tag
        tagMeasure = tagMeasure + renderInfo.constValue[query.id];
        tagExist = true;
        query.incrementTargetCount();
      } else if (tag.startsWith(query.target + '/')) {
        // nested tag
        tagMeasure = tagMeasure + renderInfo.constValue[query.id];
        tagExist = true;
        query.incrementTargetCount();
      } else {
        continue;
      }

      // valued-tag in frontmatter is not supported
      // because the "tag:value" in frontmatter will be consider as a new tag for each existing value

      let value = null;
      if (tagExist) {
        value = tagMeasure;
      }
      const xValue = xValueMap.get(renderInfo.xDataset[query.id]);
      dataMap.add(xValue, { query, value });
      return true;
    }
  }

  return false;
};

// In form 'key: value', target used to identify 'frontmatter key'
export const collectDataFromFrontmatterKey = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  const frontMatter = fileCache.frontmatter;
  if (frontMatter) {
    const deepValue = helper.deepValue(frontMatter, query.target);
    if (deepValue) {
      const retParse = helper.parseFloatFromAny(
        deepValue,
        renderInfo.textValueMap
      );
      if (retParse.value === null) {
        // Try parsing as a boolean: true means 1, false means 0.
        if (deepValue === 'true' || deepValue === 'false') {
          retParse.type = ValueType.Number;
          retParse.value = deepValue === 'true' ? 1 : 0;
        }
      }
      if (retParse.value !== null) {
        if (retParse.type === ValueType.Time) {
          query.valueType = ValueType.Time;
        }
        query.incrementTargetCount();
        const xValue = xValueMap.get(renderInfo.xDataset[query.id]);
        dataMap.add(xValue, { query, value: retParse.value });
        return true;
      }
    } else if (
      query.parentTarget &&
      helper.deepValue(frontMatter, query.parentTarget)
    ) {
      const toParse = helper.deepValue(frontMatter, query.parentTarget);
      let splitted = null;
      if (Array.isArray(toParse)) {
        splitted = toParse.map((p) => {
          return p.toString();
        });
      } else if (typeof toParse === 'string') {
        splitted = toParse.split(query.getSeparator());
      }
      if (
        splitted &&
        splitted.length > query.getAccessor() &&
        query.getAccessor() >= 0
      ) {
        // TODO: it's not efficient to retrieve one value at a time, enhance this
        const splittedPart = splitted[query.getAccessor()].trim();
        const retParse = helper.parseFloatFromAny(
          splittedPart,
          renderInfo.textValueMap
        );
        if (retParse.value !== null) {
          if (retParse.type === ValueType.Time) {
            query.valueType = ValueType.Time;
          }
          query.incrementTargetCount();
          const xValue = xValueMap.get(renderInfo.xDataset[query.id]);
          dataMap.add(xValue, { query, value: retParse.value });
          return true;
        }
      }
    }
  }

  return false;
};

// In form 'regex with value', name group 'value' from users
export const collectDataFromWiki = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  const links = fileCache.links;
  if (!links) return false;

  const searchTarget = query.target;
  const searchType = query.type;

  let textToSearch = '';
  const strRegex = searchTarget;

  // Prepare textToSearch
  for (const link of links) {
    if (!link) continue;

    let wikiText = '';
    if (searchType === SearchType.Wiki) {
      if (link.displayText) {
        wikiText = link.displayText;
      } else {
        wikiText = link.link;
      }
    } else if (searchType === SearchType.WikiLink) {
      // wiki.link point to a file name
      // a colon is not allowed be in file name
      wikiText = link.link;
    } else if (searchType === SearchType.WikiDisplay) {
      if (link.displayText) {
        wikiText = link.displayText;
      }
    } else {
      if (link.displayText) {
        wikiText = link.displayText;
      } else {
        wikiText = link.link;
      }
    }
    wikiText = wikiText.trim();

    textToSearch += wikiText + '\n';
  }

  return extractDataUsingRegexWithMultipleValues(
    textToSearch,
    strRegex,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

// In form 'key: value', name group 'value' from plugin, not from users
export const collectDataFromInlineTag = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  // Test this in Regex101
  // (^|\s)#tagName(\/[\w-]+)*(:(?<value>[\d\.\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\s|$)
  let tagName = query.target;
  if (query.parentTarget) {
    tagName = query.parentTarget; // use parent tag name for multiple values
  }
  if (tagName.length > 1 && tagName.startsWith('#')) {
    tagName = tagName.substring(1);
  }
  const strRegex =
    '(^|\\s)#' +
    tagName +
    '(\\/[\\w-]+)*(:(?<value>[\\d\\.\\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\\s|$)';

  return extractDataUsingRegexWithMultipleValues(
    content,
    strRegex,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

// In form 'regex with value', name group 'value' from users
export const collectDataFromText = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  const strRegex = query.target;

  return extractDataUsingRegexWithMultipleValues(
    content,
    strRegex,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

export const collectDataFromFileMeta = (
  file: TFile,
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  if (file && file instanceof TFile) {
    const target = query.target;
    const xValue = xValueMap.get(renderInfo.xDataset[query.id]);

    if (target === 'cDate') {
      const ctime = file.stat.ctime; // unix time
      query.valueType = ValueType.Date;
      query.incrementTargetCount();
      dataMap.add(xValue, { query, value: ctime });
      return true;
    } else if (target === 'mDate') {
      const mtime = file.stat.mtime; // unix time
      query.valueType = ValueType.Date;
      query.incrementTargetCount();
      dataMap.add(xValue, { query, value: mtime });
      return true;
    } else if (target === 'size') {
      const size = file.stat.size; // number in
      query.incrementTargetCount();
      dataMap.add(xValue, { query, value: size });
      return true;
    } else if (target === 'numWords') {
      const numWords = helper.getWordCount(content);
      dataMap.add(xValue, { query, value: numWords });
      return true;
    } else if (target === 'numChars') {
      const numChars = helper.getCharacterCount(content);
      query.incrementTargetCount();
      dataMap.add(xValue, { query, value: numChars });
      return true;
    } else if (target === 'numSentences') {
      const numSentences = helper.getSentenceCount(content);
      query.incrementTargetCount();
      dataMap.add(xValue, { query, value: numSentences });
      return true;
    } else if (target === 'name') {
      let targetMeasure = 0.0;
      let targetExist = false;
      const retParse = helper.parseFloatFromAny(
        file.basename,
        renderInfo.textValueMap
      );
      if (retParse.value !== null) {
        if (retParse.type === ValueType.Time) {
          targetMeasure = retParse.value;
          targetExist = true;
          query.valueType = ValueType.Time;
          query.incrementTargetCount();
        } else {
          if (!renderInfo.ignoreZeroValue[query.id] || retParse.value !== 0) {
            targetMeasure += retParse.value;
            targetExist = true;
            query.incrementTargetCount();
          }
        }
      }

      let value = null;
      if (targetExist) {
        value = targetMeasure;
      }
      if (value !== null) {
        dataMap.add(xValue, { query, value });
        return true;
      }
    }
  }

  return false;
};

// In form 'key::value', named group 'value' from plugin
export const collectDataFromDvField = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  let dvTarget = query.target;
  if (query.parentTarget) {
    dvTarget = query.parentTarget; // use parent tag name for multiple values
  }
  // Dataview ask user to add dashes for spaces as search target
  // So a dash may stands for a real dash or a space
  dvTarget = dvTarget.replace('-', '[\\s\\-]');

  // Test this in Regex101
  // remember '\s' includes new line
  // (^| |\t)\*{0,2}dvTarget\*{0,2}(::[ |\t]*(?<value>[\d\.\/\-\w,@; \t:]*))(\r?\n|\r|$)
  const strRegex =
    '(^| |\\t)\\*{0,2}' +
    dvTarget +
    '\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-,@; \\t:' +
    WordCharacters +
    ']*))(\\r\\?\\n|\\r|$)';
  const outline = extractDataUsingRegexWithMultipleValues(
    content,
    strRegex,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
  const inline = collectDataFromInlineDvField(
    content,
    query,
    renderInfo,
    dataMap,
    xValueMap
  );
  return outline || inline;
};

// In form 'key::value', named group 'value' from plugin
export const collectDataFromInlineDvField = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  let dvTarget = query.target;
  if (query.parentTarget) {
    dvTarget = query.parentTarget; // use parent tag name for multiple values
  }
  // Dataview ask user to add dashes for spaces as search target
  // So a dash may stands for a real dash or a space
  dvTarget = dvTarget.replace('-', '[\\s\\-]');

  // Test this in Regex101
  // remember '\s' includes new line
  // ^.*?(\[|\()\*{0,2}dvTarget\*{0,2}(::[ |\t]*(?<value>[\d\.\/\-\w,@; \t:]*))(\]|\)).*?
  const strRegex =
    '^.*?(\\[|\\()\\*{0,2}' +
    dvTarget +
    '\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-,@; \\t:' +
    WordCharacters +
    ']*))(\\]|\\)).*?$';

  return extractDataUsingRegexWithMultipleValues(
    content,
    strRegex,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

// In form 'regex with value', name group 'value' from users
export const collectDataFromTask = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  const searchType = query.type;

  let strRegex = query.target;
  if (searchType === SearchType.Task) {
    strRegex = '\\[[\\sx]\\]\\s' + strRegex;
  } else if (searchType === SearchType.TaskDone) {
    strRegex = '\\[x\\]\\s' + strRegex;
  } else if (searchType === SearchType.TaskNotDone) {
    strRegex = '\\[\\s\\]\\s' + strRegex;
  } else {
    // all
    strRegex = '\\[[\\sx]\\]\\s' + strRegex;
  }
  // console.log(strRegex);

  return extractDataUsingRegexWithMultipleValues(
    content,
    strRegex,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};
