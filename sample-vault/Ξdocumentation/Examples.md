# Examples

- [Use Cases](#Use%20Cases)
- [Trackers](#Tracker%20Examples)
- [Error Messages](#When%20Things%20Don't%20Go%20as%20Planned)

## Use Cases

A table of use cases and examples including data. Check **Search In**, and **Target to Track** and find the tracker code block properties you should use.

| Search In     | Target to Track                                                                                 | Tracker Code Block                                                                                                                                                                       | (O)ccurrences or (V)alues |
| :------------ | :---------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----------------------: |
| content       | #meditation                                                                                     | searchType: tag<br>searchTarget: meditation                                                                                                                                              |             O             |
| content       | #weight:60.5kg                                                                                  | searchType: tag<br>searchTarget: weight                                                                                                                                                  |             V             |
| content       | #finance/bank1/transfer:100USD                                                                  | searchType: tag<br>searchTarget: finance/bank1/transfer                                                                                                                                  |             V             |
| content       | #finance/bank1/transfer:100USD<br>#finance/bank1/income:80USD<br>#finance/bank1/outcome:-120USD | searchType: tag<br>searchTarget: finance/bank1                                                                                                                                           |             V             |
| content       | #blood-pressure:180/120                                                                         | searchType: tag<br>searchTarget: blood-pressure[0], blood-pressure[1]                                                                                                                    |             V             |
| content       | dvTarget:: 20.5                                                                                 | searchType: dvField<br>searchTarget: dvTarget                                                                                                                                            |             V             |
| content       | dvTarget:: 20.5/30.5                                                                            | searchType: dvField<br>searchTarget: dvTarget[0], dvTarget[1]                                                                                                                            |             V             |
| content       | dvTarget:: 20.5, 30.5                                                                           | searchType: dvField<br>searchTarget: dvTarget[0], dvTarget[1]<br>separator: 'comma'                                                                                                      |             V             |
| content       | [[journal]]                                                                                     | searchType: wiki<br>searchTarget: journal                                                                                                                                                |             O             |
| content       | ⭐                                                                                              | searchType: text<br>searchTarget: ⭐                                                                                                                                                     |             O             |
| content       | love                                                                                            | searchType: text<br>searchTarget: love                                                                                                                                                   |             O             |
| content       | test@gmail.com<br>test@hotmail.com                                                              | searchType: text<br>searchTarget: '.+\\@.+\\..+'                                                                                                                                         |             O             |
| content       | #weightlifting: 50                                                                              | searchType: text<br>searchTarget: 'weightlifting: (?\<value\>[\\-]?[0-9]+[\\.][0-9]+\|[\\-]?[0-9]+)'                                                                                     |             V             |
| content       | I walked 10000 steps today.                                                                     | searchType: text<br>searchTarget: 'walked\\s+(?\<value\>[0-9]+)\\s+steps'                                                                                                                |             V             |
| content       | myValues 1/2/3                                                                                  | searchType: text<br>searchTarget: 'myValues\\s+(?\<value\>[0-9]+)/([0-9]+)/([0-9]+), myValues\\s+([0-9]+)/(?\<value\>[0-9]+)/([0-9]+), myValues\\s+([0-9]+)/([0-9]+)/(?\<value\>[0-9]+)' |             V             |
| content       | - [x] Say love<br>- [ ] Say love                                                                | searchType:task<br>searchTarget: Say love                                                                                                                                                |             O             |
| content       | - [x] Say love                                                                                  | searchType:task.done<br>searchTarget: Say love                                                                                                                                           |             O             |
| content       | - [ ] Say love                                                                                  | searchType: task.notdone<br>searchTarget: Say love                                                                                                                                       |             O             |
| file meta     | meta data from files <br>(size, cDate, mDate, numWords, numChars, numSentences)                 | searchType: fileMeta<br>searchTarget: size                                                                                                                                               |             V             |
| frontmatter   | ---<br>tags: meditation<br>---                                                                  | searchType: tag<br>searchTarget: meditation                                                                                                                                              |             O             |
| frontmatter   | ---<br>mood: 10<br>---                                                                          | searchType: frontmatter<br>searchTarget: mood                                                                                                                                            |             V             |
| frontmatter   | ---<br>bp: 184.4/118.8<br>---                                                                   | searchType: frontmatter<br>searchTarget: bp[0], bp[1]                                                                                                                                    |             V             |
| frontmatter   | ---<br>bp: 184.4, 118.8<br>---                                                                  | searchType: frontmatter<br>searchTarget: bp[0], bp[1]<br>separator: 'comma'                                                                                                              |             V             |
| frontmatter   | ---<br>bp: [184.4, 118.8]<br>---                                                                | searchType: frontmatter<br>searchTarget: bp[0], bp[1]                                                                                                                                    |             V             |
| frontmatter   | ---<br>clock-in: 10:45<br>clock-out: 20:51<br>---                                               | searchType: frontmatter<br>searchTarget: clock-in, clock-out                                                                                                                             |             V             |
| table content | { a table filled with dates and values }<br>[example table](../Ξdata/Tables.md)                 | searchType: table<br>searchTarget: filePath[0][0], filePath[0][1]                                                                                                                        |             V             |
| table content | { a table filled with dates and values }<br>[example table](../Ξdata/Tables.md)                 | searchType: table<br>searchTarget: filePath[1][0], filePath[1][1][0], filePath[1][1][1]                                                                                                  |             V             |

## Tracker Examples

The notes and data used for the examples listed below can be found in the `Ξdiary` and `Ξdata` folders.

### Common Trackers

- [Blood Pressure Trackers](Blood%20Pressure%20Trackers.md)
- [Finance Trackers](Finance%20Trackers.md)
- [Habit Trackers](Habit%20Trackers.md)
- [Star Trackers](../Star%20Trackers.md)
- [Weight Trackers](../Weight%20Trackers.md)
- [Wiki Trackers](Wiki%20Trackers.md)

### Additional Examples

#### Bar Charts

- [Data from Tags](../Bar%20Charts/Data%20from%20Tags.md)

#### Line Charts

- [Axis Interval & Format](../Line%20Charts/Axis%20Interval%20&%20Format.md)
- [Data from Dataview Fields](../Line%20Charts/Data%20from%20Dataview%20Fields.md)
- [Data from Notes Using Regular Expressions](../Line%20Charts/Data%20from%20Notes%20Using%20Regular%20Expressions.md)
- [Data from Specified Files](../Line%20Charts/Data%20from%20Specified%20Files.md)
- [Data from Tables](../Line%20Charts/Data%20from%20Tables.md)
- [Date Formats](../Line%20Charts/Date%20Formats.md)
- [File Metadata](../Line%20Charts/File%20Metadata.md)
- [Frontmatter](../Line%20Charts/Frontmatter.md)
- [Legend Position & Orientation](../Line%20Charts/Legend%20Position%20&%20Orientation.md)
- [Multiple Targets & Values](../Line%20Charts/Multiple%20Targets%20&%20Values.md)
- [Relative Start & End Dates](../Line%20Charts/Relative%20Start%20&%20End%20Dates.md)
- [Scaling, Positioning, & Aspect Ratio](Scale,%20Position,%20&%20Aspect%20Ratio.md)
- [Tab Characters](../Line%20Charts/Tab%20Characters.md)
- [TextValueMap](../Line%20Charts/TextValueMap.md)
- [Time Data](../Line%20Charts/Time%20Data.md)
- [Tracking Emojis](../Line%20Charts/Tracking%20Emojis.md)
- [Word Counts](../Line%20Charts/Word%20Counts.md)
- [X Datasets](../Line%20Charts/X%20Datasets.md)

#### Pie Charts

- [Data Embedded in Code Block](../Pie%20Charts/Data%20Embedded%20in%20Code%20Block.md)
- [Data from Notes](../Pie%20Charts/Data%20from%20Notes.md)
- [Data from Specified Files](../Pie%20Charts/Data%20from%20Specified%20Files.md)

#### Bullet Graphs

- [Data Embedded in Code Block](Bullet%20Graphs/Data%20Embedded%20in%20Code%20Block.md)
- [Data from Notes](../Bullet%20Graphs/Data%20from%20Notes.md)

#### Month Views

- [Basic Month View](../Month%20Views/Basic%20Month%20View.md)
- [Data from Tables](../Month%20Views/Data%20from%20Tables.md)
- [Styling](../Month%20Views/Styling.md)

#### Summaries

- [Multiple Lines](../Summaries/Multiple%20Lines.md)
- [Styling](../Summaries/Styling.md)
- [Template Expressions](../Summaries/Template%20Expressions.md)
- [Word Counts](../Summaries/Word%20Counts.md)

---

### When Things Don't Go as Planned
Examples of error messages you may encounter

- [Error Messages](../ErrorMessages.md)
