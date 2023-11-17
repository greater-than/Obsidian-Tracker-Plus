import { SentenceCountPattern, WordCountPattern } from '../regex-patterns';
import { cleanText } from './string.utils';

/**
 * @summary: Gets count of sentences from the provided string
 * @description: Thanks to Extract Highlights plugin and AngelusDomini. Also, https://stackoverflow.com/questions/5553410
 * @param {string} text
 * @returns {number}
 */
export const getSentenceCount = (text: string): number =>
  ((cleanText(text) || '').match(SentenceCountPattern) || []).length;

/**
 * @summary: Returns the word count from the provided string based on common delimters
 * @description: Thanks to @lukeleppan for plugin 'better-word-count'. Code from https://github.com/lukeleppan/better-word-count/blob/main/src/stats.ts
 * @param {string} text
 * @returns {number}
 */
export const getWordCount = (text: string): number =>
  (cleanText(text).match(WordCountPattern) || []).length;

/**
 * @summary Returns the number of characters in a string
 * @param {string} text
 * @returns {number}
 */
export const getCharacterCount = (text: string): number => text.length;
