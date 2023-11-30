---
tags:
  - output-bullet
  - output-bullet-orientation
  - searchType-tag
---
# Data from Notes
### Horizontal

_value from expression function currentBreaks()_

```tracker
searchType: tag
searchTarget: clean-up
folder: Ξdiary
endDate: 2021-01-31
fixedScale: 1.1
bullet:
    title: "Clean Up"
    dataset: 0
    orientation: horizontal
    range: 10, 20, 40
    rangeColor: darkgray, silver, lightgray
    value: "{{currentBreaks()}}"
    valueUnit: times
    valueColor: '#69b3a2'
    showMarker: true
    markerValue: 24
    markerColor: black
```

### Vertical

_value from expression function sum()_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-31
bullet:
    title: "Meditation"
    dataset: 0
    orientation: vertical
    range: 30, 60, 100
    rangeColor: darkgray, silver, lightgray
    value: "{{sum()}}"
    valueUnit: times
    valueColor: steelblue
    showMarker: true
    markerValue: 80
    markerColor: red
```

Please also check those search targets in markdown files under folder 'Ξdiary'.
