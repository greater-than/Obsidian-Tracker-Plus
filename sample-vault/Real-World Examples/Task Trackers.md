---
tags:
  - output-summary
  - output-month
  - Task-Tracker
  - searchType-task
---
# Task Trackers
## Summaries

#### All Tasks

_Collect all tasks matched `searchTarget`_

```tracker
searchType: task
searchTarget: Say I love you
folder: Ξdiary
summary:
    template: "Total count: {{sum()}}"
```

#### All Tasks

_Collect all tasks matched `searchTarget`_

```tracker
searchType: task.all
searchTarget: Say I love you
folder: Ξdiary
summary:
    template: "Total count: {{sum()}}"
```

#### Task Done

_Collect all tasks done matched `searchTarget`_

```tracker
searchType: task.done
searchTarget: Say I love you
folder: Ξdiary
summary:
    template: "How many days I said: {{sum()}}"
```

#### Task Not Done

_Collect all tasks not-done matched `searchTarget`_

```tracker
searchType: task.notdone
searchTarget: Say I love you
folder: Ξdiary
summary:
    template: "How many days I didn't say: {{sum()}}"
```

## Month View

See tasks done in month view

```tracker
searchType: task.done
searchTarget: Say I love you
folder: Ξdiary
datasetName: Love
endDate: 2021-01-31
month:
    color: tomato
    headerMonthColor: orange
    todayRingColor: orange
    selectedRingColor: steelblue
    showSelectedValue: false
```

`task.done` and `task.notdone`

```tracker
searchType: task.done, task.notdone
searchTarget: Say I love you, Say I love you
folder: Ξdiary
datasetName: Good Lover, Bad Lover
endDate: 2021-01-31
month:
    color: tomato
    headerMonthColor: orange
    todayRingColor: orange
    selectedRingColor: steelblue
    showSelectedValue: false
```
