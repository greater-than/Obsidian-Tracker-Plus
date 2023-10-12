export const commands = [
  {
    id: 'add-line-chart-tracker',
    name: 'Add Line Chart Tracker',
    callback: () => `\`\`\` tracker
    searchType: tag
    searchTarget: tagName
    folder: /
    startDate:
    endDate:
    line:
        title: "Line Chart"
        xAxisLabel: Date
        yAxisLabel: Value
    \`\`\``,
  },
  {
    id: 'add-bar-chart-tracker',
    name: 'Add Bar Chart Tracker',
    callback: () => `\`\`\` tracker
    searchType: tag
    searchTarget: tagName
    folder: /
    startDate:
    endDate:
    bar:
        title: "Bar Chart"
        xAxisLabel: Date
        yAxisLabel: Value
    \`\`\``,
  },
  {
    id: 'add-summary-tracker',
    name: 'Add Summary Tracker',
    callback: () => `\`\`\` tracker
    searchType: tag
    searchTarget: tagName
    folder: /
    startDate:
    endDate:
    summary:
        template: "Average value of tagName is {{average}}"
        style: "color:white;"
    \`\`\``,
  },
];
