import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

import { AutoCompleteCompleteEvent, AutoCompleteModule, AutoCompleteSelectEvent } from "primeng/autocomplete";
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { RadioButtonModule } from 'primeng/radiobutton';

import { MarvinjsInputComponent } from '../marvinjs-input/marvinjs-input.component';
import { MoleculeImageComponent } from '../molecule-image/molecule-image.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { SearchOption, QueryValue } from '../../models/search-options';
import { BehaviorSubject, Observable, Subscription, filter, forkJoin, of, skip, switchMap } from 'rxjs';
import { OpenEnzymeDBService } from '~/app/services/openenzymedb.service';
import { SharedService } from '~/app/api/mmli-backend/v1';

@Component({
  selector: 'app-query-input',
  standalone: true,
  imports: [
    AutoCompleteModule,
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
  searchSuggestions: { label: string, items: { label: string, value: string }[] }[] = [];

  canonicalizedSMILES$ = new BehaviorSubject<QueryValue|null>(null);

  constructor(
    private openEnzymeDBService: OpenEnzymeDBService,
    private sharedService: SharedService
  ) {
    this.subscriptions.push(
      this.canonicalizedSMILES$.pipe(
        skip(1), // ignore the initial value
        filter((queryValue) => !!queryValue && queryValue.selectedOption === 'compound' && queryValue['inputType'] === 'smiles' && queryValue.value),
        switchMap((queryValue) => forkJoin({
          canonicalizedSmiles: this.sharedService.canonicalizeSmilesSmilesCanonicalizeGet(queryValue!.value) as Observable<string>,
          queryValue: of(queryValue)
        }))
      ).subscribe(({canonicalizedSmiles, queryValue }) => {
        if (canonicalizedSmiles) {
          queryValue!.value = canonicalizedSmiles;
          console.log('[query-input] emitting value', queryValue);
          this.onChange(queryValue);
          this.onTouched();
        }
      })
    );
  }

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
    this.selectedSearchOptionKey = searchOption.key;
    setTimeout(() => {
      searchOption.formGroup.updateValueAndValidity({ onlySelf: false, emitEvent: true })
      console.log('[query-input] use example after', searchOption.formGroup.status);
    }, 100);
  }

  reset() {
    Object.values(this.searchConfigs).forEach((config) => {
      config.reset();
    });
    this.selectedSearchOptionKey = this.multiple ? null : this.searchConfigs[0].key;
  }

  public search(key: string , event: AutoCompleteCompleteEvent) {
    this.searchSuggestions = [];
    if (!this.selectedSearchOption) return;

    if (this.selectedSearchOptionKey === 'compound') {
      this.getSearchSuggestionsForCompound(event.query);
    } else if (this.selectedSearchOptionKey === 'enzyme_name') {
      this.getSearchSuggestionsForEnzymeName(event.query);
    } else {
      console.error('[query-input] search not implemented for', this.selectedSearchOptionKey);
      this.searchSuggestions = [];
    }
  }
  private getSearchSuggestionsForCompound(query: string) {
    this.openEnzymeDBService.getCompoundNamesToSMILES().subscribe({
      next: (data) => {   
        const startsWithMatches = [];
        const includesMatches = [];
        const maxMatchesPerType = 20; // limit to 20 suggestions per type
        let lowerSearch = query.toLowerCase();
        for (let [key, value] of data) {
          if (key.startsWith(lowerSearch)) {
            if (startsWithMatches.length < maxMatchesPerType) {
              startsWithMatches.push({ label: value.originalName, value: value.smiles });
            }
          } else if (key.includes(lowerSearch)) {
            if (includesMatches.length < maxMatchesPerType) {
              includesMatches.push({ label: value.originalName, value: value.smiles });
            }
          }
          if (startsWithMatches.length === maxMatchesPerType && includesMatches.length === maxMatchesPerType) {
            break; // stop if both lists are full
          }
        }
        if (startsWithMatches.length > 0) {
          this.searchSuggestions.push({
            label: 'Beginning with "' + query + '"' + (startsWithMatches.length === maxMatchesPerType ? ` (first ${startsWithMatches.length} matches)` : ''),
            items: startsWithMatches
          });
        }
        if (includesMatches.length > 0) {
          this.searchSuggestions.push({
            label: 'Containing "' + query + '"' + (includesMatches.length === maxMatchesPerType ? ` (first ${includesMatches.length} matches)` : ''),
            items: includesMatches
          });
        }
        console.log('[query-input] search suggestions', this.searchSuggestions);
      },
      error: (error) => {
        this.searchSuggestions = [];
      }
    });
  }

  private getSearchSuggestionsForEnzymeName(query: string) {
    console.log('[query-input] searching for enzyme name', query);
    this.openEnzymeDBService.getSortedUniprotBestNames$().subscribe({
      next: (sortedBestNames) => {   
        console.log('[query-input] search suggestions for enzyme', sortedBestNames);
        const startsWithMatches = [];
        const includesMatches = [];
        const maxMatchesPerType = 20; // limit to 20 suggestions per type
        let lowerSearch = query.toLowerCase();
        for (let name of sortedBestNames) {
          if (name.startsWith(lowerSearch)) {
            if (startsWithMatches.length < maxMatchesPerType) {
              startsWithMatches.push({ label: name, value: name });
            }
          } else if (name.includes(lowerSearch)) {
            if (includesMatches.length < maxMatchesPerType) {
              includesMatches.push({ label: name, value: name });
            }
          }
          if (startsWithMatches.length === maxMatchesPerType && includesMatches.length === maxMatchesPerType) {
            break; // stop if both lists are full
          }
        }
        if (startsWithMatches.length > 0) {
          this.searchSuggestions.push({
            label: 'Beginning with "' + query + '"' + (startsWithMatches.length === maxMatchesPerType ? ` (first ${startsWithMatches.length} matches)` : ''),
            items: startsWithMatches
          });
        }
        if (includesMatches.length > 0) {
          this.searchSuggestions.push({
            label: 'Containing "' + query + '"' + (includesMatches.length === maxMatchesPerType ? ` (first ${includesMatches.length} matches)` : ''),
            items: includesMatches
          });
        }
        console.log('[query-input] search suggestions', this.searchSuggestions);
      },
      error: (error) => {
        this.searchSuggestions = [];
      }
    });

  }

  onSuggestionSelect(event: AutoCompleteSelectEvent) {
    if (this.selectedSearchOption) {
      this.selectedSearchOption.formGroup.patchValue({
        inputValue: event.value.label,
        value: event.value.value,
      });
      setTimeout(() => {
        this.selectedSearchOption!.formGroup.updateValueAndValidity({ onlySelf: false, emitEvent: true });
      }, 100);
    }
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
    
    if (this.selectedSearchOptionKey === 'compound' && others['inputType'] === 'smiles') {
      this.canonicalizedSMILES$.next(value);
    } else {
      console.log('[query-input] emitting value', value);
      this.onChange(value);
      this.onTouched();
    }
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
