import { CommonModule, JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';

import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { RadioButtonModule } from 'primeng/radiobutton';

import { MarvinjsInputComponent } from '../marvinjs-input/marvinjs-input.component';
import { MoleculeImageComponent } from '../molecule-image/molecule-image.component';
import { of, switchMap, map, first, catchError, filter, tap } from 'rxjs';
import { Loadable, OpenEnzymeDBService } from '~/app/services/openenzymedb.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';

type SearchType = 'string' | 'range' | 'molecule';

interface BaseSearchOptionParams {
  key: string;
  label: string;
  type: SearchType;
  placeholder: string;
  formControls: {
    value: FormControl<any | null>;
    [key: string]: FormControl<any> | undefined;
  };
  example: Record<string, any>;
}

class BaseSearchOption {
  key: string;
  label: string;
  type: SearchType;
  placeholder: string;
  formControls: {
    value: FormControl<any | null>;
    [key: string]: FormControl<any> | undefined;
  };
  example: Record<string, any>;

  constructor(params: BaseSearchOptionParams) {
    this.key = params.key;
    this.label = params.label;
    this.type = params.type;
    this.placeholder = params.placeholder;
    this.formControls = params.formControls;
    this.example = params.example;
  }

  reset() {
    Object.values(this.formControls).forEach(control => {
      if (control) {
        control.reset();
      }
    });
  }
}

type StringSearchOptionParams = Omit<BaseSearchOptionParams, 'type'> & {
  formControls: {
    value: FormControl<string | null>;
  };
  example: Record<string, any>;
}

class StringSearchOption extends BaseSearchOption {
  constructor(params: StringSearchOptionParams) {
    super({
      ...params,
      type: 'string',
    });
  }
}

type RangeSearchOptionParams = Omit<BaseSearchOptionParams, 'type'> & {
  formControls: {
    value: FormControl<[number, number] | null>;
    valueLabel: FormControl<string | null>;
  };
  example: Record<string, any>;
  min?: number;
  max?: number;
}

class RangeSearchOption extends BaseSearchOption {
  min?: number;
  max?: number;

  constructor(params: RangeSearchOptionParams) {
    super({
      ...params,
      type: 'range',
    });
    this.min = params.min;
    this.max = params.max;

    this.formControls['valueLabel']!.valueChanges.subscribe((label) => {
      this.updateValueFromLabel(label);
    });

    this.formControls['value']!.valueChanges.subscribe((value) => {
      this.updateLabelFromValue(value);
    });
  }

  private updateLabelFromValue(value: [number, number] | null) {
    console.log('[query-input] updating label from value', value);
    if (!value) {
      this.formControls['valueLabel']!.setValue(null, { emitEvent: false });
      return;
    }

    this.formControls['valueLabel']!.setValue(
      `${value[0]}-${value[1]}`,
      { emitEvent: false }
    );
  }

  private updateValueFromLabel(label: string | null) {
    if (!label) {
      this.formControls['value']!.setValue(null, { emitEvent: false });
      return;
    }

    const matches = [...label.matchAll(/^(-?\d+)-(-?\d+)$/g)][0];
    if (matches && matches.length === 3) {
      const [_, min, max] = matches.map(Number);
      this.formControls['value']!.setValue([min, max], { emitEvent: false });
      console.log('[query-input] updated value from label', label, [min, max]);
    } else {
      this.formControls['value']!.setValue(null, { emitEvent: false });
      console.error('[query-input] invalid label', label);
    }
  }
}

type MoleculeSearchOptionParams = Omit<BaseSearchOptionParams, 'type'> & {
  formControls: {
    select: FormControl<'name' | 'smiles' | null>;
    value: FormControl<string | null>;
  };
  example: Record<string, any>;
}

class MoleculeSearchOption extends BaseSearchOption {
  constructor(params: MoleculeSearchOptionParams) {
    super({
      ...params,
      type: 'molecule',
    });
  }
}

type SearchOption = StringSearchOption | RangeSearchOption | MoleculeSearchOption;

const parseValue = (option: SearchOption, input: string): any => {
  switch (option.type) {
    case 'range':
      const [min, max] = input.split('-').map(Number);
      return (!isNaN(min) && !isNaN(max)) ? [min, max] : null;
    case 'molecule':
    case 'string':
    default:
      return input;
  }
};

export interface QueryValue {
  selectedOption: string;
  value: any;
  [key: string]: any;
}

@Component({
  selector: 'app-query-input',
  standalone: true,
  imports: [
    DropdownModule,
    FormsModule,
    InputTextModule,
    MenuModule,
    CommonModule,
    MarvinjsInputComponent,
    ReactiveFormsModule,
    RadioButtonModule,
    MoleculeImageComponent,
    ProgressSpinnerModule,
    SkeletonModule,
  ],
  templateUrl: './query-input.component.html',
  styleUrl: './query-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: QueryInputComponent,
      multi: true
    }
  ]
})
export class QueryInputComponent implements ControlValueAccessor {
  
  chemicalInfo: Loadable<string> = {
    status: 'loading',
    data: null
  }

  searchConfigs: SearchOption[] = [
    new MoleculeSearchOption({
      key: 'compound',
      label: 'Compound',
      placeholder: 'Enter a compound',
      formControls: {
        select: new FormControl<'name' | 'smiles' | null>('name', [Validators.required]),
        value: new FormControl<string | null>('', [Validators.required], [
          (control: AbstractControl) => {
            return of(control.value).pipe(
              filter(() => {
                return this.selectedSearchOption?.key === 'compound'
                  && this.selectedSearchOption?.formControls['select']?.value === 'smiles';
              }),
              switchMap((smiles) => this.service.validateChemical(smiles)),
              tap((res) => {
                this.chemicalInfo = res;
              }),
            );
          }
        ])
      },
      example: {
        label: 'Ethanol (CCO)',
        select: 'smiles',
        value: 'CCO'
      }
    }),
    new StringSearchOption({
      key: 'organism',
      label: 'Organism',
      placeholder: 'Enter organism name',
      formControls: {
        value: new FormControl<string | null>('', [Validators.required])
      },
      example: {
        label: 'Lentzea aerocolonigenes',
        value: 'Lentzea aerocolonigenes'
      }
    }),
    new StringSearchOption({
      key: 'uniprot_id',
      label: 'Uniprot ID',
      placeholder: 'Enter Uniprot ID',
      formControls: {
        value: new FormControl<string | null>('', [Validators.required])
      },
      example: {
        label: 'P05655',
        value: 'P05655'
      }
    }),
    new StringSearchOption({
      key: 'ec_number',
      label: 'EC Number',
      placeholder: 'Enter EC Number',
      formControls: {
        value: new FormControl<string | null>('', [Validators.required])
      },
      example: {
        label: '5.1.1.1',
        value: '5.1.1.1'
      }
    }),
    new RangeSearchOption({
      key: 'ph',
      label: 'pH',
      placeholder: 'Enter pH range',
      formControls: {
        value: new FormControl<[number, number] | null>(null, [Validators.required]),
        valueLabel: new FormControl<string | null>(null, [Validators.required])
      },
      example: {
        label: '1-8',
        value: [1, 8]
      }
    }),
    new RangeSearchOption({
      key: 'temperature',
      label: 'Temperature',
      placeholder: 'Enter temperature range',
      formControls: {
        value: new FormControl<[number, number] | null>(null, [Validators.required]),
        valueLabel: new FormControl<string | null>(null, [Validators.required])
      },
      example: {
        label: '37-39°C',
        value: [37, 39]
      }
    }),
  ];

  private onChange: (value: QueryValue) => void = () => {};
  private onTouched: () => void = () => {};
  disabled = false;

  writeValue(value: QueryValue | null): void {
    if (value) {
      this.selectedSearchOption = this.searchOptionRecords[value.selectedOption];
      if (this.selectedSearchOption) {
        this.selectedSearchOption.formControls.value.setValue(value.value);
      }
    } else {
      this.selectedSearchOption = null;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  useExample(option: SearchOption['key'] = 'compound') {
    this.selectedSearchOption?.reset();
    this.selectedSearchOption = this.searchOptionRecords[option];
    Object.entries(this.selectedSearchOption.formControls).forEach(([key, control]) => {
      const value = this.selectedSearchOption!.example[key];
      if (control && value) {
        control.setValue(value);
      }
    });
  }

  reset() {
    Object.values(this.searchConfigs).forEach((config) => {
      config.reset();
    });
    this.selectedSearchOption = null;
  }

  private emitValue(): void {
    if (!this.selectedSearchOption) return;

    const inputValue = this.selectedSearchOption.formControls.value.value;
    const others = Object.entries(this.selectedSearchOption.formControls).reduce((acc, [key, control]) => {
      if (key !== 'value') {
        acc[key] = control?.value;
      }
      return acc;
    }, {} as Record<string, any>);

    const value: QueryValue = {
      selectedOption: this.selectedSearchOption.key,
      value: inputValue,
      ...others
    };

    console.log('[query-input] emitting value', value);
    this.onChange(value);
    this.onTouched();
  }

  readonly searchOptions = this.searchConfigs.map((config) => ({
    ...config,
    command: () => { 
      this.selectedSearchOption?.reset();
      this.selectedSearchOption = config;
      this.emitValue();
    }
  }));

  readonly searchOptionRecords = this.searchConfigs.reduce((acc, config) => {
    acc[config.key] = config;
    return acc;
  }, {} as Record<string, typeof this.searchConfigs[0]>);


  selectedSearchOption: SearchOption | null = null;

  constructor(
    private service: OpenEnzymeDBService
  ) {}

  ngOnInit() {
    // Subscribe to value changes for all search configs
    this.searchConfigs.forEach(config => {
      Object.values(config.formControls).forEach(control => {
        if (control) {
          control.valueChanges.subscribe(() => {
            this.emitValue();
          });
        }
      });
    });
  }
}
