# Concepts

This plugin was designed to read code blocks in [YAML format](https://en.wikipedia.org/wiki/YAML). The key-value pairs in the code blocks tell the plugin what data to collect and how to represent the result.

[Here](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/docs/InputParameters.md) are all the parameters (key-value pairs) defined in this plugin. They are used for collecting data, evaluating targets, data preprocessing, and rendering output.

### Collecting Data

Providing parameters `searchType` and `searchTarget` is the minimum requirement for a successful data collection. `searchType` can be `tag`, `frontmatter`, `wiki`, `dvField`, `table`, `fileMeta`, `task`, or `text`. Then the corresponding `searchTarget` should be provided according to the specified type.

### Target Evaluation

Depending on the `searchType` and the `searchTarget` you provided, the target evaluation will be different. Simply speaking, you can track the occurrences of a target or the value attached/embedded in it.

To see the detail about the target evaluation, please check the document [Target Evaluation](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/docs/TargetEvaluation.md).

### Rendering Output

Currently, there are six types of output: `line`, `bar`, `pie`, `bullet`, `month`, `pie`, and summary. You must provide at least one output parameter in a code block.

#### Line & Bar Charts

With output set to `line` or `bar`, Tracker plugin will generate a customizable chart. These charts are very good at visualizing the variation of data in the notes.

#### Pie Charts

Output type `pie` creates a pie chart. The `data` parameter should be applied for circular sectors you want to add. Parameter `label` and `extLabel` are used for displaying labels and `dataName` is used for the display names on legend.

#### Bullet Graphs

The output type `bullet` creates a [bullet graph](https://en.wikipedia.org/wiki/Bullet_graph) and can serve as a gauge showing the status (level, performance, progress) of a dataset.

#### Month Views

The output type `month` creates a month view with circled dates exceeding the given threshold and streaks showing how long it persisted.

#### Summaries

With the output type `summary`, a text block based on your '**template**' parameter will be created. You can use [expressions](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/docs/Expressions.md) like '{{sum()}}' or '{{maxStreak()}}' in the template parameter, to get a statistical summary of collected data.

Detailed description for all parameters of the output types can be found [here](https://github.com/greater-than/Obsidian-Tracker-Plus/blob/main/docs/InputParameters.md).
