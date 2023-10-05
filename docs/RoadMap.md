# Road Map

The items listed below were created by [@pyrochlore](https://github.com/pyrochlore). We will do our best to honor their intentions and implement these features.

**Have an idea for a new feature? [You can make a request here](https://github.com/greater-than/Obsidian-TrackerGT/discussions)**

<span style="color:green; font-weight:bold">✓</span> _indicates implemented features_

## Data

- Support tracking key-value pairs in frontmatter <span style="color:green; font-weight:bold">✓</span>
- Support searching text using regular expression <span style="color:green; font-weight:bold">✓</span>
- Support multiple targets and multiple values <span style="color:green; font-weight:bold">✓</span>
- Add a parameter xDataset to identify targets to be used as x values <span style="color:green; font-weight:bold">✓</span>
- Allow tracking time values <span style="color:green; font-weight:bold">✓</span>
- Allow tracking date values
- Get data from a table <span style="color:green; font-weight:bold">✓</span>
- Collect data from dataview plugin's inline fields <span style="color:green; font-weight:bold">✓</span>
- Collect meta information from file <span style="color:green; font-weight:bold">✓</span>
- Support tracking tasks <span style="color:green; font-weight:bold">✓</span>

  ***

- Allow manual data input (x and y values) in custom datasets
- Allow forced value types
- Allow using non-date x values
- Allow multiple points (different time stamp) from a single file
- Allow arithmetics operation on dataset and generate custom datasets
- Add data post-process function, e.g. 'moving average'

## UI Components

- Implement output type 'summary' <span style="color:green; font-weight:bold">✓</span><br />
  _analyzes the input data and represents it using a user-defined text template_
- Implement output type 'bar' <span style="color:green; font-weight:bold">✓</span><br />
  _renders a bar chart_
- Implement output type 'bullet' <span style="color:green; font-weight:bold">✓</span><br />
  _renders a bullet graph_
- Implement output type 'month' <span style="color:green; font-weight:bold">✓</span><br />
  _renders a month view_
- Implement output type 'pie' <span style="color:green; font-weight:bold">✓</span><br />
  _rendering a pie chart_
- Add parameters for adjusting the size of the graph <span style="color:green; font-weight:bold">✓</span>
- Allow expressions evaluating operators and functions <span style="color:green; font-weight:bold">✓</span>
- Allow format string for evaluated expressions <span style="color:green; font-weight:bold">✓</span>

  ***

- Implement output type 'heatmap'<br />
  _rendering a heatmap like Github activity chart_
- Multiple outputs from one code block
- Support graphs showing the correlation between sets of data
- Allow a graph drawing selected dataset

## Miscellaneous

- Add Commands help create Tracker blocks <span style="color:green; font-weight:bold">✓</span>

  ***

- Add an 'Explode' button to the rendered blocks, it will replace the code block with the rendered result
- Add a helper panel for adding frequently used tracking targets to article

## Performance

- Use PixiJS to do rendering

---

_Features may not be implemented in the order listed above_

### _Got an Idea for A New Feature?_

-
