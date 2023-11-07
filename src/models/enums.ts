export enum SearchType {
  Tag = 'tag',
  Frontmatter = 'frontmatter',
  Wiki = 'wiki',
  WikiLink = 'wiki.link',
  WikiDisplay = 'wiki.display',
  Text = 'text',
  DataviewField = 'dvField',
  Table = 'table',
  FileMeta = 'fileMeta',
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
  Line,
  Bar,
  Pie,
  Radar,
  Summary,
  Table,
  Month,
  Heatmap,
  Bullet,
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
