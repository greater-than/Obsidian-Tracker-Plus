# Frequently Asked Questions

- ### Does Tracker only track data in daily notes (file names contain dates)?

  No. The file name of your notes could be any string. But we do need a date from each file. If it is not from the file name, we should add one more `searchTarget` and use that target as the source of X values by setting parameter `xDataset` to its index. The searchType `fileMeta` with `searchTarget` cDate (creation date) and mDate (modification date) are always accessible as date sources if you don't have any. Examples of these use cases could be found [here](https://github.com/greater-than/Obsidian-TrackerGT/blob/main/examples/TestXDataset.md).

- ### Why my line chart looks broken (not connected) at some points?

  Tracker only connects adjacent points (neighbor points by date) by default. To force it connecting points over missing data, set the parameter `fillGap` under `line` or `bar` to true.

- ### Why does the plugin show 'No valid date as X value found in notes'?

  First we have to confirm where is the source of your X values. Tracker always needs X values in dates. The default source of X values are the file names of your notes. As long as a proper `dateFormat` was assigned, and combine with `dateFormatPrefix` and `dateFormatSuffix`, the dates in file names could be extracted from your file names successfully.

  If the date values are from front matter, dataview inline field, or other places, choose the right `searchType` and `searchTarget` and mark them as `xDataset`, Tracker will collect X values for you.

  If you don't have any date values, and you just want to count the number of occurrences of a target. As a trick, you can use the creation date (cDate) or modification date (mDate) of the file as X data source.

  Examples of these use cases could be found [here](https://github.com/greater-than/Obsidian-TrackerGT/blob/main/examples/TestXDataset.md).

- ### Wny does the plugin show 'No valid Y value found in notes'?

  That means no matched data found in your notes. Please check the document for the detail of [target evaluation](https://github.com/greater-than/Obsidian-TrackerGT/blob/main/docs/TargetEvaluation.md).

- ### Why the plugin shows 'Error parsing YAML'?

  There are syntax errors in your code block. Please check [this document](https://github.com/greater-than/Obsidian-TrackerGT/blob/main/docs/YAML.md) for common issues.

---

### Still having problems?

You might have an idea for a new feature or discovered a bug.
Feel free to [submit it here](https://github.com/greater-than/Obsidian-TrackerGT/issues).
