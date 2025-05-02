import { StringSearchOption } from './StringSearchOption';
import { RangeSearchOption } from './RangeSearchOption';
import { MoleculeSearchOption } from './MoleculeSearchOption';

export type SearchType = 'string' | 'range' | 'molecule';

export type SearchOption = StringSearchOption | RangeSearchOption | MoleculeSearchOption;

export interface QueryValue {
  selectedOption: string;
  value: any;
  [key: string]: any;
}

export * from './StringSearchOption';
export * from './RangeSearchOption';
export * from './MoleculeSearchOption';
