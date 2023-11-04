import * as d3 from 'd3';
import { ValueType } from '../../models/enums';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import * as helper from '../../utils/helper';
import { Month } from './month.model';
import Moment = moment.Moment;

let logToConsole = false;
const ratioCellToText = 2.8;
const ratioDotToText = 1.8;

interface DayInfo {
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

const setChartScale = (
  _canvas: HTMLElement,
  chartElements: ComponentElements,
  renderInfo: RenderInfo
): void => {
  const canvas = d3.select(_canvas);
  const svg = chartElements.svg;
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

const toNextDataset = (renderInfo: RenderInfo, monthInfo: Month): boolean => {
  const datasetIds = monthInfo.dataset;
  if (datasetIds.length === 0) return false; // false if selected dataset not changed

  let dataset = null;
  if (monthInfo.selectedDataset === null) {
    for (const datasetId of datasetIds) {
      dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset && !dataset.query.usedAsXDataset) break;
    }
    if (dataset) {
      monthInfo.selectedDataset = dataset.id;
      return true; // true if selected dataset changed
    }
  } else {
    const curDatasetId = monthInfo.selectedDataset;
    let curIndex = datasetIds.findIndex((id) => {
      return id === curDatasetId;
    });
    if (curIndex >= 0) {
      if (curIndex === monthInfo.dataset.length - 1) {
        // search from start
        for (const datasetId of datasetIds) {
          dataset = renderInfo.datasets.getDatasetById(datasetId);
          if (dataset && !dataset.query.usedAsXDataset) break;
        }
        if (dataset) {
          monthInfo.selectedDataset = dataset.id;
          return true; // true if selected dataset changed
        } else {
          return false;
        }
      } else {
        curIndex++;
        const datasetId = datasetIds[curIndex];
        dataset = renderInfo.datasets.getDatasetById(datasetId);
        monthInfo.selectedDataset = datasetId;
        if (dataset && !dataset.query.usedAsXDataset) {
          return true;
        } else {
          toNextDataset(renderInfo, monthInfo);
        }
      }
    }
  }

  return false;
};

const createAreas = (
  chartElements: ComponentElements,
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _monthInfo: Month
): ComponentElements => {
  // clean areas
  d3.select(canvas).select('#svg').remove();
  const props = Object.getOwnPropertyNames(chartElements);
  for (let i = 0; i < props.length; i++) {
    // d3.select(chartElements[props[i]]).remove();
    delete chartElements[props[i]];
  }
  // console.log(chartElements);

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
  chartElements['svg'] = svg;

  // graphArea, includes chartArea, title, legend
  const graphArea = svg
    .append('g')
    .attr('id', 'graphArea')
    .attr(
      'transform',
      'translate(' + renderInfo.margin.left + ',' + renderInfo.margin.top + ')'
    )
    .attr('width', renderInfo.dataAreaSize.width + renderInfo.margin.right)
    .attr('height', renderInfo.dataAreaSize.height + renderInfo.margin.bottom);
  chartElements['graphArea'] = graphArea;

  // dataArea, under graphArea, includes points, lines, xAxis, yAxis
  const dataArea = graphArea
    .append('g')
    .attr('id', 'dataArea')
    .attr('width', renderInfo.dataAreaSize.width)
    .attr('height', renderInfo.dataAreaSize.height);
  chartElements['dataArea'] = dataArea;

  return chartElements;
};

const clearSelection = (chartElements: ComponentElements, monthInfo: Month) => {
  const circles = chartElements.svg.selectAll('circle');
  // console.log(circles);
  for (const circle of circles) {
    // console.log(circle);
    const id = d3.select(circle).attr('id');
    if (id && id.startsWith('tracker-selected-circle-')) {
      d3.select(circle).style('stroke', 'none');
    }
  }

  monthInfo.selectedDate = '';

  chartElements.monitor.text('');
};

const renderMonthHeader = (
  canvas: HTMLElement,
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  monthInfo: Month,
  curMonthDate: Moment
): void => {
  // console.log("renderMonthHeader")

  if (!renderInfo || !monthInfo) return;

  const curDatasetId = monthInfo.selectedDataset;
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

  const maxDayTextSize = helper.measureTextSize('30', 'tracker-month-label');
  const cellSize =
    Math.max(maxDayTextSize.width, maxDayTextSize.height) * ratioCellToText;

  // What is this for?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dotRadius = ((cellSize / ratioCellToText) * ratioDotToText) / 2.0;

  const headerYearText = curMonthDate.format('YYYY');
  const headerMonthText = curMonthDate.format('MMM');
  const headerYearSize = helper.measureTextSize(
    headerYearText,
    'tracker-month-header-year'
  );
  const headerMonthSize = helper.measureTextSize(
    headerMonthText,
    'tracker-month-header-month'
  );

  let headerHeight = 0;
  const ySpacing = 8;

  // Append header group
  const headerGroup = chartElements.graphArea.append('g');

  // header month
  let headerMonthColor = null;
  if (monthInfo.headerMonthColor) {
    headerMonthColor = monthInfo.headerMonthColor;
  } else {
    if (monthInfo.color) {
      headerMonthColor = monthInfo.color;
    }
  }
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
      clearSelection(chartElements, monthInfo);
    });

  if (headerMonthColor) {
    headerMonth.style('fill', headerMonthColor);
  }
  headerHeight += headerMonthSize.height;

  // header year
  let headerYearColor = null;
  if (monthInfo.headerYearColor) {
    headerYearColor = monthInfo.headerYearColor;
  } else {
    if (monthInfo.color) {
      headerYearColor = monthInfo.color;
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
      clearSelection(chartElements, monthInfo);
    });

  if (headerYearColor) {
    headerYear.style('fill', headerYearColor);
  }

  headerHeight += headerYearSize.height;

  // dataset rotator
  const datasetNameSize = helper.measureTextSize(
    datasetName,
    'tracker-month-title-rotator'
  );
  if (
    monthInfo.mode === 'circle' ||
    (monthInfo.mode === 'annotation' && !monthInfo.showAnnotationOfAllTargets)
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
        if (toNextDataset(renderInfo, monthInfo)) {
          // clear circles
          clearSelection(chartElements, monthInfo);

          refresh(canvas, chartElements, renderInfo, monthInfo, curMonthDate);
        }
      });
    chartElements['rotator'] = datasetRotator;
  }

  // value monitor
  const monitorTextSize = helper.measureTextSize(
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
    .style('fill', monthInfo.selectedRingColor);
  chartElements['monitor'] = monitor;

  // arrow left
  const arrowSize = helper.measureTextSize('<', 'tracker-month-title-arrow');
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
      // console.log("left arrow clicked");
      clearSelection(chartElements, monthInfo);
      monthInfo.selectedDate = '';
      const prevMonthDate = curMonthDate.clone().add(-1, 'month');
      refresh(canvas, chartElements, renderInfo, monthInfo, prevMonthDate);
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
      // console.log("right arrow clicked");
      clearSelection(chartElements, monthInfo);

      const nextMonthDate = curMonthDate.clone().add(1, 'month');
      refresh(canvas, chartElements, renderInfo, monthInfo, nextMonthDate);
    })
    .style('cursor', 'pointer');

  // arrow today
  headerGroup
    .append('text')
    .text('◦') // pivot at center
    .attr('id', 'arrowToday')
    .attr(
      'transform',
      'translate(' +
        6 * cellSize +
        ',' +
        (headerHeight / 2 + arrowSize.height / 2) +
        ')'
    )
    .attr('class', 'tracker-month-title-arrow')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    .on('click', (_event: any) => {
      // console.log("today arrow clicked");
      clearSelection(chartElements, monthInfo);

      const todayDate = helper.getDateToday(renderInfo.dateFormat);
      refresh(canvas, chartElements, renderInfo, monthInfo, todayDate);
    })
    .style('cursor', 'pointer');

  headerHeight += ySpacing;

  // week day names
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (monthInfo.startWeekOn.toLowerCase() === 'mon') {
    weekdayNames.push(weekdayNames.shift());
  }
  const weekdayNameSize = helper.measureTextSize(
    weekdayNames[0],
    'tracker-month-weekday'
  );
  chartElements.graphArea
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
      clearSelection(chartElements, monthInfo);
    });
  headerHeight += weekdayNameSize.height + ySpacing;

  // dividing line
  const dividingLineHeight = 1;
  let dividingLineColor = null;
  if (monthInfo.dividingLineColor) {
    dividingLineColor = monthInfo.dividingLineColor;
  } else {
    if (monthInfo.color) {
      dividingLineColor = monthInfo.color;
    }
  }
  const dividingLine = chartElements.graphArea
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
  chartElements['header'] = headerGroup;

  // Move sibling areas
  helper.moveArea(chartElements.dataArea, 0, headerHeight);
};

function renderMonthDays(
  _canvas: HTMLElement,
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  monthInfo: Month,
  curMonthDate: Moment
): string {
  // console.log("renderMonthDays");
  // console.log(renderInfo);
  // console.log(monthInfo);
  if (!renderInfo || !monthInfo) return;

  const mode = monthInfo.mode;
  if (mode !== 'circle' && mode !== 'annotation') {
    return 'Unknown month view mode';
  }

  const curDatasetId = monthInfo.selectedDataset;
  if (curDatasetId === null) return;
  const dataset = renderInfo.datasets.getDatasetById(curDatasetId);
  if (!dataset) return;
  // console.log(dataset);

  let curDatasetIndex = monthInfo.dataset.findIndex((id) => {
    return id === curDatasetId;
  });
  if (curDatasetId < 0) curDatasetIndex = 0;
  const threshold = monthInfo.threshold[curDatasetIndex];

  // TODO Why are these here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curMonth = curMonthDate.month(); // 0~11
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const curDaysInMonth = curMonthDate.daysInMonth(); // 28~31

  const maxDayTextSize = helper.measureTextSize('30', 'tracker-month-label');
  const cellSize =
    Math.max(maxDayTextSize.width, maxDayTextSize.height) * ratioCellToText;
  const dotRadius = ((cellSize / ratioCellToText) * ratioDotToText) / 2.0;
  const streakWidth = (cellSize - dotRadius * 2.0) / 2.0;
  const streakHeight = 3;

  // Get min and max
  let yMin = d3.min(dataset.values);
  if (monthInfo.yMin[curDatasetIndex] !== null) {
    yMin = monthInfo.yMin[curDatasetIndex];
  }
  let yMax = d3.max(dataset.values);
  if (monthInfo.yMax[curDatasetIndex] !== null) {
    yMax = monthInfo.yMax[curDatasetIndex];
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
  // console.log(monthStartDate.format("YYYY-MM-DD"));
  // console.log(startDate.format("YYYY-MM-DD"));

  // annotations
  const showAnnotation = monthInfo.showAnnotation;
  const annotations = monthInfo.annotation;
  const curAnnotation = annotations[curDatasetIndex];
  const showAnnotationOfAllTargets = monthInfo.showAnnotationOfAllTargets;

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
    curDate = helper.strToDate(
      helper.dateToStr(curDate, renderInfo.dateFormat),
      renderInfo.dateFormat
    );
    if (curDate.format('YYYY-MM-DD') === '2021-09-13') {
      logToConsole = false; // Change this to do debugging
    }

    if (monthInfo.startWeekOn.toLowerCase() === 'mon') {
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
      console.log(helper.dateToStr(curDate, renderInfo.dateFormat));
      console.log(curValue);
    }

    // showCircle
    let showCircle = false;
    if (!monthInfo.circleColorByValue) {
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
    if (monthInfo.circleColorByValue) {
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
      console.log(monthInfo.threshold);
      console.log(`streakIn: ${streakIn}, streakOut: ${streakOut}`);
    }

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
      date: helper.dateToStr(curDate, renderInfo.dateFormat),
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
  if (mode === 'circle' && monthInfo.showCircle && monthInfo.showStreak) {
    let streakColor = '#69b3a2';
    if (monthInfo.circleColor) {
      streakColor = monthInfo.circleColor;
    } else if (monthInfo.color) {
      streakColor = monthInfo.color;
    }
    // console.log(streakColor);

    chartElements.dataArea
      .selectAll('streakIn')
      .data(
        daysInMonthView.filter((d: DayInfo) => {
          return d.streakIn;
        })
      )
      .enter()
      .append('rect')
      // .attr("id", (d: DayInfo) => {
      //     return "in" + d.date.format("YYYY-MM-DD");
      // })
      .attr('x', (d: DayInfo) => {
        const x = scale(d.col) - dotRadius - streakWidth;
        return x;
      })
      .attr('y', (d: DayInfo) => {
        return scale(d.row) - streakHeight / 2.0;
      })
      .attr('width', streakWidth)
      .attr('height', streakHeight)
      .style('fill', (d: DayInfo) => {
        if (d.showCircle) {
          if (!monthInfo.circleColorByValue) {
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
        if (
          d.isOutOfDataRange ||
          (monthInfo.dimNotInMonth && !d.isInThisMonth)
        ) {
          return 0.2;
        }
        return 1.0;
      });

    chartElements.dataArea
      .selectAll('streakOut')
      .data(
        daysInMonthView.filter((d: DayInfo) => {
          return d.streakOut;
        })
      )
      .enter()
      .append('rect')
      // .attr("id", (d: DayInfo) => {
      //     return "out" + d.date.format("YYYY-MM-DD");
      // })
      .attr('x', (d: DayInfo) => {
        const x = scale(d.col) + dotRadius;
        return x;
      })
      .attr('y', (d: DayInfo) => {
        return scale(d.row) - streakHeight / 2.0;
      })
      .attr('width', streakWidth)
      .attr('height', streakHeight)
      .style('fill', (d: DayInfo) => {
        if (d.showCircle) {
          if (!monthInfo.circleColorByValue) {
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
        if (
          d.isOutOfDataRange ||
          (monthInfo.dimNotInMonth && !d.isInThisMonth)
        ) {
          return 0.2;
        }
        return 1.0;
      });
  }

  // circles
  let circleColor = '#69b3a2';
  if (monthInfo.circleColor) {
    circleColor = monthInfo.circleColor;
  } else if (monthInfo.color) {
    circleColor = monthInfo.color;
  }
  if (mode === 'circle' && monthInfo.showCircle) {
    chartElements.dataArea
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
          if (!monthInfo.circleColorByValue) {
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
          (monthInfo.dimNotInMonth && !d.isInThisMonth)
        ) {
          return 0.2;
        }
        return 1.0;
      })
      .style('cursor', 'default');
  }

  // today rings
  const today = helper.dateToStr(window.moment(), renderInfo.dateFormat);
  if (mode === 'circle' && monthInfo.showTodayRing) {
    const todayRings = chartElements.dataArea
      .selectAll('todayRing')
      .data(
        daysInMonthView.filter((d: DayInfo) => {
          return d.date === today;
        })
      )
      .enter()
      .append('circle')
      .attr('r', dotRadius * 0.9)
      .attr('cx', (d: DayInfo) => {
        return scale(d.col);
      })
      .attr('cy', (d: DayInfo) => {
        return scale(d.row);
      })
      .attr('class', 'tracker-month-today-circle') // stroke not works??
      .style('cursor', 'default');

    if (monthInfo.todayRingColor !== '') {
      todayRings.style('stroke', monthInfo.todayRingColor);
    } else {
      todayRings.style('stroke', 'white');
    }
  }

  // selected rings
  if (mode === 'circle' && monthInfo.showSelectedRing) {
    chartElements.dataArea
      .selectAll('selectedRing')
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
      .attr('id', (d: DayInfo) => {
        return 'tracker-selected-circle-' + d.date;
      })
      .attr('class', 'tracker-month-selected-circle') // stroke not works??
      .style('cursor', 'default')
      .style('stroke', 'none');
  }

  // labels
  chartElements.dataArea
    .selectAll('dayLabel')
    .data(daysInMonthView)
    .enter()
    .append('text')
    .text((d: DayInfo) => {
      return d.dayInMonth.toString();
    })
    .attr('transform', (d: DayInfo) => {
      const transX = scale(d.col);
      const transY = scale(d.row) + maxDayTextSize.height / 4;
      const strTranslate = 'translate(' + transX + ',' + transY + ')';

      return strTranslate;
    })
    .style('fill-opacity', (d: DayInfo) => {
      if (d.isOutOfDataRange || (monthInfo.dimNotInMonth && !d.isInThisMonth)) {
        return 0.2;
      }
      return 1.0;
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
      clearSelection(chartElements, monthInfo);
      // show new selected circle
      const date = d3.select(this).attr('date');
      monthInfo.selectedDate = date;
      if (monthInfo.showSelectedRing) {
        chartElements.dataArea
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
        } else {
          valueText = strValue;
        }
        chartElements.monitor.text(valueText);
      }
    })
    .style('cursor', 'pointer');

  // annotation
  if (mode === 'annotation' && showAnnotation) {
    chartElements.dataArea
      .selectAll('dayAnnotation')
      .data(daysInMonthView)
      .enter()
      .append('text')
      .text((d: DayInfo) => {
        return d.annotation;
      })
      .attr('transform', (d: DayInfo) => {
        const transX = scale(d.col);
        let transY = scale(d.row) + maxDayTextSize.height / 4;
        if (d.annotation) {
          transY += dotRadius;
        }
        const strTranslate = 'translate(' + transX + ',' + transY + ')';

        return strTranslate;
      })
      .attr('class', 'tracker-month-annotation');
  }

  // Expand areas
  const svgWidth = parseFloat(chartElements.svg.attr('width'));
  const svgHeight = parseFloat(chartElements.svg.attr('height'));
  const graphAreaWidth = parseFloat(chartElements.graphArea.attr('width'));
  const graphAreaHeight = parseFloat(chartElements.graphArea.attr('height'));
  const totalHeight =
    7 * cellSize + parseFloat(chartElements.header.attr('height'));
  const totalWidth = 7 * cellSize;
  if (totalHeight > svgHeight) {
    helper.expandArea(chartElements.svg, 0, totalHeight - svgHeight);
  }
  if (totalWidth > svgWidth) {
    helper.expandArea(chartElements.svg, totalWidth - svgWidth, 0);
  }
  if (totalHeight > graphAreaHeight) {
    helper.expandArea(
      chartElements.graphArea,
      0,
      totalHeight - graphAreaHeight
    );
  }
  if (totalWidth > graphAreaWidth) {
    helper.expandArea(chartElements.svg, totalWidth - graphAreaWidth, 0);
  }
}

const refresh = (
  canvas: HTMLElement,
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  monthInfo: Month,
  curMonthDate: Moment
): void => {
  // console.log("refresh");
  // console.log(renderInfo);
  if (!renderInfo || !renderMonth) return;

  chartElements = createAreas(chartElements, canvas, renderInfo, monthInfo);

  // render
  renderMonthHeader(canvas, chartElements, renderInfo, monthInfo, curMonthDate);

  renderMonthDays(canvas, chartElements, renderInfo, monthInfo, curMonthDate);
};

export const renderMonth = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  monthInfo: Month
): string => {
  // console.log("renderMonth");
  // console.log(renderInfo);
  // console.log(monthInfo);
  if (!renderInfo || !renderMonth) return;

  // dataset

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const datasetIds = monthInfo.dataset;

  let numAvailableDataset = 0;
  for (const dataset of renderInfo.datasets) {
    if (!dataset.query.usedAsXDataset) {
      numAvailableDataset++;
    }
  }
  if (numAvailableDataset === 0) {
    return 'No available dataset found';
  }
  toNextDataset(renderInfo, monthInfo);
  if (monthInfo.selectedDataset === null) {
    return 'No available dataset found';
  }

  let chartElements: ComponentElements = {};
  chartElements = createAreas(chartElements, canvas, renderInfo, monthInfo);

  let monthDate: Moment = null;
  if (monthInfo.initMonth) {
    monthDate = helper.getDateByDurationToToday(
      monthInfo.initMonth,
      renderInfo.dateFormat
    );
    if (!monthDate) {
      const initMonth = window.moment(monthInfo.initMonth, 'YYYY-MM', true);
      // console.log(initMonth);
      if (initMonth.isValid()) {
        monthDate = initMonth;
      } else {
        return 'Invalid initMonth';
      }
    }
  } else {
    monthDate = renderInfo.datasets.dates.last();
  }
  if (!monthDate) return;

  renderMonthHeader(canvas, chartElements, renderInfo, monthInfo, monthDate);
  renderMonthDays(canvas, chartElements, renderInfo, monthInfo, monthDate);
  setChartScale(canvas, chartElements, renderInfo);
};
