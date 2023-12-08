import * as d3 from 'd3';
import { TrackerError } from '../../errors';
import { ValueType } from '../../models/enums';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import { DateTimeUtils, DomUtils, UiUtils } from '../../utils';
import { setScale } from '../../utils/ui.utils';
import { createElements } from '../shared';
import { MonthView } from './month-view.model';
import { IDayView } from './types';
import Moment = moment.Moment;

const ratioCellToText = 2.8;
const ratioDotToText = 1.8;

export const toNextDataset = (
  renderInfo: RenderInfo,
  component: MonthView
): boolean => {
  const datasetIds = component.dataset;
  if (datasetIds.length === 0) return false; // false if selected dataset not changed

  let dataset = null;
  if (component.selectedDataset === null) {
    for (const datasetId of datasetIds) {
      dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset && !dataset.query.usedAsXDataset) break;
    }
    if (dataset) {
      component.selectedDataset = dataset.id;
      return true; // true if selected dataset changed
    }
  } else {
    const curDatasetId = component.selectedDataset;
    let curIndex = datasetIds.findIndex((id) => {
      return id === curDatasetId;
    });
    if (curIndex >= 0) {
      if (curIndex === component.dataset.length - 1) {
        // search from start
        for (const datasetId of datasetIds) {
          dataset = renderInfo.datasets.getDatasetById(datasetId);
          if (dataset && !dataset.query.usedAsXDataset) break;
        }
        if (dataset) {
          component.selectedDataset = dataset.id;
          return true; // true if selected dataset changed
        } else {
          return false;
        }
      } else {
        curIndex++;
        const datasetId = datasetIds[curIndex];
        dataset = renderInfo.datasets.getDatasetById(datasetId);
        component.selectedDataset = datasetId;
        if (dataset && !dataset.query.usedAsXDataset) {
          return true;
        } else {
          toNextDataset(renderInfo, component);
        }
      }
    }
  }

  return false;
};

export const clearSelection = (
  elements: ComponentElements,
  component: MonthView
) => {
  const circles = elements.svg.selectAll('circle');
  for (const circle of circles) {
    const id = d3.select(circle).attr('id');
    if (id && id.startsWith('tracker-selected-circle-')) {
      d3.select(circle).style('stroke', 'none');
    }
  }
  component.selectedDate = '';
  elements.monitor.text('');
};

export const refresh = (
  container: HTMLElement,
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: MonthView,
  curMonthDate: Moment
): void => {
  if (!renderInfo || !component) return;
  elements = createElements(container, renderInfo, {
    elements,
    clearContents: true,
  });
  renderHeader(container, elements, renderInfo, component, curMonthDate);
  renderDays(container, elements, renderInfo, component, curMonthDate);
};

export const renderHeader = (
  container: HTMLElement,
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: MonthView,
  curMonthDate: Moment
): void => {
  if (!renderInfo || !component) return;

  const curDatasetId = component.selectedDataset;
  if (curDatasetId === null) return;
  const dataset = renderInfo.datasets.getDatasetById(curDatasetId);
  if (!dataset) return;
  const datasetName = dataset.name;

  // TODO What are these for?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curMonth = curMonthDate.month(); // 0~11
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curDaysInMonth = curMonthDate.daysInMonth(); // 28~31
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curYear = curMonthDate.year();

  const { height: cellHeight, width: cellWidth } = UiUtils.getDimensions(
    '30',
    'tracker-month-label'
  );
  const cellSize = Math.max(cellWidth, cellHeight) * ratioCellToText;

  // What is this for?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dotRadius = ((cellSize / ratioCellToText) * ratioDotToText) / 2.0;

  let headerHeight = 0;
  const ySpacing = 8;

  // Append header group
  const headerGroup = elements.graphArea.append('g');

  // header month
  let headerMonthColor = null;
  if (component.headerMonthColor) headerMonthColor = component.headerMonthColor;
  else if (component.color) headerMonthColor = component.color;

  const headerMonthText = curMonthDate.format('MMM');
  const headerMonthSize = UiUtils.getDimensions(
    headerMonthText,
    'tracker-month-header-month'
  );
  const headerMonth = headerGroup
    .append('text')
    .text(headerMonthText) // pivot at center
    .attr('id', 'titleMonth')
    .attr(
      'transform',
      'translate(' + cellSize / 4.0 + ',' + headerMonthSize.height + ')'
    )
    .attr('class', 'tracker-month-header-month')
    .style('cursor', 'default')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      clearSelection(elements, component);
    });

  if (headerMonthColor) headerMonth.style('fill', headerMonthColor);

  headerHeight += headerMonthSize.height;

  // header year
  const headerYearText = curMonthDate.format('YYYY');
  const headerYearSize = UiUtils.getDimensions(
    headerYearText,
    'tracker-month-header-year'
  );
  let headerYearColor = null;
  if (component.headerYearColor) {
    headerYearColor = component.headerYearColor;
  } else {
    if (component.color) {
      headerYearColor = component.color;
    }
  }
  const headerYear = headerGroup
    .append('text')
    .text(headerYearText) // pivot at center
    .attr('id', 'titleYear')
    .attr(
      'transform',
      'translate(' +
        cellSize / 4.0 +
        ',' +
        (headerHeight + headerYearSize.height) +
        ')'
    )
    .attr('class', 'tracker-month-header-year')
    .style('cursor', 'default')
    .attr('font-weight', 'bold')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      clearSelection(elements, component);
    });

  if (headerYearColor) headerYear.style('fill', headerYearColor);

  headerHeight += headerYearSize.height;

  // dataset rotator
  const datasetNameSize = UiUtils.getDimensions(
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
        'translate(' + 3.5 * cellSize + ',' + datasetNameSize.height + ')'
      )
      .attr('class', 'tracker-month-title-rotator')
      .style('cursor', 'pointer')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      .on('click', (_event: any) => {
        // show next target
        if (toNextDataset(renderInfo, component)) {
          // clear circles
          clearSelection(elements, component);

          refresh(container, elements, renderInfo, component, curMonthDate);
        }
      });
    elements['rotator'] = datasetRotator;
  }

  // value monitor
  const monitorTextSize = UiUtils.getDimensions(
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
      'translate(' +
        3.5 * cellSize +
        ',' +
        (datasetNameSize.height + monitorTextSize.height) +
        ')'
    )
    .style('cursor', 'pointer')
    .style('fill', component.selectedRingColor);
  elements['monitor'] = monitor;

  // arrow left
  const arrowSize = UiUtils.getDimensions('<', 'tracker-month-title-arrow');
  headerGroup
    .append('text')
    .text('<') // pivot at center
    .attr('id', 'arrowLeft')
    .attr(
      'transform',
      'translate(' +
        5.5 * cellSize +
        ',' +
        (headerHeight / 2 + arrowSize.height / 2) +
        ')'
    )
    .attr('class', 'tracker-month-title-arrow')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      clearSelection(elements, component);
      component.selectedDate = '';
      const prevMonthDate = curMonthDate.clone().add(-1, 'month');
      refresh(container, elements, renderInfo, component, prevMonthDate);
    })
    .style('cursor', 'pointer');

  // arrow right
  headerGroup
    .append('text')
    .text('>') // pivot at center
    .attr('id', 'arrowLeft')
    .attr(
      'transform',
      'translate(' +
        6.5 * cellSize +
        ',' +
        (headerHeight / 2 + arrowSize.height / 2) +
        ')'
    )
    .attr('class', 'tracker-month-title-arrow')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      clearSelection(elements, component);
      const nextMonthDate = curMonthDate.clone().add(1, 'month');
      refresh(container, elements, renderInfo, component, nextMonthDate);
    })
    .style('cursor', 'pointer');

  // arrow today
  headerGroup
    .append('text')
    .text('◦') // pivot at center
    .attr('id', 'arrowToday')
    .attr(
      'transform',
      `translate(${6 * cellSize} , ${headerHeight / 2 + arrowSize.height / 2})`
    )
    .attr('class', 'tracker-month-title-arrow')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      clearSelection(elements, component);
      const todayDate = DateTimeUtils.getToday(renderInfo.dateFormat);
      refresh(container, elements, renderInfo, component, todayDate);
    })
    .style('cursor', 'pointer');

  headerHeight += ySpacing;

  // week day names
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (component.startWeekOn.toLowerCase() === 'mon') {
    weekdayNames.push(weekdayNames.shift());
  }
  const weekdayNameSize = UiUtils.getDimensions(
    weekdayNames[0],
    'tracker-month-weekday'
  );
  elements.graphArea
    .selectAll('weekDays')
    .data(weekdayNames)
    .enter()
    .append('text')
    .text((n: string) => {
      return n;
    })
    .attr('transform', (_n: string, i: number) => {
      const strTranslate =
        'translate(' +
        (i + 0.5) * cellSize +
        ',' +
        (headerHeight + weekdayNameSize.height) +
        ')';
      return strTranslate;
    })
    .attr('class', 'tracker-month-weekday')
    .attr('text-anchor', 'middle')
    .style('cursor', 'default')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      clearSelection(elements, component);
    });
  headerHeight += weekdayNameSize.height + ySpacing;

  // dividing line
  const dividingLineColor = component.dividingLineColor
    ? component.dividingLineColor
    : component.color || null;
  const dividingLineHeight = 1;
  const dividingLine = elements.graphArea
    .append('rect')
    .attr('x', 0)
    .attr('y', headerHeight)
    .attr('width', 6.5 * cellSize + weekdayNameSize.width)
    .attr('height', dividingLineHeight)
    .attr('class', 'tracker-month-dividing-line');

  if (dividingLineColor) dividingLine.style('fill', dividingLineColor);

  headerHeight += dividingLineHeight;

  headerGroup.attr('height', headerHeight);
  elements['header'] = headerGroup;

  // Move sibling areas
  DomUtils.moveArea(elements.dataArea, 0, headerHeight);
};

export function renderDays(
  _container: HTMLElement,
  elements: ComponentElements,
  renderInfo: RenderInfo,
  monthInfo: MonthView,
  curMonthDate: Moment
): string {
  if (!renderInfo || !monthInfo) return;

  const mode = monthInfo.mode;
  if (mode !== 'circle' && mode !== 'annotation')
    throw new TrackerError('Unknown month view mode');

  const curDatasetId = monthInfo.selectedDataset;
  if (curDatasetId === null) return;
  const dataset = renderInfo.datasets.getDatasetById(curDatasetId);
  if (!dataset) return;

  let curDatasetIndex = monthInfo.dataset.findIndex(
    (id) => id === curDatasetId
  );
  if (curDatasetId < 0) curDatasetIndex = 0;
  const threshold = monthInfo.threshold[curDatasetIndex];

  // TODO Why are these here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curMonth = curMonthDate.month(); // 0~11
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curDaysInMonth = curMonthDate.daysInMonth(); // 28~31

  const maxDayTextSize = UiUtils.getDimensions('30', 'tracker-month-label');
  const cellSize =
    Math.max(maxDayTextSize.width, maxDayTextSize.height) * ratioCellToText;
  const dotRadius = ((cellSize / ratioCellToText) * ratioDotToText) / 2.0;
  const streakWidth = (cellSize - dotRadius * 2.0) / 2.0;
  const streakHeight = 3;

  // Get min and max
  const yMin =
    monthInfo.yMin[curDatasetIndex] !== null
      ? monthInfo.yMin[curDatasetIndex]
      : d3.min(dataset.values);

  const yMax =
    monthInfo.yMax[curDatasetIndex] !== null
      ? monthInfo.yMax[curDatasetIndex]
      : d3.max(dataset.values);

  const allowScaledValue =
    yMax === null || yMin === null || yMax <= yMin
      ? false // scaledValue can not be calculated, do not use gradient color
      : true;

  // Start and end
  const monthStartDate = curMonthDate.clone().startOf('month');
  let startDate = monthStartDate.clone().subtract(monthStartDate.day(), 'days');
  if (monthInfo.startWeekOn.toLowerCase() === 'mon') {
    startDate = startDate.add(1, 'days');
  }
  const monthEndDate = curMonthDate.clone().endOf('month');
  let endDate = monthEndDate.clone().add(7 - monthEndDate.day() - 1, 'days');
  if (monthInfo.startWeekOn.toLowerCase() === 'mon') {
    endDate = endDate.add(1, 'days');
  }
  const dataStartDate = dataset.startDate;
  const dataEndDate = dataset.endDate;

  // annotations
  const showAnnotation = monthInfo.showAnnotation;
  const annotations = monthInfo.annotation;
  const curAnnotation = annotations[curDatasetIndex];
  const showAnnotationOfAllTargets = monthInfo.showAnnotationOfAllTargets;

  // Prepare data for graph
  const daysInMonthView: Array<IDayView> = [];
  let indCol = 0;
  let indRow = 0;
  let ind = 0;
  for (
    let curDate = startDate.clone();
    curDate <= endDate;
    curDate.add(1, 'days')
  ) {
    // not sure why we need to do this to stabilize the date
    // sometimes, curValue is wrong without doing this
    curDate = DateTimeUtils.toMoment(
      DateTimeUtils.dateToString(curDate, renderInfo.dateFormat),
      renderInfo.dateFormat
    );

    if (monthInfo.startWeekOn.toLowerCase() === 'mon') {
      indCol = curDate.day() - 1;
      if (indCol < 0) indCol = 6;
      indRow = Math.floor(ind / 7);
    } else {
      indCol = curDate.day(); // 0~6
      indRow = Math.floor(ind / 7);
    }

    // is this day in this month
    const isInThisMonth =
      curDate.diff(monthStartDate) < 0 || curDate.diff(monthEndDate) > 0
        ? false
        : true;

    // is this day out of data range
    const isOutOfDataRange =
      dataStartDate &&
      dataEndDate &&
      curDate.diff(dataStartDate) >= 0 &&
      curDate.diff(dataEndDate) <= 0
        ? false
        : true;

    const curValue = dataset.getValue(curDate);

    // showCircle
    let showCircle = false;
    if (
      !monthInfo.circleColorByValue &&
      curValue !== null &&
      curValue > threshold
    )
      showCircle = true;
    else if (!allowScaledValue)
      if (curValue !== null && curValue > threshold) showCircle = true;
      else showCircle = true;

    // scaledValue
    const scaledValue =
      monthInfo.circleColorByValue && allowScaledValue && curValue !== null
        ? (curValue - yMin) / (yMax - yMin)
        : null;

    // streakIn
    const prevValue = dataset.getValue(curDate, -1);
    const streakIn =
      curValue !== null &&
      curValue > threshold &&
      prevValue !== null &&
      prevValue > threshold
        ? true
        : false;

    // streakOut
    const nextValue = dataset.getValue(curDate, 1);
    const streakOut =
      curValue !== null &&
      curValue > threshold &&
      nextValue !== null &&
      nextValue > threshold
        ? true
        : false;

    let textAnnotation = '';
    if (showAnnotation) {
      if (!showAnnotationOfAllTargets) {
        if (curValue > threshold) {
          textAnnotation = curAnnotation;
        }
      } else {
        for (const datasetId of monthInfo.dataset) {
          const datasetIndex = monthInfo.dataset.findIndex((id) => {
            return id === datasetId;
          });
          if (datasetIndex >= 0) {
            const v = renderInfo.datasets
              .getDatasetById(datasetId)
              .getValue(curDate);
            const t = monthInfo.threshold[datasetIndex];
            if (v !== null && v > t) {
              textAnnotation += annotations[datasetIndex];
            }
          }
        }
      }
    }

    daysInMonthView.push({
      date: DateTimeUtils.dateToString(curDate, renderInfo.dateFormat),
      value: curValue,
      scaledValue: scaledValue,
      dayInMonth: curDate.date(),
      isInThisMonth: isInThisMonth,
      isOutOfDataRange: isOutOfDataRange,
      row: indRow,
      col: indCol,
      showCircle: showCircle,
      streakIn: streakIn,
      streakOut: streakOut,
      annotation: textAnnotation,
    });

    ind++;
  }

  // scale
  const totalDayBlockWidth = (indCol + 1) * cellSize;

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalBlockHeight = (indRow + 1) * cellSize;

  const scale = d3
    .scaleLinear()
    .domain([-0.5, 6.5])
    .range([0, totalDayBlockWidth]);

  // streak lines
  if (mode === 'circle' && monthInfo.showCircle && monthInfo.showStreak) {
    let streakColor = '#69b3a2';
    if (monthInfo.circleColor) {
      streakColor = monthInfo.circleColor;
    } else if (monthInfo.color) {
      streakColor = monthInfo.color;
    }

    elements.dataArea
      .selectAll('streakIn')
      .data(
        daysInMonthView.filter((d: IDayView) => {
          return d.streakIn;
        })
      )
      .enter()
      .append('rect')
      // .attr("id", (d: DayInfo) => {
      //     return "in" + d.date.format("YYYY-MM-DD");
      // })
      .attr('x', (d: IDayView) => {
        const x = scale(d.col) - dotRadius - streakWidth;
        return x;
      })
      .attr('y', (d: IDayView) => {
        return scale(d.row) - streakHeight / 2.0;
      })
      .attr('width', streakWidth)
      .attr('height', streakHeight)
      .style('fill', (d: IDayView) => {
        if (d.showCircle) {
          if (!monthInfo.circleColorByValue) return streakColor;
          if (d.scaledValue !== null) {
            return d3.interpolateLab(
              'white',
              streakColor
            )(d.scaledValue * 0.8 + 0.2);
          } else return 'none';
        }
        return 'none';
      })
      .style('opacity', (d: IDayView) =>
        d.isOutOfDataRange || (monthInfo.dimNotInMonth && !d.isInThisMonth)
          ? 0.2
          : 1.0
      );

    elements.dataArea
      .selectAll('streakOut')
      .data(daysInMonthView.filter((d: IDayView) => d.streakOut))
      .enter()
      .append('rect')
      // .attr("id", (d: DayInfo) => {
      //     return "out" + d.date.format("YYYY-MM-DD");
      // })
      .attr('x', (d: IDayView) => scale(d.col) + dotRadius)
      .attr('y', (d: IDayView) => scale(d.row) - streakHeight / 2.0)
      .attr('width', streakWidth)
      .attr('height', streakHeight)
      .style('fill', (d: IDayView) => {
        if (!d.showCircle) return 'none';
        if (!monthInfo.circleColorByValue) return streakColor;
        if (d.scaledValue === null) return 'none';
        return d3.interpolateLab(
          'white',
          streakColor
        )(d.scaledValue * 0.8 + 0.2);
      })
      .style('opacity', (d: IDayView) =>
        d.isOutOfDataRange || (monthInfo.dimNotInMonth && !d.isInThisMonth)
          ? 0.2
          : 1.0
      );
  }

  // circles
  let circleColor = '#69b3a2';
  if (monthInfo.circleColor) circleColor = monthInfo.circleColor;
  else if (monthInfo.color) circleColor = monthInfo.color;

  if (mode === 'circle' && monthInfo.showCircle) {
    elements.dataArea
      .selectAll('dot')
      .data(daysInMonthView)
      .enter()
      .append('circle')
      .attr('r', dotRadius)
      .attr('cx', (d: IDayView) => scale(d.col))
      .attr('cy', (d: IDayView) => scale(d.row))
      .style('fill', (d: IDayView) => {
        if (!d.showCircle) return 'none';
        if (!monthInfo.circleColorByValue) return circleColor;
        if (d.scaledValue === null) return 'none';
        return d3.interpolateLab(
          'white',
          circleColor
        )(d.scaledValue * 0.8 + 0.2);
      })
      .style('opacity', (d: IDayView) =>
        d.isOutOfDataRange || (monthInfo.dimNotInMonth && !d.isInThisMonth)
          ? 0.2
          : 1.0
      )
      .style('cursor', 'default');
  }

  // today rings
  const today = DateTimeUtils.dateToString(
    window.moment(),
    renderInfo.dateFormat
  );
  if (mode === 'circle' && monthInfo.showTodayRing) {
    const todayRings = elements.dataArea
      .selectAll('todayRing')
      .data(
        daysInMonthView.filter((d: IDayView) => {
          return d.date === today;
        })
      )
      .enter()
      .append('circle')
      .attr('r', dotRadius * 0.9)
      .attr('cx', (d: IDayView) => scale(d.col))
      .attr('cy', (d: IDayView) => scale(d.row))
      .attr('class', 'tracker-month-today-circle') // stroke not works??
      .style('cursor', 'default');

    if (monthInfo.todayRingColor !== '')
      todayRings.style('stroke', monthInfo.todayRingColor);
    else todayRings.style('stroke', 'white');
  }

  // selected rings
  if (mode === 'circle' && monthInfo.showSelectedRing) {
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
    .attr('transform', (d: IDayView) => {
      const transX = scale(d.col);
      const transY = scale(d.row) + maxDayTextSize.height / 4;
      return `translate(${transX}, ${transY})`;
    })
    .style('fill-opacity', (d: IDayView) =>
      d.isOutOfDataRange || (monthInfo.dimNotInMonth && !d.isInThisMonth)
        ? 0.2
        : 1.0
    )
    .attr('date', (d: IDayView) => d.date)
    .attr('value', (d: IDayView) => d.value)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .attr('valueType', (_d: IDayView) => ValueType[dataset.valueType])
    .attr('class', 'tracker-month-label')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      // clear circles
      clearSelection(elements, monthInfo);
      // show new selected circle
      const date = d3.select(this).attr('date');
      monthInfo.selectedDate = date;
      if (monthInfo.showSelectedRing) {
        elements.dataArea
          .select('#tracker-selected-circle-' + date)
          .style('stroke', monthInfo.selectedRingColor);
      }
      // show value on monitor
      if (monthInfo.showSelectedValue) {
        const strValue = d3.select(this).attr('value');
        const valueType = d3.select(this).attr('valueType');
        let valueText = '';
        if (valueType === 'Time') {
          const dayStart = window.moment('00:00', 'HH:mm', true);
          const tickTime = dayStart.add(parseFloat(strValue), 'seconds');
          valueText = tickTime.format('HH:mm');
        } else valueText = strValue;

        elements.monitor.text(valueText);
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
      .text((d: IDayView) => {
        return d.annotation;
      })
      .attr('transform', (d: IDayView) => {
        let transY = scale(d.row) + maxDayTextSize.height / 4;
        if (d.annotation) transY += dotRadius;
        return `translate(${scale(d.col)}, ${transY})`;
      })
      .attr('class', 'tracker-month-annotation');
  }

  // Expand areas
  const svgWidth = parseFloat(elements.svg.attr('width'));
  const svgHeight = parseFloat(elements.svg.attr('height'));
  const graphAreaWidth = parseFloat(elements.graphArea.attr('width'));
  const graphAreaHeight = parseFloat(elements.graphArea.attr('height'));
  const totalHeight = 7 * cellSize + parseFloat(elements.header.attr('height'));
  const totalWidth = 7 * cellSize;
  if (totalHeight > svgHeight) {
    DomUtils.expandArea(elements.svg, 0, totalHeight - svgHeight);
  }
  if (totalWidth > svgWidth) {
    DomUtils.expandArea(elements.svg, totalWidth - svgWidth, 0);
  }
  if (totalHeight > graphAreaHeight) {
    DomUtils.expandArea(elements.graphArea, 0, totalHeight - graphAreaHeight);
  }
  if (totalWidth > graphAreaWidth) {
    DomUtils.expandArea(elements.svg, totalWidth - graphAreaWidth, 0);
  }
}

export const renderMonthView = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: MonthView
): void => {
  if (!renderInfo || !component) return;

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const datasetIds = component.dataset;

  let xDatasetCount = 0;
  for (const dataset of renderInfo.datasets) {
    if (!dataset.query.usedAsXDataset) xDatasetCount++;
  }
  if (xDatasetCount === 0) throw new TrackerError('No available dataset found');

  toNextDataset(renderInfo, component);
  if (component.selectedDataset === null)
    throw new TrackerError('No available dataset found');

  const elements = createElements(container, renderInfo, {
    clearContents: true,
  });

  let monthDate: Moment = null;
  if (component.initMonth) {
    monthDate = DateTimeUtils.getDateByDurationToToday(
      component.initMonth,
      renderInfo.dateFormat
    );
    if (!monthDate) {
      const initMonth = window.moment(component.initMonth, 'YYYY-MM', true);
      if (initMonth.isValid()) monthDate = initMonth;
      else throw new TrackerError('Invalid initMonth');
    }
  } else monthDate = renderInfo.datasets.dates.last();

  if (!monthDate) return;

  renderHeader(container, elements, renderInfo, component, monthDate);
  renderDays(container, elements, renderInfo, component, monthDate);
  setScale(container, elements, renderInfo);
};
