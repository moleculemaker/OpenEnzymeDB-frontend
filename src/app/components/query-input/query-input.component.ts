import { CommonModule, JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';

import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { RadioButtonModule } from 'primeng/radiobutton';

import { MarvinjsInputComponent } from '../marvinjs-input/marvinjs-input.component';
import { MoleculeImageComponent } from '../molecule-image/molecule-image.component';

type SearchType = 'string' | 'range' | 'molecule';

class BaseSearchOption {
  constructor(
    public key: string,
    public label: string,
    public type: SearchType,
    public formControls: {
      value: FormControl<any | null>;
      [key: string]: FormControl<any> | undefined;
    },
    public example: Record<string, any>
  ) {}

  reset() {
    Object.values(this.formControls).forEach(control => {
      if (control) {
        control.reset();
      }
    });
  }
}

class StringSearchOption extends BaseSearchOption {
  constructor(
    key: string,
    label: string,
    formControls: {
      value: FormControl<string | null>;
    },
    example: Record<string, any>
  ) {
    super(key, label, 'string', formControls, example);
  }
}

class RangeSearchOption extends BaseSearchOption {
  constructor(
    key: string,
    label: string,
    formControls: {
      value: FormControl<[number, number] | null>;
    },
    example: Record<string, any>,
    public min?: number,
    public max?: number
  ) {
    super(key, label, 'range', formControls, example);
  }
}

class MoleculeSearchOption extends BaseSearchOption {
  constructor(
    key: string,
    label: string,
    formControls: {
      select: FormControl<'name' | 'smiles' | null>;
      value: FormControl<string | null>;
    },
    example: Record<string, any>
  ) {
    super(key, label, 'molecule', formControls, example);
  }
}

type SearchOption = StringSearchOption | RangeSearchOption | MoleculeSearchOption;

// Helper functions for each type
const formatValue = (option: SearchOption, value: any): string => {
  switch (option.type) {
    case 'range':
      return value ? `${value[0]}-${value[1]}` : '';
    case 'molecule':
    case 'string':
    default:
      return value?.toString() || '';
  }
};

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
    JsonPipe,
    CommonModule,
    MarvinjsInputComponent,
    ReactiveFormsModule,
    RadioButtonModule,
    MoleculeImageComponent,
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
  searchConfigs: SearchOption[] = [
    new MoleculeSearchOption(
      'compound',
      'Compound',
      {
        select: new FormControl<'name' | 'smiles' | null>('name', [Validators.required]),
        value: new FormControl<string | null>('', [Validators.required])
      },
      {
        label: 'Ethanol (CCO)',
        select: 'smiles',
        value: 'CCO'
      }
    ),
    new StringSearchOption(
      'organism',
      'Organism',
      {
        value: new FormControl<string | null>('', [Validators.required])
      },
      {
        label: 'Lentzea aerocolonigenes',
        value: 'Lentzea aerocolonigenes'
      }
    ),
    new StringSearchOption(
      'uniprot_id',
      'Uniprot ID',
      {
        value: new FormControl<string | null>('', [Validators.required])
      },
      {
        label: 'A2BC19',
        value: 'A2BC19'
      }
    ),
    new StringSearchOption(
      'ec_number',
      'EC Number',
      {
        value: new FormControl<string | null>('', [Validators.required])
      },
      {
        label: '2.7.10.1',
        value: '2.7.10.1'
      }
    ),
    new RangeSearchOption(
      'ph',
      'pH',
      {
        value: new FormControl<[number, number] | null>(null, [Validators.required])
      },
      {
        label: '1-8',
        value: [1, 8]
      }
    ),
    new RangeSearchOption(
      'temperature',
      'Temperature',
      {
        value: new FormControl<[number, number] | null>(null, [Validators.required])
      },
      {
        label: '37-39°C',
        value: [37, 39]
      }
    ),
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
      if (control) {
        control.setValue(this.selectedSearchOption!.example[key]);
      }
    });
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

  formatValue(option: SearchOption, value: any): string {
    return formatValue(option, value);
  }

  parseInput(event: Event, option: SearchOption, control: FormControl): void {
    const input = (event.target as HTMLInputElement).value;
    const parsedValue = parseValue(option, input);
    if (parsedValue !== null) {
      control.setValue(parsedValue);
    }
  }
}
