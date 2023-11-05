# Version History

### Version 1.11.0

- First release from [@greater-than](https://github.com/greater-than)
- Adds aspect ratio parameter for graphs. Thanks, [@woodworker](https://github.com/woodworker)
- Support for inline dataview fields. Thanks, [@Laharah](https://github.com/Laharah)
- Adds ability to track boolean properties. Thanks, [@bnjbvr](https://github.com/bnjbvr)

---

### Version 1.10.0

- Add annotation mode for month view ([examples](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/TestCalendar.md))
- Add parameters `xAxisTickInterval`, `yAxisTickInterval`, `xAxisTickLabelFormat` and `yAxisTickLabelFormat` for the line and bar chart ([examples](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/TestAxisIntervalAndFormat.md))
- Allow using regular expression in parameter `dateFormatPrefix` and `dateFormatSuffix` ([examples](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/TestDateFormats.md))
- Add parameters `file`, `specifiedFilesOnly`, `fileContainsLinkedFiles`, and `fileMultiplierAfterLink` to retrieve data from specified files ([examples](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/TestSpecifiedFiles.md))
- Add a parameter `textValueMap` to convert texts or emojis to specified values ([examples](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/examples/TestTextValueMap.md))
- Fixed bugs
- Enhanced error messages

### Version 1.10.1

- Fixed 'failed to load plugin' on iOS

### Version 1.10.2

- Fixed plugin not rendering on some macOS machines

### Version 1.10.3

- Allow using the parameter `fitPanelWidth` with the output type `month` and `pie`
- Fixed the resizing and positioning of the chart tooltip

### Version 1.10.4

- Allow using a regular expression as a key of the parameter `textValueMap`
- Add a parameter `shiftOnlyValueLargerThan` to determine when to do `valueShift`
- Fixed bugs reported by users
- Fixed typo in plugin settings

### Version 1.10.5

- Allow using a relative date value in `initMonth` in the month view

### Version 1.10.6

- Fixed the coloring for missing data in the month view

### Version 1.10.7

- Allow using html image tags as emoji inputs

### Version 1.10.8

- Fixed startDate/endDate misread as a relative date

### Version 1.10.9

- Replace tab characters with spaces
- Accept more unicode characters in dvField
- Allow emojis in the folder path
- Fixed bugs

### !!! Breaking Changes !!!

Starting at version 1.9.0, template variables, e.g. `{{sum}}`, have been deprecated.

Instead, Tracker+ provides operators:

- `+`, `-`, `\*`, `/`, `%`

and functions:

- `dataset()`, `sum()`, `maxStreak()`, etc...

Replace `{{sum}}` with `{{sum()}}` or `{{sum(1)}}` with `{{sum(dataset(1))}}`.

More information about the new expressions can be found [here](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/docs/Expressions.md).
