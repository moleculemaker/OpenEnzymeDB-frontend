import { CommonModule, JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';

import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { RadioButtonModule } from 'primeng/radiobutton';

import { MarvinjsInputComponent } from '../marvinjs-input/marvinjs-input.component';
import { MoleculeImageComponent } from '../molecule-image/molecule-image.component';

interface SearchOption {
  key: string;
  label: string;
  type: string;
  formControl: {
    value: FormControl<any | null>;
    [key: string]: FormControl<any | null> | undefined;
  };
  example: {
    label: string;
    value: string;
  };
}

interface QueryValue {
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
    { 
      key: 'compound',
      label: 'Compound', 
      type: 'string',
      formControl: {
        select: new FormControl<'name' | 'smiles' | null>('name', [Validators.required]),
        value: new FormControl<string | null>('', [Validators.required])
      },
      example: {
        label: 'Ethanol (CCO)',
        value: 'CCO'
      },
    },
    { 
      key: 'organism',
      label: 'Organism', 
      type: 'string',
      formControl: {
        value: new FormControl<string | null>('', [Validators.required])
      },
      example: {
        label: 'Lentzea aerocolonigenes',
        value: 'Lentzea aerocolonigenes'
      }
    },
    { 
      key: 'uniprot_id',
      label: 'Uniprot ID', 
      type: 'string',
      formControl: {
        value: new FormControl<string | null>('', [Validators.required])
      },
      example: {
        label: 'A2BC19',
        value: 'A2BC19'
      }
    },
    { 
      key: 'ec_number',
      label: 'EC Number', 
      type: 'string',
      formControl: {
        value: new FormControl<string | null>('', [Validators.required])
      },
      example: {
        label: '2.7.10.1',
        value: '2.7.10.1'
      }
    },
    { 
      key: 'ph',
      label: 'pH', 
      type: 'range',
      formControl: {
        value: new FormControl<[number, number] | null>(null, [Validators.required])
      },
      example: {
        label: '1-8',
        value: '1-8'
      }
    },
    { 
      key: 'temperature',
      label: 'Temperature', 
      type: 'range',
      formControl: {
        value: new FormControl<[number, number] | null>(null, [Validators.required])
      },
      example: {
        label: '37-39°C',
        value: '37-39'
      }
    },
  ];

  private onChange: (value: QueryValue) => void = () => {};
  private onTouched: () => void = () => {};
  disabled = false;

  writeValue(value: QueryValue): void {
    if (value) {
      this.selectedSearchOption = this.searchOptionRecords[value.selectedOption];
      if (this.selectedSearchOption) {
        this.selectedSearchOption.formControl.value.setValue(value.value);
      }
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

  private emitValue(): void {
    if (!this.selectedSearchOption) return;

    const inputValue = this.selectedSearchOption.formControl.value.value;
    const others = Object.entries(this.selectedSearchOption.formControl).reduce((acc, [key, control]) => {
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
      Object.values(config.formControl).forEach(control => {
        if (control) {
          control.valueChanges.subscribe(() => {
            this.emitValue();
          });
        }
      });
    });
  }
}
