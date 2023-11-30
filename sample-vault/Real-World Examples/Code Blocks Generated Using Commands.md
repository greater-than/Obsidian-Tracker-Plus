---
tags:
  - LineChart
  - output-line
  - commands
---
# Code Blocks Using Tracker+ Commands
The code blocks below were generated using [Tracker+ Commands](Commands.md)

```tracker
searchType: tag
searchTarget: weight
folder: /
endDate: 2021-02-01
line:
    title: "Line Chart"
    xAxisLabel: Date
    yAxisLabel: Value
```

```tracker
searchType: tag
searchTarget: weight
folder: /
endDate: 2021-02-01
bar:
    title: "Bar Chart"
    xAxisLabel: Date
    yAxisLabel: Value
```

```tracker
searchType: tag
searchTarget: weight
folder: /
startDate:
endDate:
summary:
    template: "Average value of tagName is {{average()}}"
    style: "color:white;"
```
