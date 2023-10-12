import 'colors';

const blueChars = [
  '                       ╻               ',
  ',━━━┓ ,━━━ ,━━━.  ━━━. ┣━━─  ,━━━. ,━━━',
  '┃   ┃ ┃    ┣━━━┛ ,━━━┫ ┃     ┣━━━┛ ┃   ',
  '`───┦ ╵    `───  `───┚ `───  `───  ╵   ',
  " ───'",
];
const cyanChars = [
  '╻     ╻',
  '┣━━─  ┣━━━.  ━━━. ,━━━.',
  '┃     ┃   ┃ ,━━━┫ ┃   ┃',
  '`───  ╵   ╵ `───┚ ╵   ╵',
  '',
];

const spacer = 1;
const padding = 1;

export const dividerLeft = '─'.repeat(blueChars[1].length + padding + spacer);
export const dividerRight = '─'.repeat(cyanChars[1].length + padding);
export const divider: string = `${dividerLeft.blue}${dividerRight.cyan}`;

export const successMark = '\u2713'.green;
export const failureMark = '\u2716'.red;

export const greater = 'greater';
export const than = 'than';
export const solutions = 'solutions';
export const llc = 'llc';

export const info = 'info';
export const https = 'https';
export const comma = ',';
export const colon = ':';
export const at = '@';
export const slashes = '//';
export const dot = '.';

export const greaterThan = [greater.blue, than.blue];
export const greaterThanLlc = [
  greaterThan.join(''),
  comma.gray,
  llc.gray.italic,
];
export const greaterThanSolutions = [
  greaterThan.join(''),
  dot.gray,
  solutions.cyan,
];
export const website = [
  https.cyan,
  colon.gray,
  slashes.white,
  greaterThanSolutions.join(''),
];
export const email = [info.cyan, at.white, greaterThanSolutions.join('')];

export const logoType: string = (() => {
  const logo = [];
  for (let index = 0; index < blueChars.length; index++)
    logo.push(
      ' '.repeat(padding),
      blueChars[index].blue,
      ' '.repeat(spacer),
      cyanChars[index].cyan,
      '\n'
    );
  return `${logo.join('')}`;
})();

export const footer = ((): string => {
  const lineLength = dividerLeft.length + dividerRight.length;
  const webSiteLen =
    `${https}${colon}${slashes}${greater}${than}${dot}${solutions}`.length;
  const emailLen = `${info}${at}${greater}${than}${dot}${solutions}`.length;
  const row1 = `${' '.repeat(lineLength - webSiteLen - padding)}${website.join(
    ''
  )}`;
  const row2 = `${' '.repeat(lineLength - emailLen - padding)}${email.join(
    ''
  )}`;
  return `${divider}${'\n'.repeat(padding)}${logoType}${row1}\n${row2}\n\n`;
})();
