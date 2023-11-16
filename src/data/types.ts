import { CachedMetadata, TFile } from 'obsidian';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';

export interface ITrackerSettings {
  folder: string;
  dateFormat: string;
}

export type TDateSearchIn = string | CachedMetadata | TFile;

export type TDateGetter = (
  searchIn: TDateSearchIn,
  renderInfo: RenderInfo,
  query?: Query
) => moment.Moment;
