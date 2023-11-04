import { CachedMetadata, TFile } from 'obsidian';
import { SearchType, ValueType } from './models/enums';
import { Query } from './models/query';
import { RenderInfo } from './models/render-info';
import { IQueryValuePair, TDataMap, TNumberValueMap } from './models/types';
import * as helper from './utils/helper';
import Moment = moment.Moment;

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
    if (helper.deepValue(frontMatter, query.getTarget())) {
      let strDate = helper.deepValue(frontMatter, query.getTarget());

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

// helper function
// strRegex must have name group 'value'
// Named group 'value' could be provided from users or plugin
function extractDateUsingRegexWithValue(
  text: string,
  strRegex: string,
  renderInfo: RenderInfo
): Moment {
  let date = window.moment('');

  const regex = new RegExp(strRegex, 'gm');
  let match;
  while ((match = regex.exec(text))) {
    // console.log(match);
    if (
      typeof match.groups !== 'undefined' &&
      typeof match.groups.value !== 'undefined'
    ) {
      // must have group name 'value'
      let strDate = match.groups.value.trim();
      // console.log(strDate);

      strDate = helper.getDateStringFromInputString(
        strDate,
        renderInfo.dateFormatPrefix,
        renderInfo.dateFormatSuffix
      );

      date = helper.strToDate(strDate, renderInfo.dateFormat);
      if (date.isValid()) {
        return date;
      }
    }
  }

  return date;
}

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
      date = helper.getDateFromUnixTime(ctime, renderInfo.dateFormat);
    } else if (target === 'mDate') {
      const mtime = file.stat.mtime; // unix time
      date = helper.getDateFromUnixTime(mtime, renderInfo.dateFormat);
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

export const addToDataMap = (
  dataMap: TDataMap,
  date: string,
  query: Query,
  value: number | null
) => {
  if (!dataMap.has(date)) {
    const queryValuePairs = new Array<IQueryValuePair>();
    queryValuePairs.push({ query: query, value: value });
    dataMap.set(date, queryValuePairs);
  } else {
    const targetValuePairs = dataMap.get(date);
    targetValuePairs.push({ query: query, value: value });
  }
};

// Helper function
// Accept multiple values using custom separators
// regex with value --> extract value
// regex without value --> count occurrences
const extractDataUsingRegexWithMultipleValues = (
  text: string,
  strRegex: string,
  query: Query,
  dataMap: TDataMap,
  xValueMap: TNumberValueMap,
  renderInfo: RenderInfo
): boolean => {
  // console.log("extractDataUsingRegexWithMultipleValues");

  const regex = new RegExp(strRegex, 'gm');
  let match;
  let measure = 0.0;
  let extracted = false;
  while ((match = regex.exec(text))) {
    // console.log(match);
    if (!renderInfo.ignoreAttachedValue[query.getId()]) {
      if (
        typeof match.groups !== 'undefined' &&
        typeof match.groups.value !== 'undefined'
      ) {
        const values = match.groups.value.trim();
        // console.log(values);
        // console.log(query.getSeparator());
        const splitted = values.split(query.getSeparator());
        // console.log(splitted);
        if (!splitted) continue;
        if (splitted.length === 1) {
          // console.log("single-value");
          const toParse = splitted[0].trim();
          // console.log(toParse);
          const retParse = helper.parseFloatFromAny(
            toParse,
            renderInfo.textValueMap
          );
          if (retParse.value !== null) {
            if (retParse.type === ValueType.Time) {
              measure = retParse.value;
              extracted = true;
              query.valueType = ValueType.Time;
              query.addNumTargets();
            } else {
              if (
                !renderInfo.ignoreZeroValue[query.getId()] ||
                retParse.value !== 0
              ) {
                measure += retParse.value;
                extracted = true;
                query.addNumTargets();
              }
            }
          }
        } else if (
          splitted.length > query.getAccessor() &&
          query.getAccessor() >= 0
        ) {
          // console.log("multiple-values");
          const toParse = splitted[query.getAccessor()].trim();
          const retParse = helper.parseFloatFromAny(
            toParse,
            renderInfo.textValueMap
          );
          //console.log(retParse);
          if (retParse.value !== null) {
            if (retParse.type === ValueType.Time) {
              measure = retParse.value;
              extracted = true;
              query.valueType = ValueType.Time;
              query.addNumTargets();
            } else {
              measure += retParse.value;
              extracted = true;
              query.addNumTargets();
            }
          }
        }
      } else {
        // no named groups, count occurrences
        // console.log("count occurrences");
        measure += renderInfo.constValue[query.getId()];
        extracted = true;
        query.addNumTargets();
      }
    } else {
      // force to count occurrences
      // console.log("forced count occurrences");
      measure += renderInfo.constValue[query.getId()];
      extracted = true;
      query.addNumTargets();
    }
  }

  if (extracted) {
    const xValue = xValueMap.get(renderInfo.xDataset[query.getId()]);
    addToDataMap(dataMap, xValue, query, measure);
    return true;
  }

  return false;
};

// No value, count occurrences only
export const collectDataFromFrontmatterTag = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: TDataMap,
  xValueMap: TNumberValueMap
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
  dataMap: TDataMap,
  xValueMap: TNumberValueMap
): boolean => {
  // console.log("collectDataFromFrontmatterKey");

  const frontMatter = fileCache.frontmatter;
  if (frontMatter) {
    // console.log(frontMatter);
    // console.log(query.getTarget());
    const deepValue = helper.deepValue(frontMatter, query.getTarget());
    // console.log(deepValue);
    if (deepValue) {
      const retParse = helper.parseFloatFromAny(
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
      helper.deepValue(frontMatter, query.getParentTarget())
    ) {
      // console.log("multiple values");
      // console.log(query.getTarget());
      // console.log(query.getParentTarget());
      // console.log(query.getSubId());
      // console.log(
      //     frontMatter[query.getParentTarget()]
      // );
      const toParse = helper.deepValue(frontMatter, query.getParentTarget());
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
        const retParse = helper.parseFloatFromAny(
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
  dataMap: TDataMap,
  xValueMap: TNumberValueMap
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
  dataMap: TDataMap,
  xValueMap: TNumberValueMap
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
  dataMap: TDataMap,
  xValueMap: TNumberValueMap
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
  dataMap: TDataMap,
  xValueMap: TNumberValueMap
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
      const numWords = helper.getWordCount(content);
      addToDataMap(dataMap, xValue, query, numWords);
      return true;
    } else if (target === 'numChars') {
      const numChars = helper.getCharacterCount(content);
      query.addNumTargets();
      addToDataMap(dataMap, xValue, query, numChars);
      return true;
    } else if (target === 'numSentences') {
      const numSentences = helper.getSentenceCount(content);
      query.addNumTargets();
      addToDataMap(dataMap, xValue, query, numSentences);
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
  dataMap: TDataMap,
  xValueMap: TNumberValueMap
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
  dataMap: TDataMap,
  xValueMap: TNumberValueMap
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
  dataMap: TDataMap,
  xValueMap: TNumberValueMap
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
