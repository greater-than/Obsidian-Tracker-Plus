---
tags:
  - Summary
  - output-summary
  - summary-template
  - searchType-dvField
  - searchType-tag
---
# Template Expressions
All examples here using the output type `summary`.
To see examples of `bullet` and `pie`, please see [bullet graphs](../Bullet%20Graphs/Data%20from%20Notes.md) and [pie charts](../Pie%20Charts/Data%20from%20Notes.md).

## Operators

### number and number

_number \+ number --> number_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-03
summary:
    template: 'Maximum value: {{10 + 10::i}} <-- should be 20'
```

### Dataset and number

_Dataset \+ number --> Dataset_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-03
summary:
    template: 'Maximum value: {{max() + 10::i}} <-- should be 48 + 10'
```

_Dataset \- number --> Dataset_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-03
summary:
    template: 'Maximum value: {{max() - 2::i}} <-- should be 48 - 2'
```

_Dataset \* number --> Dataset_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-03
summary:
    template: 'Maximum value: {{max() * 2::i}} <-- should be 48 * 2'
```

_Dataset / number --> Dataset_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-03
summary:
    template: 'Maximum value: {{max() / 2::i}} <-- should be 48 / 2'
```

_Dataset % number --> Dataset_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-03
summary:
    template: 'Maximum value: {{max() % 5::i}} <-- should be 48 % 5'
```

### Dataset and Dataset

_Dataset1 \+ Dataset2 --> Dataset ==> Dataset[i] = Dataset1[i] + Dataset2[i]_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
startDate: 2021-01-01
endDate: 2021-01-03
summary:
    template: 'Maximum value: {{max(dataset(0) + dataset(0))::i}} <-- should be 48 + 48'
```

## Functions

_NOTE: If the input dataset is missing, it will use the first available Y dataset found._

### Functions Accept Dataset and Return a Value

_min(Dataset): number_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
endDate: 2021-01-03
summary:
    template: 'Minimum value: {{min()::i}} <-- should be 12'
```

_minDate(Dataset): Date_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
endDate: 2021-01-03
summary:
    template: 'Latest date of minimum value: {{minDate()}} <-- should be 2021-01-03'
```

_max(Dataset): number_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
endDate: 2021-01-03
summary:
    template: 'Maximum value: {{max()::i}} <-- should be 48'
```

_maxDate(Dataset): Date_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
endDate: 2021-01-03
summary:
    template: 'Latest date of maximum value: {{maxDate()}} <-- should be 2021-01-01'
```

_startDate(Dataset): Date_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
endDate: 2021-01-03
summary:
    template: 'Start date: {{startDate()}} <-- should be 2021-01-01'
```

_endDate(Dataset): Date_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
endDate: 2021-01-03
summary:
    template: 'End date: {{endDate()}} <-- should be 2021-01-03'
```

_sum(Dataset): number_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-04
summary:
    template: 'Sum: {{sum()::i}} <-- should be 3'
```

_numTargets(Dataset): number_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-04
summary:
    template: 'Number of targets: {{numTargets()::i}} <-- should be 3'
```

_numDays(Dataset): number_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-04
summary:
    template: 'Number of days: {{numDays()::i}} <-- should be 4'
```

_numDaysHavingData(Dataset): number_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-04
summary:
    template: 'Number of days having data: {{numDaysHavingData()::i}} <-- should be 3'
```

_maxStreak(Dataset): number_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-09
summary:
    template: 'Maximum streak: {{maxStreak()::i}} <-- should be 5'
```

_maxStreakStart(Dataset): Date_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-09
summary:
    template: 'The start date of maximum streak: {{maxStreakStart()}} <-- should be 2021-01-02'
```

_maxStreakEnd(Dataset): Date_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-09
summary:
    template: 'The end date of maximum streak: {{maxStreakEnd()}} <-- should be 2021-01-06'
```

_maxBreaks(Dataset): number_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-09
summary:
    template: 'Maximum breaks: {{maxBreaks()::i}} <-- should be 2'
```

_maxBreaksStart(Dataset): Date_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-09
summary:
    template: 'The start date of maximum breaks: {{maxBreaksStart()}} <-- should be 2021-01-07'
```

_maxBreaksEnd(Dataset): Date_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-09
summary:
    template: 'The end date of maximum breaks: {{maxBreaksEnd()}} <-- should be 2021-01-08'
```

_currentStreak(Dataset): number_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-24
summary:
    template: 'Latest streak: {{currentStreak()::i}} <-- should be 1'
```

_currentStreakStart(Dataset): Date_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-24
summary:
    template: 'The start date of current streak: {{currentStreakStart()}} <-- should be 2021-01-24'
```

_currentStreakEnd(Dataset): Date_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-24
summary:
    template: 'The end date of current streak: {{currentStreakEnd()}} <-- should be 2021-01-24'
```

_currentBreaks(Dataset): number_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-22
summary:
    template: 'Current breaks: {{currentBreaks()::i}} <-- should be 1'
```

_currentBreaksStart(Dataset): number_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-22
summary:
    template: 'The start date of current breaks: {{currentBreaksStart()}} <-- should be 2021-01-22'
```

_currentBreaksEnd(Dataset): Date_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-22
summary:
    template: 'The end date of current breaks: {{currentBreaksEnd()}} <-- should be 2021-01-22'
```

_average(Dataset): number_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
endDate: 2021-01-03
summary:
    template: 'Average value: {{average()::.2f}} <-- (48+25+12)/3 should be 28.33'
```

_median(Dataset): number_

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
endDate: 2021-01-03
summary:
    template: 'Median value: {{median()::i}} <-- should be 25'
```

_variance(Dataset): number_
https://mathworld.wolfram.com/SampleVariance.html

```tracker
searchType: dvField
searchTarget: dataviewTarget
folder: Ξdiary
endDate: 2021-01-03
summary:
    template: 'Variance value: {{variance()::.2f}} <-- should be 332.33'
```

### Functions Accept Dataset and Return a Dataset

_normalize(Dataset): Dataset_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-04
summary:
    template: 'Set missing values to -1, do normalization then do summation: {{sum( normalize( setMissingValues(dataset(0), -1) ) )::i}} <-- should be 3'
```

_setMissingValues(Dataset): Dataset_

```tracker
searchType: tag
searchTarget: meditation
folder: Ξdiary
endDate: 2021-01-04
summary:
    template: 'Set missing values to -1 then do summation: {{sum( setMissingValues( dataset(0), -1 ) )::i}} <-- should be 2'
```
