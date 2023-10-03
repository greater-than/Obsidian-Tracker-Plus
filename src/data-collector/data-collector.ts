import { Moment } from 'moment';
import { CachedMetadata, TFile } from 'obsidian';
import { SearchType, ValueType } from 'src/models/enums';
import { Query, RenderInfo } from '../models/data';
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
    if (ObjectUtils.getDeepValue(frontMatter, query.getTarget())) {
      let strDate = ObjectUtils.getDeepValue(frontMatter, query.getTarget());

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

  let tagName = query.getTarget();
  if (query.getParentTarget()) {
    tagName = query.getParentTarget(); // use parent tag name for multiple values
  }
  // console.log(tagName);

  const strRegex =
    '(^|\\s)#' +
    tagName +
    '(\\/[\\w-]+)*(:(?<value>[\\d\\.\\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\\s|$)';
  // console.log(strRegex);

  return extractDateUsingRegexWithValue(content, strRegex, renderInfo);
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

  const strRegex = query.getTarget();
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

  let dvTarget = query.getTarget();
  if (query.getParentTarget()) {
    dvTarget = query.getParentTarget(); // use parent tag name for multiple values
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
  // console.log(strRegex);

  return extractDateUsingRegexWithValue(content, strRegex, renderInfo);
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getDateFromWiki = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  //console.log("getDateFromWiki");
  // Get date from '[[regex with value]]'

  const date = window.moment('');

  const links = fileCache.links;
  if (!links) return date;

  const searchTarget = query.getTarget();
  const searchType = query.getType();

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
  // console.log("getDateFromFileMeta");
  // Get date from cDate, mDate or baseFileName

  let date = window.moment('');

  if (file && file instanceof TFile) {
    // console.log(file.stat);

    const target = query.getTarget();
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
  const searchType = query.getType();
  // console.log(searchType);

  let strRegex = query.getTarget();
  if (searchType === SearchType.Task) {
    strRegex = '\\[[\\sx]\\]\\s' + strRegex;
  } else if (searchType === SearchType.TaskDone) {
    strRegex = '\\[x\\]\\s' + strRegex;
  } else if (searchType === SearchType.TaskNotDone) {
    strRegex = '\\[\\s\\]\\s' + strRegex;
  } else {
    strRegex = '\\[[\\sx]\\]\\s' + strRegex;
  }
  // console.log(strTextRegex);

  return extractDateUsingRegexWithValue(content, strRegex, renderInfo);
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
      const splitted = frontMatter.tags.split(query.getSeparator(true));
      for (const splittedPart of splitted) {
        const part = splittedPart.trim();
        if (part !== '') {
          frontMatterTags.push(part);
        }
      }
    }
    // console.log(frontMatterTags);
    // console.log(query.getTarget());

    for (const tag of frontMatterTags) {
      if (tag === query.getTarget()) {
        // simple tag
        tagMeasure = tagMeasure + renderInfo.constValue[query.getId()];
        tagExist = true;
        query.addNumTargets();
      } else if (tag.startsWith(query.getTarget() + '/')) {
        // nested tag
        tagMeasure = tagMeasure + renderInfo.constValue[query.getId()];
        tagExist = true;
        query.addNumTargets();
      } else {
        continue;
      }

      // valued-tag in frontmatter is not supported
      // because the "tag:value" in frontmatter will be consider as a new tag for each existing value

      let value = null;
      if (tagExist) {
        value = tagMeasure;
      }
      const xValue = xValueMap.get(renderInfo.xDataset[query.getId()]);
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
    // console.log(query.getTarget());
    const deepValue = ObjectUtils.getDeepValue(frontMatter, query.getTarget());
    // console.log(deepValue);
    if (deepValue) {
      const retParse = NumberUtils.parseFloatFromAny(
        deepValue,
        renderInfo.textValueMap
      );
      // console.log(retParse);
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
        query.addNumTargets();
        const xValue = xValueMap.get(renderInfo.xDataset[query.getId()]);
        addToDataMap(dataMap, xValue, query, retParse.value);
        return true;
      }
    } else if (
      query.getParentTarget() &&
      ObjectUtils.getDeepValue(frontMatter, query.getParentTarget())
    ) {
      // console.log("multiple values");
      // console.log(query.getTarget());
      // console.log(query.getParentTarget());
      // console.log(query.getSubId());
      // console.log(
      //     frontMatter[query.getParentTarget()]
      // );
      const toParse = ObjectUtils.getDeepValue(
        frontMatter,
        query.getParentTarget()
      );
      let splitted = null;
      if (Array.isArray(toParse)) {
        splitted = toParse.map((p) => {
          return p.toString();
        });
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
        const splittedPart = splitted[query.getAccessor()].trim();
        const retParse = NumberUtils.parseFloatFromAny(
          splittedPart,
          renderInfo.textValueMap
        );
        if (retParse.value !== null) {
          if (retParse.type === ValueType.Time) {
            query.valueType = ValueType.Time;
          }
          query.addNumTargets();
          const xValue = xValueMap.get(renderInfo.xDataset[query.getId()]);
          addToDataMap(dataMap, xValue, query, retParse.value);
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

  const searchTarget = query.getTarget();
  const searchType = query.getType();

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
  xValueMap: XValueMap
): boolean => {
  // console.log(content);
  // Test this in Regex101
  // (^|\s)#tagName(\/[\w-]+)*(:(?<value>[\d\.\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\s|$)
  let tagName = query.getTarget();
  if (query.getParentTarget()) {
    tagName = query.getParentTarget(); // use parent tag name for multiple values
  }
  if (tagName.length > 1 && tagName.startsWith('#')) {
    tagName = tagName.substring(1);
  }
  const strRegex =
    '(^|\\s)#' +
    tagName +
    '(\\/[\\w-]+)*(:(?<value>[\\d\\.\\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\\s|$)';
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

// In form 'regex with value', name group 'value' from users
export const collectDataFromText = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromText");

  const strRegex = query.getTarget();
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

    const target = query.getTarget();
    const xValue = xValueMap.get(renderInfo.xDataset[query.getId()]);

    if (target === 'cDate') {
      const ctime = file.stat.ctime; // unix time
      query.valueType = ValueType.Date;
      query.addNumTargets();
      addToDataMap(dataMap, xValue, query, ctime);
      return true;
    } else if (target === 'mDate') {
      const mtime = file.stat.mtime; // unix time
      query.valueType = ValueType.Date;
      query.addNumTargets();
      addToDataMap(dataMap, xValue, query, mtime);
      return true;
    } else if (target === 'size') {
      const size = file.stat.size; // number in
      query.addNumTargets();
      addToDataMap(dataMap, xValue, query, size);
      return true;
    } else if (target === 'numWords') {
      const numWords = CountUtils.getWordCount(content);
      addToDataMap(dataMap, xValue, query, numWords);
      return true;
    } else if (target === 'numChars') {
      const numChars = CountUtils.getCharacterCount(content);
      query.addNumTargets();
      addToDataMap(dataMap, xValue, query, numChars);
      return true;
    } else if (target === 'numSentences') {
      const numSentences = CountUtils.getSentenceCount(content);
      query.addNumTargets();
      addToDataMap(dataMap, xValue, query, numSentences);
      return true;
    } else if (target === 'name') {
      let targetMeasure = 0.0;
      let targetExist = false;
      const retParse = NumberUtils.parseFloatFromAny(
        file.basename,
        renderInfo.textValueMap
      );
      if (retParse.value !== null) {
        if (retParse.type === ValueType.Time) {
          targetMeasure = retParse.value;
          targetExist = true;
          query.valueType = ValueType.Time;
          query.addNumTargets();
        } else {
          if (
            !renderInfo.ignoreZeroValue[query.getId()] ||
            retParse.value !== 0
          ) {
            targetMeasure += retParse.value;
            targetExist = true;
            query.addNumTargets();
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
  let dvTarget = query.getTarget();
  if (query.getParentTarget()) {
    dvTarget = query.getParentTarget(); // use parent tag name for multiple values
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
  xValueMap: XValueMap
): boolean => {
  let dvTarget = query.getTarget();
  if (query.getParentTarget()) {
    dvTarget = query.getParentTarget(); // use parent tag name for multiple values
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

// In form 'regex with value', name group 'value' from users
export const collectDataFromTask = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromTask");
  const searchType = query.getType();
  // console.log(searchType);

  let strRegex = query.getTarget();
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
