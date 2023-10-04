import * as d3 from 'd3';
import { RenderInfo } from '../../models/render-info';
import { Summary } from '../../models/summary';
import Resolver from '../../resolver/resolver';
import { checkSummaryTemplateValid } from './helper';

export const renderSummary = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  component: Summary
): string => {
  // console.log("renderSummary");
  // console.log(renderInfo);
  if (!renderInfo || !component) return;

  // console.log(component.template);
  let outputSummary = '';
  if (checkSummaryTemplateValid(component.template)) {
    outputSummary = component.template;
  } else {
    return 'Invalid summary template';
  }

  const resolvedTemplate = Resolver.resolveTemplate(outputSummary, renderInfo);
  // console.log(resolvedTemplate);
  if (resolvedTemplate.startsWith('Error:')) {
    return resolvedTemplate;
  }
  outputSummary = resolvedTemplate;

  if (outputSummary !== '') {
    const textBlock = d3.select(canvas).append('div');
    if (outputSummary.includes('\n') || outputSummary.includes('\\n')) {
      const outputLines = outputSummary.split(/(\n|\\n)/);
      // console.log(outputLines);
      for (const outputLine of outputLines) {
        if (outputLine !== '\n' && outputLine !== '\\n')
          textBlock.append('div').text(outputLine);
      }
    } else {
      textBlock.text(outputSummary);
    }

    if (component.style !== '') {
      textBlock.attr('style', component.style);
    }
  }
};
