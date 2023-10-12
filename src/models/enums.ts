export enum SearchType {
  Tag = 'tag',
  Frontmatter = 'frontmatter',
  Wiki = 'wiki',
  WikiLink = 'wiki.link',
  WikiDisplay = 'wiki.display',
  Text = 'text',
  DvField = 'dvField',
  Table = 'table',
  FileMeta = 'filemeta',
  Task = 'task',
  TaskDone = 'task.done',
  TaskNotDone = 'task.notdone',
}

export const SearchTypeValues: string[] = Object.values(SearchType);

export enum YAxisLocation {
  NONE = 'none',
  LEFT = 'left',
  RIGHT = 'right',
}

export const YAxisLocationValues: string[] = Object.values(YAxisLocation);

export enum ComponentType {
  LineChart,
  BarChart,
  PieChart,
  Radar,
  Summary,
  Table,
  Month,
  Heatmap,
  BulletGraph,
  Unknown,
}

export enum ValueType {
  Number,
  Int,
  Date,
  Time,
  DateTime,
  String,
}
