---
tags:
  - Summary
  - output-line
  - output-summary
  - searchType-filemeta
---
# Word Counts
### From daily notes

```tracker
searchType: fileMeta
searchTarget: numWords
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-05
summary:
    template: 'Total number of words: {{sum()}}'
```

```tracker
searchType: fileMeta
searchTarget: numChars
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-05
summary:
    template: 'Total number of characters: {{sum()}}'
```

### From all notes

_Use file creation dates as x values then sum the counts up_

```tracker
searchType: fileMeta
searchTarget: cDate, numWords
xDataset: 0
folder: /
summary:
    template: "Total word count: {{sum(dataset(1))}}"
```
