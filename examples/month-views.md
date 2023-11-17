# Month Views

## Single target

### Minimum setup

1. Use default colors only
2. Use parameter `datasetName` to set the title name

```tracker
searchType: tag
searchTarget: meditation
datasetName: Meditation
folder: diary
month:
```

### Colorized

1. Click "<" to see data in previous month
2. Click ">" to see data in next month
3. Click "◦" to see data in current month

```tracker
searchType: tag
searchTarget: exercise-pushup
datasetName: PushUp
folder: diary
month:
    startWeekOn: 'Sun'
    threshold: 40
    color: tomato
    headerMonthColor: orange
    dimNotInMonth: false
    todayRingColor: orange
    selectedRingColor: steelblue
    showSelectedValue: true
```

### Colorized

```tracker
searchType: tag
searchTarget: meditation
datasetName: Meditation
folder: diary
month:
    startWeekOn: 'Sun'
    color: steelblue
    headerMonthColor: green
    selectedRingColor: orange
```

### Colored by Values

Use parameter `circleColorByValue`, color the circles based on the values

```tracker
searchType: tag
searchTarget: exercise-pushup
datasetName: PushUp
folder: diary
month:
    startWeekOn:
    threshold: 40
    color: green
    headerMonthColor: orange
    dimNotInMonth: false
    todayRingColor: orange
    selectedRingColor: steelblue
    circleColorByValue: true
    showSelectedValue: true
```

### Check minDate, minValue, maxDate, maxValue

```tracker
searchType: tag
searchTarget: exercise-pushup
summary:
    template: "minDate: {{minDate()}}\nminValue: {{min()}}\nmaxDate: {{maxDate()}}\nmaxValue: {{max()}}"
```

### initMonth

Specify the initial month in YYYY-MM format

```tracker
searchType: tag
searchTarget: exercise-pushup
datasetName: PushUp
folder: diary
month:
    startWeekOn:
    threshold: 40
    color: green
    headerMonthColor: orange
    dimNotInMonth: false
    todayRingColor: orange
    selectedRingColor: steelblue
    circleColorByValue: true
    showSelectedValue: true
    initMonth: 2021-09
```

Specify the initial month by relative date

```tracker
searchType: tag
searchTarget: exercise-pushup
datasetName: PushUp
folder: diary
month:
    startWeekOn:
    threshold: 40
    color: green
    headerMonthColor: orange
    dimNotInMonth: false
    todayRingColor: orange
    selectedRingColor: steelblue
    circleColorByValue: true
    showSelectedValue: true
    initMonth: -1M
```

## Multiple targets

1. Use parameter `datasetName` to specify the name of each dataset
2. Use parameter `dataset` to include dataset we are going to view
3. Use parameter `threshold` to specify the level of achievement (affect the streaks)
4. Click the datasetName label in month view to change the target dataset

```tracker
searchType: tag
searchTarget: exercise-pushup, meditation
datasetName: PushUp, Meditation
folder: diary
month:
    dataset: 0, 1
    startWeekOn: 'Sun'
    threshold: 40, 0
    color: green
    headerMonthColor: orange
    dimNotInMonth: false
    todayRingColor: orange
    selectedRingColor: steelblue
    circleColorByValue: true
    showSelectedValue: true
```

## Annotations

One target at a time

```tracker
searchType: tag
searchTarget: exercise-pushup, meditation
datasetName: PushUp, Meditation
folder: diary
month:
    mode: annotation
    startWeekOn: 'Sun'
    threshold: 40, 0
    color: green
    headerMonthColor: orange
    dimNotInMonth: false
    annotation: 💪,🧘‍♂️
    showAnnotationOfAllTargets: false
```

All targets

```tracker
searchType: tag
searchTarget: exercise-pushup, meditation
datasetName: PushUp, Meditation
folder: diary
month:
    mode: annotation
    startWeekOn: 'Sun'
    threshold: 40, 0
    color: green
    headerMonthColor: orange
    dimNotInMonth: false
    annotation: 💪,🧘‍♂️
    showAnnotationOfAllTargets: true
```

Please also check those search targets in markdown files under folder 'diary'.
