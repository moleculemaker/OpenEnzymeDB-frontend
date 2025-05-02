import { FormGroup, FormControl } from '@angular/forms';
import { SearchType } from '.';

export interface BaseSearchOptionParams {
  key: string;
  label: string;
  type: SearchType;
  placeholder: string;
  example: Record<string, any>;
}
export abstract class BaseSearchOption {
  key: string;
  label: string;
  type: SearchType;
  placeholder: string;
  formGroup: FormGroup;
  example: Record<string, any>;

  constructor(params: BaseSearchOptionParams) {
    this.key = params.key;
    this.label = params.label;
    this.type = params.type;
    this.placeholder = params.placeholder;
    this.example = params.example;
    this.formGroup = new FormGroup({
      value: new FormControl<any | null>(null),
    });
  }

  reset() {
    this.formGroup.reset();
  }
}
