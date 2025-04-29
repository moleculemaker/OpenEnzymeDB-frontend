import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { of, filter, switchMap, map, first, catchError, Observable } from 'rxjs';

export type SearchType = 'string' | 'range' | 'molecule';

interface BaseSearchOptionParams {
  key: string;
  label: string;
  type: SearchType;
  placeholder: string;
  example: Record<string, any>;
}

abstract class BaseSearchOption {
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

type RangeSearchOptionParams = Omit<BaseSearchOptionParams, 'type'> & {
  example: Record<string, any>;
  min?: number;
  max?: number;
};

export class RangeSearchOption extends BaseSearchOption {
  min?: number;
  max?: number;

  constructor(params: RangeSearchOptionParams) {
    super({
      ...params,
      type: 'range',
    });
    this.formGroup.setControl('value', new FormControl<[number, number] | null>(null, [Validators.required]));
    this.formGroup.setControl('valueLabel', new FormControl<string | null>(null, [Validators.required]));
    this.min = params.min;
    this.max = params.max;

    this.formGroup.get('valueLabel')!.valueChanges.subscribe((label) => {
      this.updateValueFromLabel(label);
    });

    this.formGroup.get('value')!.valueChanges.subscribe((value) => {
      this.updateLabelFromValue(value);
    });
  }

  private updateLabelFromValue(value: [number, number] | null) {
    console.log('[query-input] updating label from value', value);
    if (!value) {
      this.formGroup.get('valueLabel')!.setValue(null, { emitEvent: false, onlySelf: true });
      return;
    }

    this.formGroup.get('valueLabel')!.setValue(
      `${value[0]}-${value[1]}`,
      { emitEvent: false, onlySelf: true }
    );
  }

  private updateValueFromLabel(label: string | null) {
    if (!label) {
      this.formGroup.get('value')!.setValue(null, { emitEvent: false, onlySelf: true });
      return;
    }

    const matches = [...label.matchAll(/^(-?\d+)-(-?\d+)$/g)][0];
    if (matches && matches.length === 3) {
      const [_, min, max] = matches.map(Number);
      this.formGroup.get('value')!.setValue([min, max], { emitEvent: false, onlySelf: true });
      console.log('[query-input] updated value from label', label, [min, max]);
    } else {
      this.formGroup.get('value')!.setValue(null, { emitEvent: false, onlySelf: true });
      console.error('[query-input] invalid label', label);
    }
  }
}

type MoleculeSearchOptionParams = Omit<BaseSearchOptionParams, 'type'> & {
  example: Record<string, any>;
  moleculeValidator: (smiles: string) => Observable<any>;
};

export class MoleculeSearchOption extends BaseSearchOption {
  chemInfo: {
    structure: string;
    status: 'valid' | 'invalid' | 'loading' | 'empty' | 'na';
  } = {
    structure: '',
    status: 'na'
  }

  constructor(params: MoleculeSearchOptionParams) {
    super({
      ...params,
      type: 'molecule',
    });
    this.formGroup.setControl('inputType', new FormControl<'name' | 'smiles' | null>('name', [Validators.required]));
    this.formGroup.setControl('value', new FormControl<string | null>('', [Validators.required], [
      (control: AbstractControl) => {
        return of(control.value).pipe(
          filter(() => {
            console.log('[query-input] validating smiles', 
              this.formGroup.get('inputType')?.value,
              this.formGroup.get('value')?.value
            );
            if (this.formGroup.get('inputType')?.value === 'smiles') {
              this.chemInfo.status = 'loading';
              return true;
            }
            return false;
          }),
          switchMap((smiles) => params.moleculeValidator(smiles)),
          map((chemical) => {
            if (chemical) {
              this.chemInfo.structure = chemical.structure || "";
              this.chemInfo.status = 'valid';
              return null;
            }
            this.chemInfo.status = 'invalid';
            return { invalidSmiles: true };
          }),
          first(),
          catchError((err) => {
            if (err.name === "EmptyError") {
              this.chemInfo.status = 'empty';
              return of(null);
            }
            
            console.error('[query-input] error validating chemical', err);
            this.chemInfo.status = 'invalid';
            return of({ invalidSmiles: true });
          })
        );
      }
    ]));
  }

  override reset() {
    super.reset();
    this.chemInfo = {
      structure: '',
      status: 'na'
    }
    this.formGroup.get('inputType')!.setValue('name', { emitEvent: false });
    this.formGroup.get('value')!.setValue('', { emitEvent: false });
  }
}

export type SearchOption = StringSearchOption | RangeSearchOption | MoleculeSearchOption;

export interface QueryValue {
  selectedOption: string;
  value: any;
  [key: string]: any;
}
