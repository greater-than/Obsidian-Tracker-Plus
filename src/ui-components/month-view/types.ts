export interface IDayView {
  date: string;
  value: number;
  scaledValue: number;
  row: number;
  col: number;

  dayInMonth: number;
  isInThisMonth: boolean;
  isOutOfDataRange: boolean;
  showCircle: boolean;
  streakIn: boolean;
  streakOut: boolean;
  annotation: string;
}
