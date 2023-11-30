---
tags:
  - LineChart
  - output-line
  - output-line-yAxisTickInterval
  - output-line-yAxisTickLabelFormat
  - output-line-xAxisTickInterval
  - output-line-xAxisTickLabelFormat
  - searchType-tag
  - searchType-frontmatter
---
# Axis Interval & Format
## Y Axis Interval

_Numeric Y values_

```tracker
searchType: tag
searchTarget: weight
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-31
line:
    title: Weight Log
    yAxisLabel: Weight
    yAxisUnit: kg
    lineColor: yellow
    yAxisTickInterval: 5
    yMin: 55
```

_Y values in time_

```tracker
searchType: frontmatter
searchTarget: clock-in, clock-out
endDate: 2021-01-15
folder: Ξdiary
datasetName: Clock-In, Clock-Out
line:
    title: "Working Hours"
    yAxisLabel: "Time (24h)"
    reverseYAxis: true
    lineColor: yellow, red
    showPoint: true
    yAxisTickInterval: 1h
    yMin: 06:00
    yMax: 23:00
```

## Y Axis Tick Label Format

_Float numbers with precision of 1 decimal digits_

```tracker
searchType: tag
searchTarget: weight
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-31
line:
    title: Weight Log
    yAxisLabel: Weight
    yAxisUnit: kg
    lineColor: yellow
    yAxisTickInterval: 5
    yAxisTickLabelFormat: .2f
    yMin: 55
```

_Y values in time_

```tracker
searchType: frontmatter
searchTarget: clock-in, clock-out
endDate: 2021-01-15
folder: Ξdiary
datasetName: Clock-In, Clock-Out
line:
    title: "Working Hours"
    yAxisLabel: "Time (24h)"
    reverseYAxis: true
    lineColor: yellow, red
    showPoint: true
    yMin: 05:00
    yMax: 22:00
    yAxisTickInterval: 50m
    yAxisTickLabelFormat: H---m
```

## X Axis Interval

```tracker
searchType: tag
searchTarget: weight
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-31
line:
    title: Weight Log
    yAxisLabel: Weight
    yAxisUnit: kg
    lineColor: yellow
    xAxisTickInterval: 1w
```

## X Axis Tick Label Format

```tracker
searchType: tag
searchTarget: weight
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-31
line:
    title: Weight Log
    yAxisLabel: Weight
    yAxisUnit: kg
    lineColor: yellow
    xAxisTickInterval: 7d
    xAxisTickLabelFormat: M-DD
```
