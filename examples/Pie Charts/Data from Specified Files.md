---
tags:
  - PieChart
  - output-pie
  - specifiedFilesOnly
  - file
  - fileContainsLinkedFiles
  - fileMultiplierAfterLink
---

## Collect Data from the Linked Files Only

Count the MTG mana cost in linked files

```tracker
searchType: fileMeta, text
searchTarget: 'cDate, {W}, {R}, {G}, {B}, {(?<value>[0-9]+)}'
fileContainsLinkedFiles: Ξdata/MTG-Deck-1
specifiedFilesOnly: true
fileMultiplierAfterLink: 'x(?<value>[0-9]+)'
xDataset: 0
pie:
    label: '{{sum(dataset(1))::i}},{{sum(dataset(2))::i}},{{sum(dataset(3))::i}},{{sum(dataset(4))::i}},{{sum(dataset(5))::i}}'
    data: '{{sum(dataset(1))}},{{sum(dataset(2))}}, {{sum(dataset(3))}}, {{sum(dataset(4))}},{{sum(dataset(5))}}'
    dataColor: lightgray, firebrick, yellowgreen, lightblue, gray
```
