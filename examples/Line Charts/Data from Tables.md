---
tags:
  - LineChart
  - output-line
  - output-month
  - searchType-table
  - xDataset
---

Use first column as X dataset , and second and third columns as Y values

```tracker
searchType: table
searchTarget: Ξdata/Tables[0][0], Ξdata/Tables[0][1], Ξdata/Tables[0][2]
xDataset: 0
line:
    yAxisLocation: none, left, right
    lineColor: none, yellow, red
    showLegend: true
```

Use first column as X dataset , and third and forth columns as Y values

```tracker
searchType: table
searchTarget: Ξdata/Tables[0][0], Ξdata/Tables[0][2], Ξdata/Tables[0][3]
xDataset: 0
line:
    yAxisLocation: none, left, right
    lineColor: none, yellow, red
    showLegend: true
    legendPosition: right
```

Use first column as X dataset. Second column posses multiple values in each cell.

```tracker
searchType: table
searchTarget: Ξdata/Tables[1][0], Ξdata/Tables[1][1][0], Ξdata/Tables[1][1][1]
xDataset: 0
separator: "@"
line:
    yAxisLocation: none, left, right
    lineColor: none, yellow, red
    showLegend: true
    legendPosition: right
```

### Tables with Defects

```tracker
searchType: table
searchTarget: Ξdata/Tables[2][0], Ξdata/Tables[2][1]
xDataset: 0
line:
    lineColor: none, yellow
```

Wrong date format in Table

```tracker
searchType: table
searchTarget: Ξdata/Tables[3][0], Ξdata/Tables[3][1]
xDataset: 0
line:
    lineColor: none, yellow
```

Please also check those search targets in markdown file /data/Tables.
