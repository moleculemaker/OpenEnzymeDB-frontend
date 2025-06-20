import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { RadioButtonModule } from 'primeng/radiobutton';

import { MarvinjsInputComponent } from '../marvinjs-input/marvinjs-input.component';
import { MoleculeImageComponent } from '../molecule-image/molecule-image.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { SearchOption, QueryValue } from '../../models/search-options';
import { Subscription } from 'rxjs';

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
  @Input() searchConfigs: SearchOption[] = [];
  @Input() multiple = true;

  // selectedSearchOption: SearchOption | null = null;
  selectedSearchOptionKey: SearchOption['key'] | null = null;

  get selectedSearchOption() {
    return this.selectedSearchOptionKey 
    ? this.searchOptionRecords[this.selectedSearchOptionKey] : null;
  }

  searchOptions = this.searchConfigs.map((config) => ({
    ...config,
    command: () => {
      this.selectedSearchOption?.reset();
      this.selectedSearchOptionKey = config.key;
      this.emitValue();
    }
  }));

  searchOptionRecords = this.searchConfigs.reduce((acc, config) => {
    acc[config.key] = config;
    return acc;
  }, {} as Record<string, typeof this.searchConfigs[0]>);

  subscriptions: Subscription[] = [];

  constructor() { }

  ngOnInit() {
    // Subscribe to value changes for all search configs
    this.searchConfigs.forEach(config => {
      this.subscriptions.push(
        config.formGroup.statusChanges.subscribe((status) => {
          console.log('[query-input] form group status changed', status);
          this.emitValue();
        })
      );
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchConfigs']) {
      this.updateSearchOptions();
    }

    if (changes['multiple']) {
      this.updateSearchOptions();
      this.selectedSearchOptionKey = changes['multiple'].currentValue 
        ? null 
        : this.searchConfigs[0].key;
    }
  }

  private onChange: (value: QueryValue | null) => void = () => { };
  private onTouched: () => void = () => { };
  disabled = false;

  writeValue(value: QueryValue | null): void {
    console.log('[query-input] write value', value);
    if (value) {
      const { selectedOption, ...values } = value;
      this.selectedSearchOptionKey = selectedOption;
      if (this.selectedSearchOption) {
        this.selectedSearchOption.formGroup.patchValue(values);
      }
    } else {
      if (this.multiple) {
        this.selectedSearchOptionKey = null;
      } else {
        this.selectedSearchOptionKey = this.searchConfigs[0].key;
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

  useExample(option: SearchOption['key'] = 'compound') {
    if (this.selectedSearchOption) {
      this.selectedSearchOption.reset();
    }
    
    const searchOption = this.searchOptionRecords[option];
    console.log('[query-input] use example before', searchOption.formGroup.status);
    searchOption.formGroup.patchValue(searchOption.example);
    console.log('[query-input] use example after', searchOption.formGroup.status);
    this.selectedSearchOptionKey = searchOption.key;
  }

  reset() {
    Object.values(this.searchConfigs).forEach((config) => {
      config.reset();
    });
    this.selectedSearchOptionKey = this.multiple ? null : this.searchConfigs[0].key;
  }

  private emitValue(): void {
    if (!this.selectedSearchOption) return;

    if (this.selectedSearchOption.formGroup.status !== 'VALID') {
      // console.log('[query-input] clear input when status isn\'t valid');
      this.onChange(null);
      this.onTouched();
      return;
    }

    const formValue = this.selectedSearchOption.formGroup.value;
    const inputValue = formValue.value;
    const others = Object.entries(formValue).reduce((acc, [key, value]) => {
      if (key !== 'value') {
        acc[key] = value;
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

  private updateSearchOptions() {
    this.searchOptions = this.searchConfigs.map((config) => ({
      ...config,
      command: () => {
        this.selectedSearchOption?.reset();
        this.selectedSearchOptionKey = config.key;
      }
    }));

    this.searchOptionRecords = this.searchConfigs.reduce((acc, config) => {
      acc[config.key] = config;
      return acc;
    }, {} as Record<string, typeof this.searchConfigs[0]>);
  }
}
