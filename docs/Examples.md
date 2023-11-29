# Examples

- [Use Cases](#use-cases)
- [Tracker Examples](#tracker-examples)
- [Error Message Examples](#when-things-dont-go-as-planned)

## Use Cases

A table of use cases and examples including data. Check **Search In**, and **Target to Track** and find the tracker code block properties you should use.

| Search In     | Target to Track                                                                                                                                      | Tracker Code Block                                                                                                                                                                       | (O)ccurrences or (V)alues |
| :------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----------------------: |
| content       | #meditation                                                                                                                                          | searchType: tag<br>searchTarget: meditation                                                                                                                                              |             O             |
| frontmatter   | ---<br>tags: meditation<br>---                                                                                                                       | searchType: tag<br>searchTarget: meditation                                                                                                                                              |             O             |
| content       | #weight:60.5kg                                                                                                                                       | searchType: tag<br>searchTarget: weight                                                                                                                                                  |             V             |
| content       | #finance/bank1/transfer:100USD                                                                                                                       | searchType: tag<br>searchTarget: finance/bank1/transfer                                                                                                                                  |             V             |
| content       | #finance/bank1/transfer:100USD<br>#finance/bank1/income:80USD<br>#finance/bank1/outcome:-120USD                                                      | searchType: tag<br>searchTarget: finance/bank1                                                                                                                                           |             V             |
| content       | #blood-pressure:180/120                                                                                                                              | searchType: tag<br>searchTarget: blood-pressure[0], blood-pressure[1]                                                                                                                    |             V             |
| content       | dvTarget:: 20.5                                                                                                                                      | searchType: dvField<br>searchTarget: dvTarget                                                                                                                                            |             V             |
| content       | dvTarget:: 20.5/30.5                                                                                                                                 | searchType: dvField<br>searchTarget: dvTarget[0], dvTarget[1]                                                                                                                            |             V             |
| content       | dvTarget:: 20.5, 30.5                                                                                                                                | searchType: dvField<br>searchTarget: dvTarget[0], dvTarget[1]<br>separator: 'comma'                                                                                                      |             V             |
| frontmatter   | ---<br>mood: 10<br>---                                                                                                                               | searchType: frontmatter<br>searchTarget: mood                                                                                                                                            |             V             |
| frontmatter   | ---<br>bp: 184.4/118.8<br>---                                                                                                                        | searchType: frontmatter<br>searchTarget: bp[0], bp[1]                                                                                                                                    |             V             |
| frontmatter   | ---<br>bp: 184.4, 118.8<br>---                                                                                                                       | searchType: frontmatter<br>searchTarget: bp[0], bp[1]<br>separator: 'comma'                                                                                                              |             V             |
| frontmatter   | ---<br>bp: [184.4, 118.8]<br>---                                                                                                                     | searchType: frontmatter<br>searchTarget: bp[0], bp[1]                                                                                                                                    |             V             |
| frontmatter   | ---<br>clock-in: 10:45<br>clock-out: 20:51<br>---                                                                                                    | searchType: frontmatter<br>searchTarget: clock-in, clock-out                                                                                                                             |             V             |
| content       | [[journal]]                                                                                                                                          | searchType: wiki<br>searchTarget: journal                                                                                                                                                |             O             |
| content       | ⭐                                                                                                                                                   | searchType: text<br>searchTarget: ⭐                                                                                                                                                     |             O             |
| content       | love                                                                                                                                                 | searchType: text<br>searchTarget: love                                                                                                                                                   |             O             |
| content       | test@gmail.com<br>test@hotmail.com                                                                                                                   | searchType: text<br>searchTarget: '.+\\@.+\\..+'                                                                                                                                         |             O             |
| content       | #weightlifting: 50                                                                                                                                   | searchType: text<br>searchTarget: 'weightlifting: (?\<value\>[\\-]?[0-9]+[\\.][0-9]+\|[\\-]?[0-9]+)'                                                                                     |             V             |
| content       | I walked 10000 steps today.                                                                                                                          | searchType: text<br>searchTarget: 'walked\\s+(?\<value\>[0-9]+)\\s+steps'                                                                                                                |             V             |
| content       | myValues 1/2/3                                                                                                                                       | searchType: text<br>searchTarget: 'myValues\\s+(?\<value\>[0-9]+)/([0-9]+)/([0-9]+), myValues\\s+([0-9]+)/(?\<value\>[0-9]+)/([0-9]+), myValues\\s+([0-9]+)/([0-9]+)/(?\<value\>[0-9]+)' |             V             |
| table content | { a table filled with dates and values }<br>[example table](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/data/Tables.md) | searchType: table<br>searchTarget: filePath[0][0], filePath[0][1]                                                                                                                        |             V             |
| table content | { a table filled with dates and values }<br>[example table](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/data/Tables.md) | searchType: table<br>searchTarget: filePath[1][0], filePath[1][1][0], filePath[1][1][1]                                                                                                  |             V             |
| file meta     | meta data from files <br>(size, cDate, mDate, numWords, numChars, numSentences)                                                                      | searchType: fileMeta<br>searchTarget: size                                                                                                                                               |             V             |
| content       | - [x] Say love<br>- [ ] Say love                                                                                                                     | searchType:task<br>searchTarget: Say love                                                                                                                                                |             O             |
| content       | - [x] Say love                                                                                                                                       | searchType:task.done<br>searchTarget: Say love                                                                                                                                           |             O             |
| content       | - [ ] Say love                                                                                                                                       | searchType: task.notdone<br>searchTarget: Say love                                                                                                                                       |             O             |

## Tracker Examples

The notes and data used for the [tracker examples](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples) listed below can be found in the '[diary](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/diary)' and '[data](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/data)' folders.

### Common Tracker Uses

- [Blood Pressure Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Blood%20Pressure%20Trackers.md)
- [Finance Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Finance%20Trackers.md)
- [Habit Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Habit%20Trackers.md)
- [Star Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Star%20Trackers.md)
- [Weight Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Weight%20Trackers.md)
- [Wiki Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Wiki%20Trackers.md)

---

### Additional Examples

#### Bar Charts

- [Data from Tags](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Bar%20Charts/Data%20from%20Tags.md)

#### Line Charts

- [Axis Interval & Format](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Axis%20Interval%20&%20Format.md)
- [Data from Dataview Fields](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Data%20from%20Dataview%20Fields.md)
- [Data from Notes Using Regular Expressions](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Data%20from%20Notes%20Using%20Regular%20Expressions.md)
- [Data from Specified Files](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Data%20from%20Specified%20Files.md)
- [Data from Tables](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Data%20from%20Tables.md)
- [Date Formats](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Date%20Formats.md)
- [File Metadata](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/File%20Metadata.md)
- [Frontmatter](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Frontmatter.md)
- [Legend Position & Orientation](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Legend%20Position%20&%20Orientation.md)
- [Multiple Targets & Values](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Multiple%20Targets%20&%20Values.md)
- [Relative Start & End Dates](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Relative%20Start%20&%20End%20Dates.md)
- [Scaling, Positioning, & Aspect Ratio](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Scaling,%20Positioning%20&%20Aspect%20Ratio.md)
- [Tab Characters](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Tab%20Characters.md)
- [TextValueMap](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/TextValueMap.md)
- [Time Data](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Time%20Data.md)
- [Tracking Emojis](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Tracking%20Emojis.md)
- [Word Counts](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/Word%20Counts.md)
- [X Datasets](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Line%20Charts/X%20Datasets.md)

#### Pie Charts

- [Data Embedded in Code Block](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Pie%20Charts/Data%20Embedded%20in%20Code%20Block.md)
- [Data from Notes](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Pie%20Charts/Data%20from%20Notes.md)
- [Data from Specified Files](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Pie%20Charts/Data%20from%20Specified%20Files.md)

#### Bullet Graphs

- [Data Embedded in Code Block](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Bullet%20Graphs/Data%20Embedded%20in%20Code%20Block.md)
- [Data from Notes](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Bullet%20Graphs/Data%20from%20Notes.md)

#### Month Views

- [Basic Month View](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Month%20Views/Basic%20Month%20View.md)
- [Data from Tables](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Month%20Views/Data%20from%20Tables.md)
- [Styling](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Month%20Views/Styling.md)

#### Summaries

- [Multiple Lines](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Summaries/Multiple%20Lines.md)
- [Styling](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Summaries/Styling.md)
- [Template Expressions](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Summaries/Template%20Expressions.md)
- [Word Counts](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/Summaries/Word%20Counts.md)

---

### When Things Don't Go as Planned

- [Error Messages](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/ErrorMessages.md)
