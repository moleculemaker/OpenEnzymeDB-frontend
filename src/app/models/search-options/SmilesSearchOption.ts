import { FormControl, Validators, AbstractControl, FormGroup } from '@angular/forms';
import { Observable, of, switchMap, map, catchError, filter, debounceTime } from 'rxjs';
import { BaseSearchOptionParams, BaseSearchOption, SearchOptionType } from './BaseSearchOption';
import { Loadable } from "~/app/models/Loadable";
import { inject } from '@angular/core';
import { CommonService } from '~/app/services/common.service';
import { SharedService } from '~/app/api/mmli-backend/v1';

type SmilesSearchOptionParams = Omit<BaseSearchOptionParams, 'type'> & {
  example: Record<string, any>;
  nameToSmilesConverter: (name: string) => Observable<Loadable<string>>;
};

type SmilesSearchInputType = 'name' | 'smiles';

type SmilesSearchAdditionalControls = {
  inputType: FormControl<SmilesSearchInputType | null>;
  inputValue: FormControl<string | null>;
};

type SmilesSearchOptionType = SearchOptionType<string, SmilesSearchAdditionalControls>;

export class SmilesSearchOption extends BaseSearchOption<string, SmilesSearchAdditionalControls> {
  override formGroup: FormGroup<SmilesSearchOptionType> = new FormGroup({
    // inputType controls whether the input is a name or a SMILES string
    inputType: new FormControl<SmilesSearchInputType>('name', [Validators.required]),
    // inputValue is the actual input value, which can be a name or a SMILES string
    inputValue: new FormControl<string>('', 
      [Validators.required],
      [this.validateInput.bind(this)]
    ),
    // value is a normalized version of inputValue. the user does not interact with this field directly
    value: new FormControl<string>('', [Validators.required]),
  });

  private readonly blankChemInfo: Loadable<string> = {
    data: '',
    status: 'na'
  };
  public chemInfo: Loadable<string> = this.blankChemInfo

  private nameToSmilesConverter: (name: string) => Observable<Loadable<string>>;
  private commonService = inject(CommonService);
  private sharedService = inject(SharedService);

  constructor(params: SmilesSearchOptionParams) {
    super({
      ...params,
      type: 'smiles',
    });
    this.nameToSmilesConverter = params.nameToSmilesConverter;
    
    this.formGroup.get('value')!.valueChanges.pipe(
      debounceTime(300), // wait for 300ms after the last change
      switchMap((value) => !!value ? this.commonService.drawSMILES(value as string, []) : of(this.blankChemInfo)),
    ).subscribe({
      next: (loadable) => this.chemInfo = loadable,
      error: (error) => {
        console.error('[smiles-search-option] Error drawing SMILES:', error);
        this.chemInfo = { ...this.blankChemInfo, status: 'error' as const };
      }
    });

  }

  override reset() {
    super.reset();
    this.chemInfo = this.blankChemInfo
    this.formGroup.get('inputType')!.setValue('name', { emitEvent: false });
    this.formGroup.get('value')!.setValue('', { emitEvent: false });
    this.formGroup.get('inputValue')!.setValue('', { emitEvent: false });
  }

  /**
   * Validates the inputValue field based on the inputType. Will update the value field with the normalized SMILES string
   * if validation succeeds.
   * @param control 
   * @returns 
   */
  private validateInput(control: AbstractControl<string | null>) {
      console.warn('[smiles-search-option] validating input', control.value);
      if (!control.value) {
        return of({ required: true });
      }
  
      const inputType = this.formGroup.get('inputType')!.value;
      switch (inputType) {
        case 'name':
          return this.nameToSmilesConverter(control.value).pipe(
            filter((smiles) => smiles.status !== 'loading'),
            map((smiles) => {
              switch (smiles.status) {
                case 'loaded':
                  this.formGroup.get('value')!.setValue(smiles.data!.trim(), { emitEvent: true, onlySelf: false });
                  return null;
                default: // only error and invalid are possible
                  this.chemInfo = { ...this.blankChemInfo, status: 'invalid' as const };
                  return { invalidName: true };
              }
            }),
          )
        case 'smiles':
          this.formGroup.get('value')!.setValue('', { emitEvent: false });
          return this.sharedService.canonicalizeSmilesSmilesCanonicalizeGet(control.value).pipe(
            catchError((error) => {
              console.error('[smiles-search-option] Error validating SMILES:', error);
              this.chemInfo = { ...this.blankChemInfo, status: 'error' as const };
              return of(null);
            }),
            map((canonicalized) => {
              if (canonicalized) {
                this.formGroup.get('value')!.setValue(canonicalized, { emitEvent: true, onlySelf: false });
                return null;
              }
              return { invalidSmiles: true };
            })
          )
      }
      return of({ unknownInputType: true });
    }
}

