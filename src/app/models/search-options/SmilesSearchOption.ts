import { FormControl, Validators, AbstractControl, FormGroup } from '@angular/forms';
import { Observable, of, switchMap, map, first, catchError, tap } from 'rxjs';
import { BaseSearchOptionParams, BaseSearchOption, SearchOptionType } from './BaseSearchOption';

type SmilesSearchOptionParams = Omit<BaseSearchOptionParams, 'type'> & {
  example: Record<string, any>;
  smilesValidator: (smiles: string) => Observable<any>;
  nameToSmilesConverter: (name: string) => Observable<string>;
};

type SmilesSearchInputType = 'name' | 'smiles';

type SmilesSearchAdditionalControls = {
  inputType: FormControl<SmilesSearchInputType | null>;
  inputValue: FormControl<string | null>;
};

type SmilesSearchOptionType = SearchOptionType<string, SmilesSearchAdditionalControls>;

export class SmilesSearchOption extends BaseSearchOption<string, SmilesSearchAdditionalControls> {
  override formGroup: FormGroup<SmilesSearchOptionType> = new FormGroup({
    inputType: new FormControl<SmilesSearchInputType>('name', [Validators.required]),
    inputValue: new FormControl<string>('', [Validators.required]),
    value: new FormControl<string>(''),
  });

  private chemInfo: {
    structure: string;
    status: 'valid' | 'invalid' | 'loading' | 'empty' | 'na';
  } = {
      structure: '',
      status: 'na'
    };
  private nameToSmilesConverter: (name: string) => Observable<string>;
  private smilesValidator: (smiles: string) => Observable<any>;

  constructor(params: SmilesSearchOptionParams) {
    super({
      ...params,
      type: 'smiles',
    });
    this.nameToSmilesConverter = params.nameToSmilesConverter;
    this.smilesValidator = (smiles: string) => {
      this.chemInfo.status = 'loading';
      return params.smilesValidator(smiles).pipe(
        tap((chemical) => {
          this.chemInfo.structure = chemical.structure || "";
          this.chemInfo.status = chemical ? 'valid' : 'invalid';
        }),
        first(),
        catchError((err) => {
          if (err.name === "EmptyError") {
            this.chemInfo.status = 'empty';
            return of(null);
          }
          this.chemInfo.status = 'invalid';
          return of({ invalidSmiles: true });
        }
      )
    )};
    this.formGroup.addAsyncValidators([
      this.validateInput.bind(this),
    ]);
  }

  override reset() {
    super.reset();
    this.chemInfo = {
      structure: '',
      status: 'na'
    };
    this.formGroup.get('inputType')!.setValue('name', { emitEvent: false });
    this.formGroup.get('value')!.setValue('', { emitEvent: false });
    this.formGroup.get('inputValue')!.setValue('', { emitEvent: false });
  }

  private validateInput(control: AbstractControl<{
    inputType: SmilesSearchInputType;
    value: string;
    inputValue: string;
  } | null>) {
    if (control.value?.inputType === 'name' && control.value?.inputValue) {
      return this.nameToSmilesConverter(control.value.inputValue).pipe(
        switchMap(this.smilesValidator),
        map((chemical) => {
          if (chemical) {
            control.get('value')!.setValue(chemical.smiles, { 
              emitEvent: false,
              onlySelf: true
            });
            return null;
          }
          return { invalidName: true };
        }),
        catchError((err) => {
          this.chemInfo.status = 'invalid';
          return of({ invalidName: true });
        })
      );
    }

    if (control.value?.inputType === 'smiles' && control.value?.inputValue) {
      return this.smilesValidator(control.value.inputValue).pipe(
        map((chemical) => {
          if (chemical) {
            control.get('value')!.setValue(chemical.smiles, { 
              emitEvent: false,
              onlySelf: true
            });
            return null;
          }
          return { invalidSmiles: true };
        }),
      );
    }

    return of({ required: true });
  }
}