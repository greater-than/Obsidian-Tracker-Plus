# Examples

A table of use cases and examples including data.

- [Use Cases](#use-cases)
- [Tracker Examples](#tracker-examples)

## Use Cases

Check where (Location) and what (Target to Track) is your target and find the settings (Tracker) you need.

| Location      | Target to Track                                                                                                                                      | Tracker                                                                                                                                                                                  | Get (O)ccurrences/(V)alues |
| :------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------: |
| content       | #meditation                                                                                                                                          | searchType: tag<br>searchTarget: meditation                                                                                                                                              |             O              |
| frontmatter   | ---<br>tags: meditation<br>---                                                                                                                       | searchType: tag<br>searchTarget: meditation                                                                                                                                              |             O              |
| content       | #weight:60.5kg                                                                                                                                       | searchType: tag<br>searchTarget: weight                                                                                                                                                  |             V              |
| content       | #finance/bank1/transfer:100USD                                                                                                                       | searchType: tag<br>searchTarget: finance/bank1/transfer                                                                                                                                  |             V              |
| content       | #finance/bank1/transfer:100USD<br>#finance/bank1/income:80USD<br>#finance/bank1/outcome:-120USD                                                      | searchType: tag<br>searchTarget: finance/bank1                                                                                                                                           |             V              |
| content       | #blood-pressure:180/120                                                                                                                              | searchType: tag<br>searchTarget: blood-pressure[0], blood-pressure[1]                                                                                                                    |             V              |
| content       | dvTarget:: 20.5                                                                                                                                      | searchType: dvField<br>searchTarget: dvTarget                                                                                                                                            |             V              |
| content       | dvTarget:: 20.5/30.5                                                                                                                                 | searchType: dvField<br>searchTarget: dvTarget[0], dvTarget[1]                                                                                                                            |             V              |
| content       | dvTarget:: 20.5, 30.5                                                                                                                                | searchType: dvField<br>searchTarget: dvTarget[0], dvTarget[1]<br>separator: 'comma'                                                                                                      |             V              |
| frontmatter   | ---<br>mood: 10<br>---                                                                                                                               | searchType: frontmatter<br>searchTarget: mood                                                                                                                                            |             V              |
| frontmatter   | ---<br>bp: 184.4/118.8<br>---                                                                                                                        | searchType: frontmatter<br>searchTarget: bp[0], bp[1]                                                                                                                                    |             V              |
| frontmatter   | ---<br>bp: 184.4, 118.8<br>---                                                                                                                       | searchType: frontmatter<br>searchTarget: bp[0], bp[1]<br>separator: 'comma'                                                                                                              |             V              |
| frontmatter   | ---<br>bp: [184.4, 118.8]<br>---                                                                                                                     | searchType: frontmatter<br>searchTarget: bp[0], bp[1]                                                                                                                                    |             V              |
| frontmatter   | ---<br>clock-in: 10:45<br>clock-out: 20:51<br>---                                                                                                    | searchType: frontmatter<br>searchTarget: clock-in, clock-out                                                                                                                             |             V              |
| content       | [[journal]]                                                                                                                                          | searchType: wiki<br>searchTarget: journal                                                                                                                                                |             O              |
| content       | ⭐                                                                                                                                                   | searchType: text<br>searchTarget: ⭐                                                                                                                                                     |             O              |
| content       | love                                                                                                                                                 | searchType: text<br>searchTarget: love                                                                                                                                                   |             O              |
| content       | test@gmail.com<br>test@hotmail.com                                                                                                                   | searchType: text<br>searchTarget: '.+\\@.+\\..+'                                                                                                                                         |             O              |
| content       | #weightlifting: 50                                                                                                                                   | searchType: text<br>searchTarget: 'weightlifting: (?\<value\>[\\-]?[0-9]+[\\.][0-9]+\|[\\-]?[0-9]+)'                                                                                     |             V              |
| content       | I walked 10000 steps today.                                                                                                                          | searchType: text<br>searchTarget: 'walked\\s+(?\<value\>[0-9]+)\\s+steps'                                                                                                                |             V              |
| content       | myValues 1/2/3                                                                                                                                       | searchType: text<br>searchTarget: 'myValues\\s+(?\<value\>[0-9]+)/([0-9]+)/([0-9]+), myValues\\s+([0-9]+)/(?\<value\>[0-9]+)/([0-9]+), myValues\\s+([0-9]+)/([0-9]+)/(?\<value\>[0-9]+)' |             V              |
| table content | { a table filled with dates and values }<br>[example table](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/data/Tables.md) | searchType: table<br>searchTarget: filePath[0][0], filePath[0][1]                                                                                                                        |             V              |
| table content | { a table filled with dates and values }<br>[example table](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/data/Tables.md) | searchType: table<br>searchTarget: filePath[1][0], filePath[1][1][0], filePath[1][1][1]                                                                                                  |             V              |
| file meta     | meta data from files <br>(size, cDate, mDate, numWords, numChars, numSentences)                                                                      | searchType: fileMeta<br>searchTarget: size                                                                                                                                               |             V              |
| content       | - [x] Say love<br>- [ ] Say love                                                                                                                     | searchType:task<br>searchTarget: Say love                                                                                                                                                |             O              |
| content       | - [x] Say love                                                                                                                                       | searchType:task.done<br>searchTarget: Say love                                                                                                                                           |             O              |
| content       | - [ ] Say love                                                                                                                                       | searchType: task.notdone<br>searchTarget: Say love                                                                                                                                       |             O              |

## Tracker Examples

The notes and data used for the [tracker examples](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples) listed below can be found in the '[diary](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/diary)' and '[data](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/data)' folders.

Common Trackers

- [Blood Pressure Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/blood-pressure-trackers.md)
- [Finance Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/finance-trackers.md)
- [Habit Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/habit-trackers.md)
- [Star Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/star-trackers.md)
- [Weight Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/weight-trackers.md)
- [Wiki Trackers](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/wiki-trackers.md)

---

Additional Examples

- [Bar Charts](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/bar-charts.md)
- [Pie Charts](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/pie-charts.md)
- [Bullet Graphs](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/bullet-graphs.md)
- [Month Views](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/month-views.md)
- [Summaries](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/summaries.md)

---

Advanced Tracker Configuration

- [Axis Intervals and Formats](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/axis-interval-and-format.md)
- [Date Formats](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/date-formats.md)
- [DataView Inline Field](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/dataview-fields.md)
- [Expression](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/expressions.md)
- [File Metadata](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/file-metadata.md)
- [Legends](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/legends.md)
- [Multiple Targets & Multiple Values](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/multiple-targets-and-values.md)
- [Regular Expressions](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/regex.md)
- [Scaling and Positioning](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/scaling-and-positioning.md)
- [Specified Files](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/TestSpecifiedFiles.md)
- [Tables](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/tables.md)
- [Tasks](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/tasks.md)
- [Text-value Map/Mood Tracker](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/text-value-map.md)
- [Time Values](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/time-values.md)
- [Word Counting](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/counting-words.md)
- [X Datasets](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/x-datasets.md)

---

When Things Don't Go as Planned

- [Error Messages](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/ErrorMessages.md)
