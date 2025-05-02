import { FormControl, Validators } from '@angular/forms';
import { BaseSearchOptionParams, BaseSearchOption } from './BaseSearchOption';

type StringSearchOptionParams = Omit<BaseSearchOptionParams, 'type'> & {
  example: Record<string, any>;
};

export class StringSearchOption extends BaseSearchOption {
  constructor(params: StringSearchOptionParams) {
    super({
      ...params,
      type: 'string',
    });
    this.formGroup.setControl('value', new FormControl<string | null>(null, [Validators.required]));
  }
}
