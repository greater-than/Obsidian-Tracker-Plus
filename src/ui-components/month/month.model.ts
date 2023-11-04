import { ComponentType } from '../../models/enums';
import { IComponent } from '../../models/types';

export class Month implements IComponent {
  mode: string;
  dataset: number[];
  startWeekOn: string;
  threshold: number[];
  yMin: number[];
  yMax: number[];
  color: string;
  dimNotInMonth: boolean;
  initMonth: string; // YYYY-MM
  showSelectedValue: boolean;

  // header
  headerYearColor: string;
  headerMonthColor: string;
  dividingLineColor: string;

  // circles and rings
  showCircle: boolean;
  showStreak: boolean;
  showTodayRing: boolean;
  showSelectedRing: boolean;
  circleColor: string;
  circleColorByValue: boolean;
  todayRingColor: string;
  selectedRingColor: string;

  // annotations
  showAnnotation: boolean;
  annotation: string[];
  showAnnotationOfAllTargets: boolean;

  // internal
  selectedDate: string;
  selectedDataset: number;

  constructor() {
    this.mode = 'circle'; // circle, annotation
    this.dataset = [];
    this.startWeekOn = 'Sun';
    this.threshold = []; // if value > threshold, will show dot
    this.yMin = [];
    this.yMax = [];
    this.color = null;
    this.dimNotInMonth = true;
    this.initMonth = '';
    this.showSelectedValue = true;

    // header
    this.headerYearColor = null;
    this.headerMonthColor = null;
    this.dividingLineColor = null;

    // circles and rings
    this.showCircle = true;
    this.showStreak = true; // a streak connects neighbor dots
    this.showTodayRing = true;
    this.showSelectedRing = true;
    this.circleColor = null;
    this.circleColorByValue = false;
    this.todayRingColor = ''; // white
    this.selectedRingColor = 'firebrick';

    // annotations
    this.showAnnotation = true;
    this.annotation = []; // annotation for each dataset, accept expression thus value
    this.showAnnotationOfAllTargets = true;

    // internal
    this.selectedDate = ''; // selected date
    this.selectedDataset = null; // selected index of dataset
  }

  public componentType() {
    return ComponentType.Month;
  }
}
