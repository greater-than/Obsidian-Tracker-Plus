const CurrencyCodes =
  '\u0024\u20AC\u00A3\u00A5\u00A2\u20B9\u20A8\u20B1\u20A9\u0E3F\u20AB\u20AA';
const AlphabetCodes = '\u03B1-\u03C9\u0391-\u03A9';
const IntellectualPropertyCodes = '\u00A9\u00AE\u2117\u2122\u2120';
const CJKCodes = '\u4E00-\u9FFF\u3400-\u4DBF\u3000\u3001-\u303F';
export const WordCharacters =
  '\\w' + CurrencyCodes + AlphabetCodes + IntellectualPropertyCodes + CJKCodes;
