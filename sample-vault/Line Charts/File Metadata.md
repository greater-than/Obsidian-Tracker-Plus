---
tags:
  - LineChart
  - output-line
  - searchType-filemeta
  - searchType-dvField
---
# File Metadata

Track the size variation of diaries

```tracker
searchType: fileMeta
searchTarget: size
folder: Ξdiary
endDate: 2021-01-31
line:
    title: File Size Variation
    yAxisLabel: Size
    yAxisUnit: bytes
```

Use file created dates (cDate) as x values

```tracker
searchType: fileMeta, dvField
searchTarget: cDate, dataviewTarget
xDataset: 0
folder: Ξdata
line:
    fillGap: true
```

Use file modified dates (mDate) as x values

```tracker
searchType: fileMeta, dvField
searchTarget: mDate, dataviewTarget
xDataset: 0
folder: Ξdata
line:
    fillGap: true
```

Please also check those search targets in markdown files under folder 'Ξdiary' and 'Ξdata'.

---

tags: #tracker #line-chart #fileMeta #dvField
