import * as d3 from 'd3';
import { ValueType } from '../../models/enums';
import { MonthInfo } from '../../models/month';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import { ChartUtils, DateTimeUtils, DomUtils } from '../../utils';
import { TMoment, getMoment } from '../../utils/date-time.utils';
import { DayInfo } from './types';
import Moment = moment.Moment;

let logToConsole = false;
const RATIO_CELL_TO_TEXT = 2.8;
const RATIO_DOT_TO_TEXT = 1.8;

export const setChartScale = (
  _canvas: HTMLElement,
  elements: ChartElements,
  renderInfo: RenderInfo
): void => {
  const canvas = d3.select(_canvas);
  const svg = elements.svg;
  const svgWidth = parseFloat(svg.attr('width'));
  const svgHeight = parseFloat(svg.attr('height'));
  svg
    .attr('width', null)
    .attr('height', null)
    .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  if (renderInfo.fitPanelWidth) {
    canvas.style('width', '100%');
  } else {
    canvas.style('width', (svgWidth * renderInfo.fixedScale).toString() + 'px');
    canvas.style(
      'height',
      (svgHeight * renderInfo.fixedScale).toString() + 'px'
    );
  }
};

export const toNextDataset = (
  renderInfo: RenderInfo,
  component: MonthInfo
): boolean => {
  const datasetIds = component.dataset;
  if (datasetIds.length === 0) return false; // false if selected dataset not changed

  let dataset = null;
  if (component.selectedDataset === null) {
    for (const datasetId of datasetIds) {
      dataset = renderInfo.datasets.getDataset(datasetId);
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
          dataset = renderInfo.datasets.getDataset(datasetId);
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

        dataset = renderInfo.datasets.getDataset(datasetId);
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

export const createAreas = (
  elements: ChartElements,
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _component: MonthInfo
): ChartElements => {
  // clean areas
  d3.select(canvas).select('#svg').remove();
  const props = Object.getOwnPropertyNames(elements);
  for (let i = 0; i < props.length; i++) {
    // d3.select(elements[props[i]]).remove();
    delete elements[props[i]];
  }
  // console.log(elements);
  // whole area for plotting, includes margins
  const svg = d3
    .select(canvas)
    .append('svg')
    .attr('id', 'svg')
    .attr(
      'width',
      renderInfo.dataAreaSize.width +
        renderInfo.margin.left +
        renderInfo.margin.right
    )
    .attr(
      'height',
      renderInfo.dataAreaSize.height +
        renderInfo.margin.top +
        renderInfo.margin.bottom
    );
  elements['svg'] = svg;

  // graphArea, includes chartArea, title, legend
  const graphArea = svg
    .append('g')
    .attr('id', 'graphArea')
    .attr(
      'transform',
      `translate(${renderInfo.margin.left}, ${renderInfo.margin.top})`
    )
    .attr('width', renderInfo.dataAreaSize.width + renderInfo.margin.right)
    .attr('height', renderInfo.dataAreaSize.height + renderInfo.margin.bottom);
  elements['graphArea'] = graphArea;

  // dataArea, under graphArea, includes points, lines, xAxis, yAxis
  const dataArea = graphArea
    .append('g')
    .attr('id', 'dataArea')
    .attr('width', renderInfo.dataAreaSize.width)
    .attr('height', renderInfo.dataAreaSize.height);
  elements['dataArea'] = dataArea;

  return elements;
};

export const clearSelection = (
  elements: ChartElements,
  component: MonthInfo
) => {
  const circles = elements.svg.selectAll('circle');
  // console.log(circles);
  for (const circle of circles) {
    // console.log(circle);
    const id = d3.select(circle).attr('id');
    if (id && id.startsWith('tracker-selected-circle-')) {
      d3.select(circle).style('stroke', 'none');
    }
  }

  component.selectedDate = '';

  elements.monitor.text('');
};

export const renderMonthHeader = (
  canvas: HTMLElement,
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: MonthInfo,
  curMonthDate: Moment
): void => {
  // console.log("renderMonthHeader")
  if (!renderInfo || !component) return;

  const curDatasetId = component.selectedDataset;
  if (curDatasetId === null) return;
  const dataset = renderInfo.datasets.getDataset(curDatasetId);
  if (!dataset) return;
  const datasetName = dataset.name;

  // TODO What are these for?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curMonth = curMonthDate.month(); // 0~11

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curDaysInMonth = curMonthDate.daysInMonth(); // 28~31

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curYear = curMonthDate.year();

  const maxDayTextSize = ChartUtils.measureTextSize(
    '30',
    'tracker-month-label'
  );
  const cellSize =
    Math.max(maxDayTextSize.width, maxDayTextSize.height) * RATIO_CELL_TO_TEXT;

  // What is this for?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dotRadius = ((cellSize / RATIO_CELL_TO_TEXT) * RATIO_DOT_TO_TEXT) / 2;

  const headerYearText = curMonthDate.format('YYYY');
  const headerMonthText = curMonthDate.format('MMM');
  const headerYearSize = ChartUtils.measureTextSize(
    headerYearText,
    'tracker-month-header-year'
  );
  const headerMonthSize = ChartUtils.measureTextSize(
    headerMonthText,
    'tracker-month-header-month'
  );

  let headerHeight = 0;
  const ySpacing = 8;

  // Append header group
  const headerGroup = elements.graphArea.append('g');

  // header month
  let headerMonthColor = null;
  if (component.headerMonthColor) {
    headerMonthColor = component.headerMonthColor;
  } else {
    if (component.color) {
      headerMonthColor = component.color;
    }
  }
  const headerMonth = headerGroup
    .append('text')
    .text(headerMonthText) // pivot at center
    .attr('id', 'titleMonth')
    .attr('transform', `translate(${cellSize / 4}, ${headerMonthSize.height})`)
    .attr('class', 'tracker-month-header-month')
    .style('cursor', 'default')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      clearSelection(elements, component);
    });

  if (headerMonthColor) {
    headerMonth.style('fill', headerMonthColor);
  }
  headerHeight += headerMonthSize.height;

  // header year
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
      `translate(${cellSize / 4}, ${headerHeight + headerYearSize.height})`
    )
    .attr('class', 'tracker-month-header-year')
    .style('cursor', 'default')
    .attr('font-weight', 'bold')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      clearSelection(elements, component);
    });

  if (headerYearColor) {
    headerYear.style('fill', headerYearColor);
  }

  headerHeight += headerYearSize.height;

  // dataset rotator
  const datasetNameSize = ChartUtils.measureTextSize(
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
        `translate(${3.5 * cellSize}, ${datasetNameSize.height})`
      )
      .attr('class', 'tracker-month-title-rotator')
      .style('cursor', 'pointer')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      .on('click', (_event: any) => {
        // show next target
        if (toNextDataset(renderInfo, component)) {
          // clear circles
          clearSelection(elements, component);

          refresh(canvas, elements, renderInfo, component, curMonthDate);
        }
      });
    elements['rotator'] = datasetRotator;
  }

  // value monitor
  const monitorTextSize = ChartUtils.measureTextSize(
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
      `translate(${3.5 * cellSize}, ${
        datasetNameSize.height + monitorTextSize.height
      })`
    )
    .style('cursor', 'pointer')
    .style('fill', component.selectedRingColor);
  elements['monitor'] = monitor;

  // arrow left
  const arrowSize = ChartUtils.measureTextSize(
    '<',
    'tracker-month-title-arrow'
  );
  headerGroup
    .append('text')
    .text('<') // pivot at center
    .attr('id', 'arrowLeft')
    .attr(
      'transform',
      `translate(${5.5 * cellSize}, ${headerHeight / 2 + arrowSize.height / 2})`
    )
    .attr('class', 'tracker-month-title-arrow')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      clearSelection(elements, component);
      component.selectedDate = '';
      const prevMonthDate = curMonthDate.clone().add(-1, 'month');
      refresh(canvas, elements, renderInfo, component, prevMonthDate);
    })
    .style('cursor', 'pointer');

  // arrow right
  headerGroup
    .append('text')
    .text('>') // pivot at center
    .attr('id', 'arrowLeft')
    .attr(
      'transform',
      `translate(${6.5 * cellSize}, ${headerHeight / 2 + arrowSize.height / 2})`
    )
    .attr('class', 'tracker-month-title-arrow')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      clearSelection(elements, component);
      const nextMonthDate = curMonthDate.clone().add(1, 'month');
      refresh(canvas, elements, renderInfo, component, nextMonthDate);
    })
    .style('cursor', 'pointer');

  // arrow today
  headerGroup
    .append('text')
    .text('◦') // pivot at center
    .attr('id', 'arrowToday')
    .attr(
      'transform',
      `translate(${6 * cellSize}, ${headerHeight / 2 + arrowSize.height / 2})`
    )
    .attr('class', 'tracker-month-title-arrow')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      // console.log("today arrow clicked");
      clearSelection(elements, component);

      const todayDate = DateTimeUtils.getDateToday(renderInfo.dateFormat);
      refresh(canvas, elements, renderInfo, component, todayDate);
    })
    .style('cursor', 'pointer');

  headerHeight += ySpacing;

  // week day names
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (component.startWeekOn.toLowerCase() === 'mon') {
    weekdayNames.push(weekdayNames.shift());
  }
  const weekdayNameSize = ChartUtils.measureTextSize(
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
      const strTranslate = `translate(${(i + 0.5) * cellSize}, ${
        headerHeight + weekdayNameSize.height
      })`;
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
  const dividingLineHeight = 1;
  let dividingLineColor = null;
  if (component.dividingLineColor) {
    dividingLineColor = component.dividingLineColor;
  } else {
    if (component.color) {
      dividingLineColor = component.color;
    }
  }
  const dividingLine = elements.graphArea
    .append('rect')
    .attr('x', 0)
    .attr('y', headerHeight)
    .attr('width', 6.5 * cellSize + weekdayNameSize.width)
    .attr('height', dividingLineHeight)
    .attr('class', 'tracker-month-dividing-line');

  if (dividingLineColor) {
    dividingLine.style('fill', dividingLineColor);
  }
  headerHeight += dividingLineHeight;

  headerGroup.attr('height', headerHeight);
  elements['header'] = headerGroup;

  // Move sibling areas
  DomUtils.moveArea(elements.dataArea, 0, headerHeight);
};

export function renderMonthDays(
  _canvas: HTMLElement,
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: MonthInfo,
  curMonthDate: Moment,
  moment?: TMoment
): string {
  // console.log("renderMonthDays");
  // console.log(renderInfo);
  // console.log(component);
  if (!renderInfo || !component) return;

  const mode = component.mode;
  if (mode !== 'circle' && mode !== 'annotation') {
    return 'Unknown month view mode';
  }

  const curDatasetId = component.selectedDataset;
  if (curDatasetId === null) return;
  const dataset = renderInfo.datasets.getDataset(curDatasetId);
  if (!dataset) return;
  // console.log(dataset);
  let curDatasetIndex = component.dataset.findIndex((id) => {
    return id === curDatasetId;
  });
  if (curDatasetId < 0) curDatasetIndex = 0;
  const threshold = component.threshold[curDatasetIndex];

  // TODO Why are these here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curMonth = curMonthDate.month(); // 0~11

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curDaysInMonth = curMonthDate.daysInMonth(); // 28~31

  const maxDayTextSize = ChartUtils.measureTextSize(
    '30',
    'tracker-month-label'
  );
  const cellSize =
    Math.max(maxDayTextSize.width, maxDayTextSize.height) * RATIO_CELL_TO_TEXT;
  const dotRadius = ((cellSize / RATIO_CELL_TO_TEXT) * RATIO_DOT_TO_TEXT) / 2;
  const streakWidth = (cellSize - dotRadius * 2) / 2;
  const streakHeight = 3;

  // Get min and max
  let yMin = d3.min(dataset.values);
  if (component.yMin[curDatasetIndex] !== null) {
    yMin = component.yMin[curDatasetIndex];
  }
  let yMax = d3.max(dataset.values);
  if (component.yMax[curDatasetIndex] !== null) {
    yMax = component.yMax[curDatasetIndex];
  }
  // console.log(`yMin:${yMin}, yMax:${yMax}`);
  let allowScaledValue = true;
  if (yMax === null || yMin === null || yMax <= yMin) {
    // scaledValue can not be calculated, do not use gradient color
    allowScaledValue = false;
    // console.log("scaledValue not allowed");
  }

  // Start and end
  const monthStartDate = curMonthDate.clone().startOf('month');
  let startDate = monthStartDate.clone().subtract(monthStartDate.day(), 'days');
  if (component.startWeekOn.toLowerCase() === 'mon') {
    startDate = startDate.add(1, 'days');
  }
  const monthEndDate = curMonthDate.clone().endOf('month');
  let endDate = monthEndDate.clone().add(7 - monthEndDate.day() - 1, 'days');
  if (component.startWeekOn.toLowerCase() === 'mon') {
    endDate = endDate.add(1, 'days');
  }
  const dataStartDate = dataset.startDate;
  const dataEndDate = dataset.endDate;
  // console.log(monthStartDate.format("YYYY-MM-DD"));
  // console.log(startDate.format("YYYY-MM-DD"));
  // annotations
  const showAnnotation = component.showAnnotation;
  const annotations = component.annotation;
  const curAnnotation = annotations[curDatasetIndex];
  const showAnnotationOfAllTargets = component.showAnnotationOfAllTargets;

  // Prepare data for graph
  const daysInMonthView: Array<DayInfo> = [];
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
    curDate = DateTimeUtils.stringToDate(
      DateTimeUtils.dateToString(curDate, renderInfo.dateFormat),
      renderInfo.dateFormat
    );
    if (curDate.format('YYYY-MM-DD') === '2021-09-13') {
      logToConsole = false; // Change this to do debugging
    }

    if (component.startWeekOn.toLowerCase() === 'mon') {
      indCol = curDate.day() - 1;
      if (indCol < 0) {
        indCol = 6;
      }
      indRow = Math.floor(ind / 7);
    } else {
      indCol = curDate.day(); // 0~6
      indRow = Math.floor(ind / 7);
    }

    // is this day in this month
    let isInThisMonth = true;
    if (curDate.diff(monthStartDate) < 0 || curDate.diff(monthEndDate) > 0) {
      isInThisMonth = false;
    }
    // is this day out of data range
    let isOutOfDataRange = true;
    if (
      dataStartDate &&
      dataEndDate &&
      curDate.diff(dataStartDate) >= 0 &&
      curDate.diff(dataEndDate) <= 0
    ) {
      isOutOfDataRange = false;
    }

    const curValue = dataset.getValue(curDate);
    if (logToConsole) {
      console.log(dataset);
      console.log(DateTimeUtils.dateToString(curDate, renderInfo.dateFormat));
      console.log(curValue);
    }

    // showCircle
    let showCircle = false;
    if (!component.circleColorByValue) {
      // shown or not shown
      if (curValue !== null) {
        if (curValue > threshold) {
          showCircle = true;
        }
      }
    } else {
      if (!allowScaledValue) {
        if (curValue !== null) {
          if (curValue > threshold) {
            showCircle = true;
          }
        }
      } else {
        showCircle = true;
      }
    }

    // scaledValue
    let scaledValue = null;
    if (component.circleColorByValue) {
      if (allowScaledValue && curValue !== null) {
        scaledValue = (curValue - yMin) / (yMax - yMin);
      }
    }
    if (logToConsole) {
      console.log(yMin);
      console.log(yMax);
      console.log(scaledValue);
    }

    // streakIn and streakOut
    const nextValue = dataset.getValue(curDate, 1);
    const prevValue = dataset.getValue(curDate, -1);
    let streakIn = false;
    if (curValue !== null && curValue > threshold) {
      if (prevValue !== null && prevValue > threshold) {
        streakIn = true;
      }
    }
    let streakOut = false;
    if (curValue !== null && curValue > threshold) {
      if (nextValue !== null && nextValue > threshold) {
        streakOut = true;
      }
    }
    if (logToConsole) {
      console.log(
        `preValue: ${prevValue}, curValue: ${curValue}, nextValue: ${nextValue}`
      );
      console.log(component.threshold);
      console.log(`streakIn: ${streakIn}, streakOut: ${streakOut}`);
    }

    let textAnnotation = '';
    if (showAnnotation) {
      if (!showAnnotationOfAllTargets) {
        if (curValue > threshold) {
          textAnnotation = curAnnotation;
        }
      } else {
        for (const datasetId of component.dataset) {
          const datasetIndex = component.dataset.findIndex((id) => {
            return id === datasetId;
          });
          if (datasetIndex >= 0) {
            const v = renderInfo.datasets
              .getDataset(datasetId)
              .getValue(curDate);
            const t = component.threshold[datasetIndex];
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

    // Disable logging starts at the beginning of each loop
    if (logToConsole) {
      logToConsole = false;
    }
  }
  // console.log(daysInMonthView);
  // console.log(daysInMonthView.filter((d: DayInfo) => {
  //     return d.streakIn;
  // }));
  // console.log(daysInMonthView.filter((d: DayInfo) => {
  //     return d.streakOut;
  // }));
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
  if (mode === 'circle' && component.showCircle && component.showStreak) {
    let streakColor = '#69b3a2';
    if (component.circleColor) {
      streakColor = component.circleColor;
    } else if (component.color) {
      streakColor = component.color;
    }
    // console.log(streakColor);
    elements.dataArea
      .selectAll('streakIn')
      .data(daysInMonthView.filter((d: DayInfo) => d.streakIn))
      .enter()
      .append('rect')
      // .attr("id", (d: DayInfo) => {
      //     return "in" + d.date.format("YYYY-MM-DD");
      // })
      .attr('x', (d: DayInfo) => scale(d.col) - dotRadius - streakWidth)
      .attr('y', (d: DayInfo) => scale(d.row) - streakHeight / 2)
      .attr('width', streakWidth)
      .attr('height', streakHeight)
      .style('fill', (d: DayInfo) => {
        if (d.showCircle) {
          if (!component.circleColorByValue) {
            return streakColor;
          }
          if (d.scaledValue !== null) {
            return d3.interpolateLab(
              'white',
              streakColor
            )(d.scaledValue * 0.8 + 0.2);
          } else {
            return 'none';
          }
        }
        return 'none';
      })
      .style('opacity', (d: DayInfo) => {
        return d.isOutOfDataRange ||
          (component.dimNotInMonth && !d.isInThisMonth)
          ? 0.2
          : 1;
      });

    elements.dataArea
      .selectAll('streakOut')
      .data(daysInMonthView.filter((d: DayInfo) => d.streakOut))
      .enter()
      .append('rect')
      // .attr("id", (d: DayInfo) => {
      //     return "out" + d.date.format("YYYY-MM-DD");
      // })
      .attr('x', (d: DayInfo) => scale(d.col) + dotRadius)
      .attr('y', (d: DayInfo) => scale(d.row) - streakHeight / 2)
      .attr('width', streakWidth)
      .attr('height', streakHeight)
      .style('fill', (d: DayInfo) => {
        if (d.showCircle) {
          if (!component.circleColorByValue) return streakColor;
          return d.scaledValue !== null
            ? d3.interpolateLab('white', streakColor)(d.scaledValue * 0.8 + 0.2)
            : 'none';
        }
        return 'none';
      })
      .style('opacity', (d: DayInfo) => {
        return d.isOutOfDataRange ||
          (component.dimNotInMonth && !d.isInThisMonth)
          ? 0.2
          : 1;
      });
  }

  // circles
  let circleColor = '#69b3a2';
  if (component.circleColor) {
    circleColor = component.circleColor;
  } else if (component.color) {
    circleColor = component.color;
  }
  if (mode === 'circle' && component.showCircle) {
    elements.dataArea
      .selectAll('dot')
      .data(daysInMonthView)
      .enter()
      .append('circle')
      .attr('r', dotRadius)
      .attr('cx', (d: DayInfo) => {
        return scale(d.col);
      })
      .attr('cy', (d: DayInfo) => {
        return scale(d.row);
      })
      .style('fill', (d: DayInfo) => {
        if (d.showCircle) {
          if (!component.circleColorByValue) {
            return circleColor;
          }
          if (d.scaledValue !== null) {
            const scaledColor = d3.interpolateLab(
              'white',
              circleColor
            )(d.scaledValue * 0.8 + 0.2);
            // console.log(d.scaledValue);
            // console.log(scaledColor);
            return scaledColor;
          } else {
            return 'none';
          }
        }
        return 'none';
      })
      .style('opacity', (d: DayInfo) => {
        if (
          d.isOutOfDataRange ||
          (component.dimNotInMonth && !d.isInThisMonth)
        ) {
          return 0.2;
        }
        return 1;
      })
      .style('cursor', 'default');
  }

  // today rings
  const today = DateTimeUtils.dateToString(
    getMoment(moment)(),
    renderInfo.dateFormat
  );
  if (mode === 'circle' && component.showTodayRing) {
    const todayRings = elements.dataArea
      .selectAll('todayRing')
      .data(daysInMonthView.filter((d: DayInfo) => d.date === today))
      .enter()
      .append('circle')
      .attr('r', dotRadius * 0.9)
      .attr('cx', (d: DayInfo) => scale(d.col))
      .attr('cy', (d: DayInfo) => scale(d.row))
      .attr('class', 'tracker-month-today-circle') // stroke not works??
      .style('cursor', 'default');

    component.todayRingColor !== ''
      ? todayRings.style('stroke', component.todayRingColor)
      : todayRings.style('stroke', 'white');
  }

  // selected rings
  if (mode === 'circle' && component.showSelectedRing) {
    elements.dataArea
      .selectAll('selectedRing')
      .data(daysInMonthView)
      .enter()
      .append('circle')
      .attr('r', dotRadius)
      .attr('cx', (d: DayInfo) => scale(d.col))
      .attr('cy', (d: DayInfo) => scale(d.row))
      .attr('id', (d: DayInfo) => 'tracker-selected-circle-' + d.date)
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
    .text((d: DayInfo) => d.dayInMonth.toString())
    .attr('transform', (d: DayInfo) => {
      const transX = scale(d.col);
      const transY = scale(d.row) + maxDayTextSize.height / 4;
      return `translate(${transX}, ${transY})`;
    })
    .style('fill-opacity', (d: DayInfo) => {
      return d.isOutOfDataRange || (component.dimNotInMonth && !d.isInThisMonth)
        ? 0.2
        : 1;
    })
    .attr('date', (d: DayInfo) => {
      return d.date;
    })
    .attr('value', (d: DayInfo) => {
      return d.value;
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .attr('valueType', (_d: DayInfo) => {
      return ValueType[dataset.valueType];
    })
    .attr('class', 'tracker-month-label')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      // clear circles
      clearSelection(elements, component);
      // show new selected circle
      const date = d3.select(this).attr('date');
      component.selectedDate = date;
      if (component.showSelectedRing) {
        elements.dataArea
          .select('#tracker-selected-circle-' + date)
          .style('stroke', component.selectedRingColor);
      }
      // show value on monitor
      if (component.showSelectedValue) {
        const strValue = d3.select(this).attr('value');
        const valueType = d3.select(this).attr('valueType');
        let valueText = '';
        if (valueType === 'Time') {
          const dayStart = getMoment(moment)('00:00', 'HH:mm', true);
          const tickTime = dayStart.add(parseFloat(strValue), 'seconds');
          valueText = tickTime.format('HH:mm');
        } else {
          valueText = strValue;
        }
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
      .text((d: DayInfo) => d.annotation)
      .attr('transform', (d: DayInfo) => {
        const transX = scale(d.col);
        let transY = scale(d.row) + maxDayTextSize.height / 4;
        if (d.annotation) transY += dotRadius;
        return `translate(${transX}, ${transY})`;
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

export const refresh = (
  canvas: HTMLElement,
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: MonthInfo,
  curMonthDate: Moment
): void => {
  // console.log("refresh");
  // console.log(renderInfo);
  if (!renderInfo) return;

  elements = createAreas(elements, canvas, renderInfo, component);

  // render
  renderMonthHeader(canvas, elements, renderInfo, component, curMonthDate);
  renderMonthDays(canvas, elements, renderInfo, component, curMonthDate);
};
