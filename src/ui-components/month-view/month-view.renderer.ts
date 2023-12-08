import * as d3 from 'd3';
import { TrackerError } from '../../errors';
import { ValueType } from '../../models/enums';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import { DomUtils, UiUtils } from '../../utils';
import {
  dateToString,
  getDateByDurationToToday,
  getToday,
  toMoment,
} from '../../utils/date-time.utils';
import { expandArea } from '../../utils/dom.utils';
import { setScale } from '../../utils/ui.utils';
import { createElements } from '../shared';
import { getDayFill, getDayOpacity, toNextDataset } from './month-view.helper';
import { MonthView } from './month-view.model';
import { IDayView } from './types';
import Moment = moment.Moment;

const ratioCellToText = 2.8;
const ratioDotToText = 1.8;

/**
 * @summary Removes css from any selected day
 * @param {ComponentElements} elements
 * @param {MonthView} component
 */
export const clearSelection = (
  elements: ComponentElements,
  component: MonthView
): void => {
  for (const circle of elements.svg.selectAll('circle')) {
    const id = d3.select(circle).attr('id');
    if (id && id.startsWith('tracker-selected-circle-'))
      d3.select(circle).style('stroke', 'none');
  }
  component.selectedDate = '';
  elements.monitor.text('');
};

/**
 * @summary Renders a MonthView header
 * @param {HTMLElement} container
 * @param {ComponentElements} elements
 * @param {RenderInfo} renderInfo
 * @param {MonthView} component
 * @param {Moment} curMonthDate
 */
export const renderMonthHeader = (
  container: HTMLElement,
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: MonthView,
  curMonthDate: Moment
): void => {
  if (!renderInfo || !component) return;

  const { selectedDataset } = component;
  if (selectedDataset === null) return;
  const dataset = renderInfo.datasets.getDatasetById(selectedDataset);
  if (!dataset) return;
  const datasetName = dataset.name;

  // TODO What are these for?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curMonth = curMonthDate.month(); // 0~11
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curDaysInMonth = curMonthDate.daysInMonth(); // 28~31
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curYear = curMonthDate.year();

  const maxDayTextSize = UiUtils.getDimensions('30', 'tracker-month-label');
  const cellSize =
    Math.max(maxDayTextSize.width, maxDayTextSize.height) * ratioCellToText;

  // What is this for?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dotRadius = ((cellSize / ratioCellToText) * ratioDotToText) / 2.0;

  const headerYearText = curMonthDate.format('YYYY');
  const headerMonthText = curMonthDate.format('MMM');
  const { height: headerYearHeight } = UiUtils.getDimensions(
    headerYearText,
    'tracker-month-header-year'
  );
  const { height: headerMonthHeight } = UiUtils.getDimensions(
    headerMonthText,
    'tracker-month-header-month'
  );

  let headerHeight = headerMonthHeight;
  const ySpacing = 8;

  // Append header group
  const headerGroup = elements.graphArea.append('g');

  // header month
  const headerMonth = headerGroup
    .append('text')
    .text(headerMonthText) // pivot at center
    .attr('id', 'titleMonth')
    .attr('transform', `translate(${cellSize / 4.0}, ${headerHeight})`)
    .attr('class', 'tracker-month-header-month')
    .style('cursor', 'default')
    .on('click', () => clearSelection(elements, component));

  const headerMonthColor = component.headerMonthColor || component.color;
  if (headerMonthColor) headerMonth.style('fill', headerMonthColor);

  // header year
  headerHeight += headerYearHeight;
  const headerYear = headerGroup
    .append('text')
    .text(headerYearText) // pivot at center
    .attr('id', 'titleYear')
    .attr('transform', `translate(${cellSize / 4.0}, ${headerHeight} )`)
    .attr('class', 'tracker-month-header-year')
    .style('cursor', 'default')
    .attr('font-weight', 'bold')
    .on('click', () => clearSelection(elements, component));

  const headerYearColor = component.headerYearColor || component.color;
  if (headerYearColor) headerYear.style('fill', headerYearColor);

  // dataset rotator
  const { height: datasetNameHeight } = UiUtils.getDimensions(
    datasetName,
    'tracker-month-title-rotator'
  );
  if (
    component.mode === 'circle' ||
    (component.mode === 'annotation' && !component.showAnnotationOfAllTargets)
  ) {
    const datasetRotator = headerGroup
      .append('text')
      .text(datasetName)
      .attr(
        'transform',
        'translate(' + 3.5 * cellSize + ',' + datasetNameHeight + ')'
      )
      .attr('class', 'tracker-month-title-rotator')
      .style('cursor', 'pointer')
      .on('click', () => {
        // show next
        if (toNextDataset(renderInfo, component)) {
          clearSelection(elements, component); // clear circles
          refresh(container, renderInfo, component, elements, curMonthDate);
        }
      });
    elements['rotator'] = datasetRotator;
  }

  // value monitor
  const { height: monitorTextHeight } = UiUtils.getDimensions(
    '0.0000',
    'tracker-month-title-monitor'
  );
  const monitor = headerGroup
    .append('text')
    .text('')
    .attr('id', 'monitor')
    .attr('class', 'tracker-month-title-monitor')
    .attr(
      'transform',
      `translate(${3.5 * cellSize}, ${datasetNameHeight + monitorTextHeight})`
    )
    .style('cursor', 'pointer')
    .style('fill', component.selectedRingColor);
  elements['monitor'] = monitor;

  // arrow left
  const { height: arrowHeight } = UiUtils.getDimensions(
    '<',
    'tracker-month-title-arrow'
  );
  headerGroup
    .append('text')
    .text('<') // pivot at center
    .attr('id', 'arrowLeft')
    .attr(
      'transform',
      `translate(${5.5 * cellSize}, ${headerHeight / 2 + arrowHeight / 2})`
    )
    .attr('class', 'tracker-month-title-arrow')
    .on('click', () => {
      clearSelection(elements, component);
      component.selectedDate = '';
      const prevMonthDate = curMonthDate.clone().add(-1, 'month');
      refresh(container, renderInfo, component, elements, prevMonthDate);
    })
    .style('cursor', 'pointer');

  // arrow right
  headerGroup
    .append('text')
    .text('>') // pivot at center
    .attr('id', 'arrowLeft')
    .attr(
      'transform',
      `translate(${6.5 * cellSize}, ${headerHeight / 2 + arrowHeight / 2})`
    )
    .attr('class', 'tracker-month-title-arrow')
    .on('click', () => {
      clearSelection(elements, component);
      const nextMonthDate = curMonthDate.clone().add(1, 'month');
      refresh(container, renderInfo, component, elements, nextMonthDate);
    })
    .style('cursor', 'pointer');

  // arrow today
  headerGroup
    .append('text')
    .text('◦') // pivot at center
    .attr('id', 'arrowToday')
    .attr(
      'transform',
      `translate(${6 * cellSize}, ${headerHeight / 2 + arrowHeight / 2})`
    )
    .attr('class', 'tracker-month-title-arrow')
    .on('click', () => {
      clearSelection(elements, component);
      const today = getToday(renderInfo.dateFormat);
      refresh(container, renderInfo, component, elements, today);
    })
    .style('cursor', 'pointer');

  headerHeight += ySpacing;

  // week day names
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (component.startWeekOn.toLowerCase() === 'mon')
    weekdayNames.push(weekdayNames.shift());

  const { height: weekdayNameHeight, width: weekdayNameWidth } =
    UiUtils.getDimensions(weekdayNames[0], 'tracker-month-weekday');
  headerHeight += weekdayNameHeight;
  elements.graphArea
    .selectAll('weekDays')
    .data(weekdayNames)
    .enter()
    .append('text')
    .text((n: string) => n)
    .attr(
      'transform',
      (_n: string, i: number) =>
        `translate(${(i + 0.5) * cellSize}, ${headerHeight} )`
    )
    .attr('class', 'tracker-month-weekday')
    .attr('text-anchor', 'middle')
    .style('cursor', 'default')
    .on('click', () => clearSelection(elements, component));

  headerHeight += ySpacing;

  // dividing line
  const dividingLineHeight = 1;
  const dividingLineColor = component.dividingLineColor || component.color;
  const dividingLine = elements.graphArea
    .append('rect')
    .attr('x', 0)
    .attr('y', headerHeight)
    .attr('width', 6.5 * cellSize + weekdayNameWidth)
    .attr('height', dividingLineHeight)
    .attr('class', 'tracker-month-dividing-line');
  if (dividingLineColor) dividingLine.style('fill', dividingLineColor);

  headerHeight += dividingLineHeight;

  headerGroup.attr('height', headerHeight);
  elements['header'] = headerGroup;

  // Move sibling areas
  DomUtils.moveArea(elements.dataArea, 0, headerHeight);
};

/**
 * @summary Renders the days for a specific month
 * @param {ComponentElements} elements
 * @param {RenderInfo} renderInfo
 * @param {MonthView} component
 * @param {Moment} curMonthDate
 * @returns
 */
export function renderMonthDays(
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: MonthView,
  curMonthDate: Moment
): void {
  if (!renderInfo || !component) return;

  const mode = component.mode;
  if (mode !== 'circle' && mode !== 'annotation')
    throw new TrackerError('Unknown month view mode');

  const {
    selectedDataset,
    startWeekOn,
    circleColorByValue: colorByValue,
    showCircle,
    showStreak,
    yMin,
    yMax,
    showAnnotation,
    annotation: annotations,
    showAnnotationOfAllTargets,
    showSelectedValue,
    showSelectedRing,
    todayRingColor,
  } = component;

  if (selectedDataset === null) return;

  const dataset = renderInfo.datasets.getDatasetById(selectedDataset);
  if (!dataset) return;

  let datasetIndex = component.dataset.findIndex(
    (id) => id === selectedDataset
  );
  if (selectedDataset < 0) datasetIndex = 0;
  const threshold = component.threshold[datasetIndex];

  // TODO Why are these here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curMonth = curMonthDate.month(); // 0~11
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curDaysInMonth = curMonthDate.daysInMonth(); // 28~31

  const { height: dayTextHeight, width: dayTextWidth } = UiUtils.getDimensions(
    '30',
    'tracker-month-label'
  );
  const cellSize = Math.max(dayTextHeight, dayTextWidth) * ratioCellToText;
  const dotRadius = ((cellSize / ratioCellToText) * ratioDotToText) / 2.0;
  const streakWidth = (cellSize - dotRadius * 2.0) / 2.0;
  const streakHeight = 3;

  // Get min and max
  const min =
    yMin[datasetIndex] !== null
      ? component.yMin[datasetIndex]
      : d3.min(dataset.values);

  const max =
    yMax[datasetIndex] !== null
      ? component.yMax[datasetIndex]
      : d3.max(dataset.values);

  // scaledValue can not be calculated, do not use gradient color
  const allowScaledValue = !(max === null || min === null || max <= min);

  // Start and end
  const monthStartDate = curMonthDate.clone().startOf('month');
  let startDate = monthStartDate.clone().subtract(monthStartDate.day(), 'days');
  if (startWeekOn.toLowerCase() === 'mon') startDate = startDate.add(1, 'days');

  const monthEndDate = curMonthDate.clone().endOf('month');
  let endDate = monthEndDate.clone().add(7 - monthEndDate.day() - 1, 'days');
  if (startWeekOn.toLowerCase() === 'mon') endDate = endDate.add(1, 'days');

  const dataStartDate = dataset.startDate;
  const dataEndDate = dataset.endDate;

  // annotations
  const curAnnotation = annotations[datasetIndex];
  const { dateFormat } = renderInfo;

  // Prepare data
  const daysInMonthView: Array<IDayView> = [];
  let colIndex = 0;
  let rowIndex = 0;
  let dayIndex = 0;
  for (let date = startDate.clone(); date <= endDate; date.add(1, 'days')) {
    // not sure why we need to do this to stabilize the date
    // sometimes, the date is wrong without doing this
    date = toMoment(dateToString(date, dateFormat), dateFormat);
    const day = date.day();
    const dayInMonth = date.date();

    if (startWeekOn.toLowerCase() === 'mon') {
      colIndex = day - 1;
      if (colIndex < 0) colIndex = 6;
      rowIndex = Math.floor(dayIndex / 7);
    } else {
      colIndex = day; // 0~6
      rowIndex = Math.floor(dayIndex / 7);
    }

    // is this day in this month
    const isInThisMonth =
      date.diff(monthStartDate) < 0 || date.diff(monthEndDate) > 0
        ? false
        : true;

    // is this day out of data range
    const isOutOfDataRange =
      dataStartDate &&
      dataEndDate &&
      date.diff(dataStartDate) >= 0 &&
      date.diff(dataEndDate) <= 0;

    const value = dataset.getValue(date);

    const showCircle =
      (colorByValue && allowScaledValue) ||
      (value !== null && value > threshold);

    const scaledValue =
      colorByValue && allowScaledValue && value !== null
        ? (value - min) / (max - min)
        : null;

    // streakIn and streakOut
    const nextValue = dataset.getValue(date, 1);
    const prevValue = dataset.getValue(date, -1);

    const streakIn =
      value !== null &&
      value > threshold &&
      prevValue !== null &&
      prevValue > threshold;

    const streakOut =
      value !== null &&
      value > threshold &&
      nextValue !== null &&
      nextValue > threshold;

    let annotation = '';
    if (showAnnotation) {
      if (showAnnotationOfAllTargets) {
        Array.from(component.dataset).forEach((id, index) => {
          if (index >= 0) {
            const value = renderInfo.datasets.getDatasetById(id).getValue(date);
            if (value !== null && value > component.threshold[index])
              annotation += annotations[index];
          }
        });
        // for (const datasetId of component.dataset) {
        //   const dsIndex = component.dataset.findIndex((id) => id === datasetId);
        //   if (dsIndex >= 0) {
        //     const value = renderInfo.datasets
        //       .getDatasetById(datasetId)
        //       .getValue(date);
        //     if (value !== null && value > component.threshold[dsIndex])
        //       textAnnotation += annotation[dsIndex];
        //   }
        // }
      } else if (value > threshold) annotation = curAnnotation;
    }

    daysInMonthView.push({
      date: dateToString(date, renderInfo.dateFormat),
      value,
      scaledValue,
      dayInMonth,
      isInThisMonth,
      isOutOfDataRange,
      row: rowIndex,
      col: colIndex,
      showCircle,
      streakIn,
      streakOut,
      annotation,
    });

    dayIndex++;
  }

  // scale
  const totalDayBlockWidth = (colIndex + 1) * cellSize;

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalBlockHeight = (rowIndex + 1) * cellSize;

  const scale = d3
    .scaleLinear()
    .domain([-0.5, 6.5])
    .range([0, totalDayBlockWidth]);

  // streak lines
  if (mode === 'circle' && showCircle && showStreak) {
    const streakColor = component.circleColor || component.color || '#69b3a2';

    elements.dataArea
      .selectAll('streakIn')
      .data(daysInMonthView.filter((d: IDayView) => d.streakIn))
      .enter()
      .append('rect')
      .attr('x', (d: IDayView) => scale(d.col) - dotRadius - streakWidth)
      .attr('y', (d: IDayView) => scale(d.row) - streakHeight / 2.0)
      .attr('width', streakWidth)
      .attr('height', streakHeight)
      .style('fill', (d: IDayView) => getDayFill(d, colorByValue, streakColor))
      .style('opacity', (d: IDayView) => getDayOpacity(component, d));

    elements.dataArea
      .selectAll('streakOut')
      .data(daysInMonthView.filter((d: IDayView) => d.streakOut))
      .enter()
      .append('rect')
      .attr('x', (d: IDayView) => scale(d.col) + dotRadius)
      .attr('y', (d: IDayView) => scale(d.row) - streakHeight / 2.0)
      .attr('width', streakWidth)
      .attr('height', streakHeight)
      .style('fill', (d: IDayView) => getDayFill(d, colorByValue, streakColor))
      .style('opacity', (d: IDayView) => getDayOpacity(component, d));
  }

  // circles
  const circleColor = component.circleColor || component.color || '#69b3a2';

  if (mode === 'circle' && showCircle) {
    elements.dataArea
      .selectAll('dot')
      .data(daysInMonthView)
      .enter()
      .append('circle')
      .attr('r', dotRadius)
      .attr('cx', (d: IDayView) => scale(d.col))
      .attr('cy', (d: IDayView) => scale(d.row))
      .style('fill', (d: IDayView) => getDayFill(d, colorByValue, circleColor))
      .style('opacity', (d: IDayView) => getDayOpacity(component, d))
      .style('cursor', 'default');
  }

  // today rings
  const today = dateToString(window.moment(), renderInfo.dateFormat);
  if (mode === 'circle' && component.showTodayRing) {
    elements.dataArea
      .selectAll('todayRing')
      .data(daysInMonthView.filter((d: IDayView) => d.date === today))
      .enter()
      .append('circle')
      .attr('r', dotRadius * 0.9)
      .attr('cx', (d: IDayView) => scale(d.col))
      .attr('cy', (d: IDayView) => scale(d.row))
      .attr('class', 'tracker-month-today-circle') // stroke not works??
      .style('cursor', 'default')
      .style('stroke', todayRingColor !== '' ? todayRingColor : 'white');
  }

  // selected rings
  if (mode === 'circle' && showSelectedRing) {
    elements.dataArea
      .selectAll('selectedRing')
      .data(daysInMonthView)
      .enter()
      .append('circle')
      .attr('r', dotRadius)
      .attr('cx', (d: IDayView) => scale(d.col))
      .attr('cy', (d: IDayView) => scale(d.row))
      .attr('id', (d: IDayView) => `tracker-selected-circle-${d.date}`)
      .attr('class', 'tracker-month-selected-circle') // stroke not works??
      .style('cursor', 'default')
      .style('stroke', 'none');
  }

  // labels
  elements.dataArea
    .selectAll('dayLabel')
    .data(daysInMonthView)
    .enter()
    .append('text')
    .text((d: IDayView) => d.dayInMonth.toString())
    .attr(
      'transform',
      (d: IDayView) =>
        `translate(${scale(d.col)}, ${scale(d.row) + dayTextHeight / 4})`
    )
    .style('fill-opacity', (d: IDayView) =>
      d.isOutOfDataRange || (component.dimNotInMonth && !d.isInThisMonth)
        ? 0.2
        : 1.0
    )
    .attr('date', (d: IDayView) => d.date)
    .attr('value', (d: IDayView) => d.value)
    .attr('valueType', () => ValueType[dataset.valueType])
    .attr('class', 'tracker-month-label')
    .on('click', () => {
      // clear circles
      clearSelection(elements, component);
      // show new selected circle
      const date = d3.select(this).attr('date');
      component.selectedDate = date;
      if (showSelectedRing)
        elements.dataArea
          .select(`#tracker-selected-circle-${date}`)
          .style('stroke', component.selectedRingColor);

      // show value on monitor
      if (showSelectedValue) {
        const value = d3.select(this).attr('value');
        elements.monitor.text(
          d3.select(this).attr('valueType') === 'Time'
            ? window
                .moment('00:00', 'HH:mm', true)
                .add(parseFloat(value), 'seconds')
                .format('HH:mm')
            : value
        );
      }
    })
    .style('cursor', 'pointer');

  // annotation
  if (mode === 'annotation' && showAnnotation) {
    elements.dataArea
      .selectAll('dayAnnotation')
      .data(daysInMonthView)
      .enter()
      .append('text')
      .text((d: IDayView) => d.annotation)
      .attr(
        'transform',
        (d: IDayView) =>
          `translate(${scale(d.col)}, ${
            scale(d.row) + dayTextHeight / 4 + d.annotation ? dotRadius : 0
          })`
      )
      .attr('class', 'tracker-month-annotation');
  }

  // Adjust svg & graphArea sizes
  const { svg, graphArea, header } = elements;

  const totalH = 7 * cellSize + parseFloat(header.attr('height'));
  const totalW = 7 * cellSize;

  const svgH = parseFloat(svg.attr('height'));
  const svgW = parseFloat(svg.attr('width'));
  if (totalH > svgH) expandArea(svg, 0, totalH - svgH);
  if (totalW > svgW) expandArea(svg, totalW - svgW, 0);

  const graphAreaH = parseFloat(graphArea.attr('height'));
  const graphAreaW = parseFloat(graphArea.attr('width'));
  if (totalH > graphAreaH) expandArea(graphArea, 0, totalH - graphAreaH);
  if (totalW > graphAreaW) expandArea(svg, totalW - graphAreaW, 0);
}

const refresh = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: MonthView,
  elements: ComponentElements,
  curMonthDate: Moment
): void => {
  if (!renderInfo || !component) return;
  elements = createElements(container, renderInfo);
  renderMonthHeader(container, elements, renderInfo, component, curMonthDate);
  renderMonthDays(elements, renderInfo, component, curMonthDate);
};

export const renderMonthView = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: MonthView
): void => {
  if (!renderInfo || !component) return;

  const { dateFormat, datasets } = renderInfo;
  const { initMonth } = component;

  let availableDatasets = 0;
  for (const dataset of renderInfo.datasets)
    if (!dataset.query.usedAsXDataset) availableDatasets++;

  if (availableDatasets === 0)
    throw new TrackerError('No available dataset found');

  toNextDataset(renderInfo, component);

  if (component.selectedDataset === null)
    throw new TrackerError('No available dataset found');

  let monthDate: Moment = datasets.dates.last();
  if (initMonth) {
    monthDate =
      getDateByDurationToToday(initMonth, dateFormat) ||
      window.moment(initMonth, 'YYYY-MM', true);
    if (!monthDate.isValid) throw new TrackerError('Invalid initMonth');
  }
  if (!monthDate) return;

  const elements = createElements(container, renderInfo);

  renderMonthHeader(container, elements, renderInfo, component, monthDate);
  renderMonthDays(elements, renderInfo, component, monthDate);
  setScale(container, elements, renderInfo);
};
