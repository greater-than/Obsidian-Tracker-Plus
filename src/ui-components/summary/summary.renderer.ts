import * as d3 from 'd3';
import { TrackerError } from '../../errors';
import * as Resolver from '../../expressions/resolver';
import { RenderInfo } from '../../models/render-info';
import { Summary } from './summary.model';

// TODO ???
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isTemplateValid = (_summaryTemplate: string): boolean => true;

export const renderSummary = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: Summary
): void => {
  if (!renderInfo || !component) return;
  const { template, style } = component;
  if (!isTemplateValid(template))
    throw new TrackerError('Invalid summary template');

  const summary = Resolver.resolveTemplate(template, renderInfo);
  if (summary === '') return;
  const selection = d3.select(container).append('div');
  if (summary.includes('\n') || summary.includes('\\n')) {
    summary.split(/(\n|\\n)/).forEach((line) => {
      if (line !== '\n' && line !== '\\n') selection.append('div').text(line);
    });
  } else selection.text(summary);
  if (style !== '') selection.attr('style', style);
};
