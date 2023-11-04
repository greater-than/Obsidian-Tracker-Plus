export enum SearchType {
  Tag,
  Frontmatter,
  Wiki,
  WikiLink,
  WikiDisplay,
  Text,
  dvField,
  Table,
  FileMeta,
  Task,
  TaskDone,
  TaskNotDone,
}

export const SearchTypeValues: (string | SearchType)[] =
  Object.values(SearchType);

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
