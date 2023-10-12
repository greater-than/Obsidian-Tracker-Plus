import * as d3 from 'd3';
import { TrackerError } from '../../errors';
import { RenderInfo } from '../../models/render-info';
import Resolver from '../../resolver/resolver';
import { checkSummaryTemplateValid } from './summary.helper';
import { Summary } from './summary.model';

export const renderSummary = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: Summary
): void => {
  if (!renderInfo || !component) return;

  if (!checkSummaryTemplateValid(component.template))
    throw new TrackerError('Invalid summary template');

  const outputSummary = Resolver.resolveTemplate(
    component.template,
    renderInfo
  );

  if (outputSummary !== '') {
    const textBlock = d3.select(container).append('div');
    if (outputSummary.includes('\n') || outputSummary.includes('\\n')) {
      const outputLines = outputSummary.split(/(\n|\\n)/);
      for (const outputLine of outputLines) {
        if (outputLine !== '\n' && outputLine !== '\\n')
          textBlock.append('div').text(outputLine);
      }
    } else textBlock.text(outputSummary);

    if (component.style !== '') textBlock.attr('style', component.style);
  }
};
