export interface DayInfo {
  date: string;
  value: number;
  scaledValue: number;
  dayInMonth: number;
  isInThisMonth: boolean;
  isOutOfDataRange: boolean;
  row: number;
  col: number;
  showCircle: boolean;
  streakIn: boolean;
  streakOut: boolean;
  annotation: string;
}
