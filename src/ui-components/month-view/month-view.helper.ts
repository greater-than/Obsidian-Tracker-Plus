import * as d3 from 'd3';
import { RenderInfo } from '../../models/render-info';
import { MonthView } from './month-view.model';
import { IDayView } from './types';

/**
 * Returns true if the component.selectedDataset was updated
 * @param {RenderInfo} renderInfo
 * @param {Component} component
 * @returns {boolean}
 */
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
    let curIndex = datasetIds.findIndex((id) => id === curDatasetId);
    if (curIndex >= 0) {
      if (curIndex === component.dataset.length - 1) {
        // search from start
        for (const datasetId of datasetIds) {
          dataset = renderInfo.datasets.getDatasetById(datasetId);
          if (dataset && !dataset.query.usedAsXDataset) break;
        }
        if (!dataset) return false;
        component.selectedDataset = dataset.id;
        return true; // true if selected dataset changed
      } else {
        curIndex++;
        const datasetId = datasetIds[curIndex];
        dataset = renderInfo.datasets.getDatasetById(datasetId);
        component.selectedDataset = datasetId;
        if (dataset && !dataset.query.usedAsXDataset) return true;
        else toNextDataset(renderInfo, component);
      }
    }
  }
  return false;
};

export const getDayFill = (
  dayView: IDayView,
  colorByValue: boolean,
  color: string
) => {
  if (!dayView.showCircle) return 'none';
  if (!colorByValue) return color;
  return dayView.scaledValue !== null
    ? d3.interpolateLab('white', color)(dayView.scaledValue * 0.8 + 0.2)
    : 'none';
};

export const getDayOpacity = (component: MonthView, dayView: IDayView) => {
  return dayView.isOutOfDataRange ||
    (component.dimNotInMonth && !dayView.isInThisMonth)
    ? 0.2
    : 1;
};
