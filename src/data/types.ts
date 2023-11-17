import { CachedMetadata, TFile } from 'obsidian';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';

export interface ITrackerSettings {
  folder: string;
  dateFormat: string;
}

export interface ISearchIn {
  metadata: CachedMetadata;
  note: string;
  file: TFile;
}

export type TDateSearchIn = CachedMetadata | string | TFile;

export type TDateGetter = (
  searchIn: TDateSearchIn,
  renderInfo: RenderInfo,
  query?: Query
) => moment.Moment;
