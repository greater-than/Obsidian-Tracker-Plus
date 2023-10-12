import * as d3 from 'd3';
import { Dataset } from '../../models/dataset';
import { ValueType } from '../../models/enums';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import { UiUtils } from '../../utils';
import { createElements } from '../shared';
import {
  renderLegend,
  renderTitle,
  renderXAxis,
  renderYAxis,
} from './chart.helper';
import { DataPoint } from './data-point.model';
import { LineChart } from './line-chart.model';

export const renderLineChart = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: LineChart
): string => {
  if (!renderInfo || !component) return;

  const elements = createElements(container, renderInfo);

  renderTitle(elements, renderInfo, component);

  renderXAxis(elements, renderInfo, component);
  const datasetOnLeftYAxis = [];
  const datasetOnRightYAxis = [];
  const xDatasetIds = renderInfo.datasets.getXDatasetIds();
  for (let ind = 0; ind < component.yAxisLocation.length; ind++) {
    if (xDatasetIds.includes(ind)) continue;
    const yAxisLocation = component.yAxisLocation[ind];
    if (yAxisLocation.toLowerCase() === 'left') {
      datasetOnLeftYAxis.push(ind);
    } else if (yAxisLocation.toLocaleLowerCase() === 'right') {
      datasetOnRightYAxis.push(ind);
    }
  }

  const renderLeftYAxis = renderYAxis(
    elements,
    renderInfo,
    component,
    'left',
    datasetOnLeftYAxis
  );
  if (typeof renderLeftYAxis === 'string') {
    return renderLeftYAxis;
  }

  if (elements.leftYAxis && elements.leftYScale) {
    for (const datasetId of datasetOnLeftYAxis) {
      const dataset = renderInfo.datasets.getDataset(datasetId);
      if (dataset.query.usedAsXDataset) continue;

      renderLine(elements, renderInfo, component, dataset, 'left');
      renderPoints(elements, renderInfo, component, dataset, 'left');
    }
  }

  const renderRightYAxis = renderYAxis(
    elements,
    renderInfo,
    component,
    'right',
    datasetOnRightYAxis
  );
  if (typeof renderRightYAxis === 'string') return renderRightYAxis;

  if (elements.rightYAxis && elements.rightYScale) {
    for (const datasetId of datasetOnRightYAxis) {
      const dataset = renderInfo.datasets.getDataset(datasetId);
      if (dataset.query.usedAsXDataset) continue;

      renderLine(elements, renderInfo, component, dataset, 'right');
      renderPoints(elements, renderInfo, component, dataset, 'right');
    }
  }

  if (component.showLegend) renderLegend(elements, renderInfo, component);

  UiUtils.setScale(container, elements, renderInfo);
};

export const renderLine = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: LineChart,
  dataset: Dataset,
  yAxisLocation: string
): void => {
  if (!renderInfo || !component) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yScale: any = null;
  if (yAxisLocation === 'left') yScale = elements.leftYScale;
  else if (yAxisLocation === 'right') yScale = elements.rightYScale;

  if (component.showLine[dataset.id]) {
    const lineGen = d3
      .line<DataPoint>()
      .defined((p: DataPoint) => p.value !== null)
      .x((p: DataPoint) => elements.xScale(p.date))
      .y((p: DataPoint) => yScale(p.value));

    const line = elements.dataArea
      .append('path')
      .attr('class', 'tracker-line')
      .style('stroke-width', component.lineWidth[dataset.id]); // TODO This value is not correct

    if (component.fillGap[dataset.id])
      line
        .datum(Array.from(dataset).filter((p) => p.value !== null))
        .attr('d', lineGen);
    else line.datum(dataset).attr('d', lineGen);

    if (component.lineColor[dataset.id])
      line.style('stroke', component.lineColor[dataset.id]);
  }
};

export const renderPoints = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: LineChart,
  dataset: Dataset,
  yAxisLocation: string
): void => {
  if (!renderInfo || !component) return;
  const { leftYScale, rightYScale, dataArea, xScale } = elements;
  const {
    allowInspectData,
    pointSize,
    pointBorderColor,
    pointBorderWidth,
    pointColor,
  } = component;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yScale: any = null;
  if (yAxisLocation === 'left') yScale = leftYScale;
  else if (yAxisLocation === 'right') yScale = rightYScale;

  if (component.showPoint[dataset.id]) {
    const dots = dataArea
      .selectAll('dot')
      .data(Array.from(dataset).filter((p: DataPoint) => p.value !== null))
      .enter()
      .append('circle')
      .attr('r', pointSize[dataset.id])
      .attr('cx', (p: DataPoint) => xScale(p.date))
      .attr('cy', (p: DataPoint) => yScale(p.value))
      .attr('date', (p: DataPoint) =>
        d3.timeFormat('%y-%m-%d')(p.date.toDate())
      )
      .attr('value', (p: DataPoint) => {
        if (p.value !== null) {
          return Number.isInteger(p.value)
            ? p.value.toFixed(0)
            : p.value.toFixed(2);
        }
      })
      .attr('valueType', ValueType[dataset.valueType])
      .attr('class', 'tracker-dot');
    if (component.pointColor[dataset.id]) {
      dots.style('fill', pointColor[dataset.id]);

      if (pointBorderColor[dataset.id] && pointBorderWidth[dataset.id] > 0) {
        dots.style('stroke', pointBorderColor[dataset.id]);
        dots.style('stroke-width', pointBorderWidth[dataset.id]);
      }
    }

    if (allowInspectData) renderTooltip(dots, elements, renderInfo);
  }
};

export function renderTooltip(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetElements: any,
  elements: ChartElements,
  renderInfo: RenderInfo
): void {
  const tooltip = elements.dataArea.append('svg').style('opacity', 0);
  const tooltipBg = tooltip.append('rect').attr('x', 0).attr('y', 0);
  const tooltipLabel = tooltip.append('text');
  const tooltipLabelDate = tooltipLabel
    .append('tspan')
    .attr('class', 'tracker-tooltip-label');
  const tooltipLabelValue = tooltipLabel
    .append('tspan')
    .attr('class', 'tracker-tooltip-label');

  const xSpacing = 3;
  const ySpacing = 3;

  targetElements
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('mouseenter', (event: any) => {
      const [x, y] = d3.pointer(event);
      let tooltipBgWidth = 0;
      let tooltipBgHeight = 0;
      // Date
      const labelDateText = 'date: ' + d3.select(this).attr('date');
      // labelDateText = x.toString();// debug
      const labelDateSize = UiUtils.getTextDimensions(
        labelDateText,
        'tracker-tooltip-label'
      );
      tooltipLabelDate.text(labelDateText);
      if (labelDateSize.width > tooltipBgWidth) {
        tooltipBgWidth = labelDateSize.width;
      }
      tooltipBgHeight += labelDateSize.height;
      tooltipLabelDate.attr('x', xSpacing).attr('y', tooltipBgHeight);

      // Value
      let labelValueText = 'value: ';
      const valueType = d3.select(this).attr('valueType');
      const strValue = d3.select(this).attr('value');

      if (valueType === 'Time') {
        const dayStart = window.moment('00:00', 'HH:mm', true);
        const tickTime = dayStart.add(parseFloat(strValue), 'seconds');
        const dateValue = tickTime.format('HH:mm');
        labelValueText += dateValue;
        tooltipLabelValue.text(labelValueText);
      } else {
        labelValueText += strValue;
        tooltipLabelValue.text(labelValueText);
      }
      const labelValueSize = UiUtils.getTextDimensions(
        labelValueText,
        'tracker-tooltip-label'
      );
      if (labelValueSize.width > tooltipBgWidth) {
        tooltipBgWidth = labelValueSize.width;
      }
      tooltipBgHeight += ySpacing + labelValueSize.height;
      tooltipLabelValue.attr('x', xSpacing).attr('y', tooltipBgHeight);

      tooltipBgWidth += 2 * xSpacing;
      tooltipBgHeight += 2 * ySpacing;
      tooltipLabel
        .attr('width', tooltipBgWidth)
        .attr('height', tooltipBgHeight);

      tooltipBg
        .attr('width', tooltipBgWidth)
        .attr('height', tooltipBgHeight)
        .attr('class', 'tracker-tooltip');

      let tooltipPosX = x;
      let tooltipPosY = y;
      const tooltipXOffset = 12;
      const tooltipYOffset = 12;
      if (x + tooltipXOffset + tooltipBgWidth > renderInfo.dataAreaSize.width) {
        // move tooltip to left
        tooltipPosX = x - tooltipBgWidth - tooltipXOffset;
      } else {
        // default at the right side
        tooltipPosX = x + tooltipXOffset;
      }
      if (y - tooltipYOffset - tooltipBgHeight < 0) {
        // down side
        tooltipPosY = y + tooltipYOffset;
      } else {
        // default move to up side
        tooltipPosY = y - tooltipYOffset - tooltipBgHeight;
      }
      tooltip.attr('x', tooltipPosX).attr('y', tooltipPosY);
      tooltip.transition().duration(200).style('opacity', 1);
    })
    .on('mouseleave', () => {
      tooltip.transition().duration(500).style('opacity', 0);
    });
}
