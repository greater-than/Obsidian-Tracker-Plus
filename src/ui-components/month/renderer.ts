import { Moment } from 'moment';
import { MonthInfo } from '../../models/month';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import { DateTimeUtils } from '../../utils';
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
  component: MonthInfo
): string => {
  // console.log("renderMonth");
  // console.log(renderInfo);
  // console.log(component);

  // TODO Why check for renderMonth?
  if (!renderInfo || !renderMonth) return;

  // dataset

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const datasetIds = component.dataset;

  let numAvailableDataset = 0;
  for (const dataset of renderInfo.datasets) {
    if (!dataset.query.usedAsXDataset) {
      numAvailableDataset++;
    }
  }
  if (numAvailableDataset === 0) {
    return 'No available dataset found';
  }
  toNextDataset(renderInfo, component);
  if (component.selectedDataset === null) {
    return 'No available dataset found';
  }

  let elements: ChartElements = {};
  elements = createAreas(elements, canvas, renderInfo, component);

  let monthDate: Moment = null;
  if (component.initMonth) {
    monthDate = DateTimeUtils.getDateByDurationToToday(
      component.initMonth,
      renderInfo.dateFormat
    );
    if (!monthDate) {
      const initMonth = window.moment(component.initMonth, 'YYYY-MM', true);
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

  renderMonthHeader(canvas, elements, renderInfo, component, monthDate);
  renderMonthDays(canvas, elements, renderInfo, component, monthDate);
  setChartScale(canvas, elements, renderInfo);
};
