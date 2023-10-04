import { Moment } from 'moment';
import { CachedMetadata, TFile } from 'obsidian';
import { SearchType, ValueType } from '../models/enums';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';
import { DataMap, XValueMap } from '../models/types';
import { CountUtils, DateTimeUtils, NumberUtils, ObjectUtils } from '../utils';
import {
  addToDataMap,
  extractDataUsingRegexWithMultipleValues,
  extractDateUsingRegexWithValue,
} from './helper';

// ref: https://www.rapidtables.com/code/text/unicode-characters.html
const CurrencyCodes =
  '\u0024\u20AC\u00A3\u00A5\u00A2\u20B9\u20A8\u20B1\u20A9\u0E3F\u20AB\u20AA';
const AlphabetCodes = '\u03B1-\u03C9\u0391-\u03A9';
const IntellectualPropertyCodes = '\u00A9\u00AE\u2117\u2122\u2120';
const CJKCodes = '\u4E00-\u9FFF\u3400-\u4DBF\u3000\u3001-\u303F';
const WordCharacters =
  '\\w' + CurrencyCodes + AlphabetCodes + IntellectualPropertyCodes + CJKCodes;

// fileBaseName is a string contains dateFormat only
export const getDateFromFilename = (
  file: TFile,
  renderInfo: RenderInfo
): Moment => {
  // console.log(`getDateFromFilename: ${file.name}`);
  // Get date form fileBaseName

  const fileBaseName = file.basename;

  const dateString = DateTimeUtils.getDateStringFromInputString(
    fileBaseName,
    renderInfo.dateFormatPrefix,
    renderInfo.dateFormatSuffix
  );
  // console.log(dateString);

  const fileDate = DateTimeUtils.strToDate(dateString, renderInfo.dateFormat);
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
    if (ObjectUtils.getDeepValue(frontMatter, query.target)) {
      let strDate = ObjectUtils.getDeepValue(frontMatter, query.target);

      // We only support single value for now
      if (typeof strDate === 'string') {
        strDate = DateTimeUtils.getDateStringFromInputString(
          strDate,
          renderInfo.dateFormatPrefix,
          renderInfo.dateFormatSuffix
        );

        date = DateTimeUtils.strToDate(strDate, renderInfo.dateFormat);
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
  // console.log("getDateFromTag");
  // Get date from '#tagName: date'
  // Inline value-attached tag only

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = window.moment('');

  let tagName = query.target;
  if (query.parentTarget) {
    tagName = query.parentTarget; // use parent tag name for multiple values
  }
  // console.log(tagName);

  const pattern =
    '(^|\\s)#' +
    tagName +
    '(\\/[\\w-]+)*(:(?<value>[\\d\\.\\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\\s|$)';
  // console.log(pattern);

  return extractDateUsingRegexWithValue(content, pattern, renderInfo);
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getDateFromText = (
  content: string,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromText");
  // Get date from text using regex with value

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = window.moment('');

  const pattern = query.target;
  // console.log(strTextRegex);

  return extractDateUsingRegexWithValue(content, pattern, renderInfo);
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

  let target = query.parentTarget ?? query.target;

  // Dataview ask user to add dashes for spaces as search target
  // So a dash may stands for a real dash or a space
  target = target.replace('-', '[\\s\\-]');

  // Test this in Regex101
  // remember '\s' includes new line
  // (^| |\t)\*{0,2}dvTarget\*{0,2}(::[ |\t]*(?<value>[\d\.\/\-\w,@; \t:]*))(\r?\n|\r|$)
  const pattern =
    '(^| |\\t)\\*{0,2}' +
    target +
    '\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-\\w,@; \\t:]*))(\\r\\?\\n|\\r|$)';
  // console.log(pattern);

  return extractDateUsingRegexWithValue(content, pattern, renderInfo);
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getDateFromWiki = (
  metadata: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  //console.log("getDateFromWiki");
  // Get date from '[[regex with value]]'

  const date = window.moment('');

  const links = metadata.links;
  if (!links) return date;

  const searchTarget = query.target;
  const searchType = query.type;

  for (const link of links) {
    if (!link) continue;

    let wikiText = '';
    if (searchType === SearchType.WikiLink) {
      // wiki.link point to a file name
      // a colon is not allowed be in file name
      wikiText = link.link;
    } else if (searchType === SearchType.WikiDisplay) {
      if (link.displayText) wikiText = link.displayText;
    } else {
      wikiText = link.displayText ? link.displayText : link.link;
    }
    wikiText = wikiText.trim();

    const pattern = `^${searchTarget}$`;
    return extractDateUsingRegexWithValue(wikiText, pattern, renderInfo);
  }

  return date;
};

// Not support multiple targets
export const getDateFromFileMeta = (
  file: TFile,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromFileMeta");
  // Get date from cDate, mDate or baseFileName

  let date = window.moment('');

  if (file && file instanceof TFile) {
    // console.log(file.stat);

    const target = query.target;
    if (target === 'cDate') {
      const ctime = file.stat.ctime; // unix time
      date = DateTimeUtils.getDateFromUnixTime(ctime, renderInfo.dateFormat);
    } else if (target === 'mDate') {
      const mtime = file.stat.mtime; // unix time
      date = DateTimeUtils.getDateFromUnixTime(mtime, renderInfo.dateFormat);
    } else if (target === 'name') {
      date = getDateFromFilename(file, renderInfo);
    }
  }

  // console.log(date);
  return date;
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getDateFromTask = (
  content: string,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromTask");
  // Get date from '- [ ] regex with value' or '- [x] regex with value'

  // Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = window.moment('');
  const { target, type } = query;

  const pattern = getSearchTypePattern(type);

  return extractDateUsingRegexWithValue(
    content,
    `${pattern}${target}`,
    renderInfo
  );
};

export const getSearchTypePattern = (searchType: SearchType): string => {
  switch (searchType) {
    case SearchType.Task:
      return '\\[[\\sx]\\]\\';
    case SearchType.TaskDone:
      return '\\[x\\]\\s';
    case SearchType.TaskNotDone:
      return '\\[\\s\\]\\s';
    default:
      return '\\[[\\sx]\\]\\s';
  }
};

// No value, count occurrences only
export const collectDataFromFrontmatterTag = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromFrontmatterTag");
  // console.log(query);
  // console.log(dataMap);
  // console.log(xValueMap);

  const frontMatter = fileCache.frontmatter;
  let frontMatterTags: string[] = [];
  if (frontMatter && frontMatter.tags) {
    // console.log(frontMatter.tags);
    let tagMeasure = 0.0;
    let tagExist = false;
    if (Array.isArray(frontMatter.tags)) {
      frontMatterTags = frontMatterTags.concat(frontMatter.tags);
    } else if (typeof frontMatter.tags === 'string') {
      const splitTags = frontMatter.tags.split(query.getSeparator(true));
      for (const tag of splitTags) {
        const part = tag.trim();
        if (part !== '') frontMatterTags.push(part);
      }
    }
    // console.log(frontMatterTags);
    // console.log(query.target);

    for (const tag of frontMatterTags) {
      if (tag === query.target) {
        // simple tag
        tagMeasure = tagMeasure + renderInfo.constValue[query.id];
        tagExist = true;
        query.incrementTargets();
      } else if (tag.startsWith(query.target + '/')) {
        // nested tag
        tagMeasure = tagMeasure + renderInfo.constValue[query.id];
        tagExist = true;
        query.incrementTargets();
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
      addToDataMap(dataMap, xValue, query, value);
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
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromFrontmatterKey");

  const frontMatter = fileCache.frontmatter;
  if (frontMatter) {
    // console.log(frontMatter);
    // console.log(query.target);
    const deepValue = ObjectUtils.getDeepValue(frontMatter, query.target);
    // console.log(deepValue);
    if (deepValue) {
      const parsed = NumberUtils.parseFloatFromAny(
        deepValue,
        renderInfo.textValueMap
      );
      // console.log(parsed);
      if (parsed.value === null) {
        // Try parsing as a boolean: true means 1, false means 0.
        if (deepValue === 'true' || deepValue === 'false') {
          parsed.type = ValueType.Number;
          parsed.value = deepValue === 'true' ? 1 : 0;
        }
      }
      if (parsed.value !== null) {
        if (parsed.type === ValueType.Time) {
          query.valueType = ValueType.Time;
        }
        query.incrementTargets();
        const xValue = xValueMap.get(renderInfo.xDataset[query.id]);
        addToDataMap(dataMap, xValue, query, parsed.value);
        return true;
      }
    } else if (
      query.parentTarget &&
      ObjectUtils.getDeepValue(frontMatter, query.parentTarget)
    ) {
      // console.log("multiple values");
      // console.log(query.target);
      // console.log(query.parentTarget);
      // console.log(query.getSubId());
      // console.log(
      //     frontMatter[query.parentTarget]
      // );
      const toParse = ObjectUtils.getDeepValue(frontMatter, query.parentTarget);
      let splitted = null;
      if (Array.isArray(toParse)) {
        splitted = toParse.map((p) => p.toString());
      } else if (typeof toParse === 'string') {
        splitted = toParse.split(query.getSeparator());
      }
      // console.log(splitted);
      if (
        splitted &&
        splitted.length > query.getAccessor() &&
        query.getAccessor() >= 0
      ) {
        // TODO: it's not efficient to retrieve one value at a time, enhance this
        const accessor0 = splitted[query.getAccessor()].trim();
        const parsed = NumberUtils.parseFloatFromAny(
          accessor0,
          renderInfo.textValueMap
        );
        if (parsed.value !== null) {
          if (parsed.type === ValueType.Time) {
            query.valueType = ValueType.Time;
          }
          query.incrementTargets();
          const xValue = xValueMap.get(renderInfo.xDataset[query.id]);
          addToDataMap(dataMap, xValue, query, parsed.value);
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
  xValueMap: XValueMap
): boolean => {
  const links = fileCache.links;
  if (!links) return false;

  const { target: pattern, type } = query;

  let textToSearch = '';

  // Prepare textToSearch
  for (const link of links) {
    if (!link) continue;

    let wikiText = '';
    if (type === SearchType.WikiLink) {
      // wiki.link point to a file name
      // a colon is not allowed be in file name
      wikiText = link.link;
    } else if (type === SearchType.WikiDisplay) {
      if (link.displayText) wikiText = link.displayText;
    } else {
      wikiText = link.displayText ? link.displayText : link.link;
    }
    wikiText = wikiText.trim();
    textToSearch += wikiText + '\n';
  }

  return extractDataUsingRegexWithMultipleValues(
    textToSearch,
    pattern,
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
  xValueMap: XValueMap
): boolean => {
  // console.log(content);
  // Test this in Regex101
  // (^|\s)#tagName(\/[\w-]+)*(:(?<value>[\d\.\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\s|$)
  let tagName = query.target;
  if (query.parentTarget) {
    tagName = query.parentTarget; // use parent tag name for multiple values
  }
  if (tagName.length > 1 && tagName.startsWith('#')) {
    tagName = tagName.substring(1);
  }
  const pattern =
    '(^|\\s)#' +
    tagName +
    '(\\/[\\w-]+)*(:(?<value>[\\d\\.\\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\\s|$)';
  // console.log(pattern);

  return extractDataUsingRegexWithMultipleValues(
    content,
    pattern,
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
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromText");

  const { target: pattern } = query;
  // console.log(pattern);

  return extractDataUsingRegexWithMultipleValues(
    content,
    pattern,
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
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromFileMeta");

  if (file && file instanceof TFile) {
    // console.log(file.stat);

    const target = query.target;
    const xValue = xValueMap.get(renderInfo.xDataset[query.id]);

    if (target === 'cDate') {
      const ctime = file.stat.ctime; // unix time
      query.valueType = ValueType.Date;
      query.incrementTargets();
      addToDataMap(dataMap, xValue, query, ctime);
      return true;
    } else if (target === 'mDate') {
      const mtime = file.stat.mtime; // unix time
      query.valueType = ValueType.Date;
      query.incrementTargets();
      addToDataMap(dataMap, xValue, query, mtime);
      return true;
    } else if (target === 'size') {
      const size = file.stat.size; // number in
      query.incrementTargets();
      addToDataMap(dataMap, xValue, query, size);
      return true;
    } else if (target === 'numWords') {
      const numWords = CountUtils.getWordCount(content);
      addToDataMap(dataMap, xValue, query, numWords);
      return true;
    } else if (target === 'numChars') {
      const numChars = CountUtils.getCharacterCount(content);
      query.incrementTargets();
      addToDataMap(dataMap, xValue, query, numChars);
      return true;
    } else if (target === 'numSentences') {
      const numSentences = CountUtils.getSentenceCount(content);
      query.incrementTargets();
      addToDataMap(dataMap, xValue, query, numSentences);
      return true;
    } else if (target === 'name') {
      let targetMeasure = 0.0;
      let targetExist = false;
      const parsed = NumberUtils.parseFloatFromAny(
        file.basename,
        renderInfo.textValueMap
      );
      if (parsed.value !== null) {
        if (parsed.type === ValueType.Time) {
          targetMeasure = parsed.value;
          targetExist = true;
          query.valueType = ValueType.Time;
          query.incrementTargets();
        } else {
          if (!renderInfo.ignoreZeroValue[query.id] || parsed.value !== 0) {
            targetMeasure += parsed.value;
            targetExist = true;
            query.incrementTargets();
          }
        }
      }

      let value = null;
      if (targetExist) {
        value = targetMeasure;
      }
      if (value !== null) {
        addToDataMap(dataMap, xValue, query, value);
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
  xValueMap: XValueMap
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
  const pattern =
    '(^| |\\t)\\*{0,2}' +
    dvTarget +
    '\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-,@; \\t:' +
    WordCharacters +
    ']*))(\\r\\?\\n|\\r|$)';
  const outline = extractDataUsingRegexWithMultipleValues(
    content,
    pattern,
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
  xValueMap: XValueMap
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
  const pattern =
    '^.*?(\\[|\\()\\*{0,2}' +
    dvTarget +
    '\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-,@; \\t:' +
    WordCharacters +
    ']*))(\\]|\\)).*?$';
  // console.log(pattern);

  return extractDataUsingRegexWithMultipleValues(
    content,
    pattern,
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
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromTask");
  const queryType = query.type;
  // console.log(searchType);

  let strRegex = query.target;
  if (queryType === SearchType.Task) {
    strRegex = '\\[[\\sx]\\]\\s' + strRegex;
  } else if (queryType === SearchType.TaskDone) {
    strRegex = '\\[x\\]\\s' + strRegex;
  } else if (queryType === SearchType.TaskNotDone) {
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

const DataCollector = {
  getDateFromFilename,
  getDateFromFrontmatter,
  getDateFromTag,
  getDateFromText,
  getDateFromDvField,
  getDateFromWiki,
  getDateFromFileMeta,
  getDateFromTask,
  collectDataFromFrontmatterTag,
  collectDataFromFrontmatterKey,
  collectDataFromWiki,
  collectDataFromInlineTag,
  collectDataFromText,
  collectDataFromFileMeta,
  collectDataFromDvField,
  collectDataFromInlineDvField,
  collectDataFromTask,
};

export default DataCollector;
