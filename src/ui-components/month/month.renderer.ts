import { Moment } from 'moment';
import { RenderInfo } from '../../models/render-info';
import { DateTimeUtils } from '../../utils';
import { createElements } from '../shared';
import {
  renderMonthDays,
  renderMonthHeader,
  setChartScale,
  toNextDataset,
} from './month.helper';
import { Month } from './month.model';

export const renderMonth = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: Month
): string => {
  if (!renderInfo) return;

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
  if (numAvailableDataset === 0) return 'No available dataset found';

  toNextDataset(renderInfo, component);
  if (component.selectedDataset === null) return 'No available dataset found';

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

  renderMonthHeader(container, elements, renderInfo, component, monthDate);
  renderMonthDays(elements, renderInfo, component, monthDate);
  setChartScale(container, elements, renderInfo);
};
