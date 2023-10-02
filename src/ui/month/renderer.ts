import { Moment } from 'moment';
import { MonthInfo, RenderInfo } from '../../models/data';
import { ChartElements } from '../../models/types';
import * as dateTimeUtils from '../../utils/date-time.utils';
import {
  createAreas,
  renderMonthDays,
  renderMonthHeader,
  setChartScale,
  toNextDataset,
} from './helper';

export const renderMonth = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  monthInfo: MonthInfo
): string => {
  // console.log("renderMonth");
  // console.log(renderInfo);
  // console.log(monthInfo);

  // TODO Why check for renderMonth?
  if (!renderInfo || !renderMonth) return;

  // dataset

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const datasetIds = monthInfo.dataset;

  let numAvailableDataset = 0;
  for (const dataset of renderInfo.datasets) {
    if (!dataset.getQuery().usedAsXDataset) {
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

  let elements: ChartElements = {};
  elements = createAreas(elements, canvas, renderInfo, monthInfo);

  let monthDate: Moment = null;
  if (monthInfo.initMonth) {
    monthDate = dateTimeUtils.getDateByDurationToToday(
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
    monthDate = renderInfo.datasets.getDates().last();
  }
  if (!monthDate) return;

  renderMonthHeader(canvas, elements, renderInfo, monthInfo, monthDate);
  renderMonthDays(canvas, elements, renderInfo, monthInfo, monthDate);
  setChartScale(canvas, elements, renderInfo);
};
