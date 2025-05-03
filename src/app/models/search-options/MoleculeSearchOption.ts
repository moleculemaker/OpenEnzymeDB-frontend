import { FormControl, Validators, AbstractControl, FormGroup } from '@angular/forms';
import { Observable, of, map, first, catchError, tap } from 'rxjs';
import { BaseSearchOptionParams, BaseSearchOption, SearchOptionType } from './BaseSearchOption';
import { Loadable } from '~/app/services/openenzymedb.service';

type MoleculeSearchOptionParams = Omit<BaseSearchOptionParams, 'type'> & {
  example: Record<string, any>;
  moleculeValidator: (smiles: string) => Observable<any>;
};

type MoleculeSearchInputType = 'name' | 'smiles';

type MoleculeSearchAdditionalControls = {
  inputType: FormControl<MoleculeSearchInputType | null>;
};

type MoleculeSearchOptionType = SearchOptionType<string, MoleculeSearchAdditionalControls>;

export class MoleculeSearchOption extends BaseSearchOption<string, MoleculeSearchAdditionalControls> {
  override formGroup: FormGroup<MoleculeSearchOptionType> = new FormGroup({
    inputType: new FormControl<MoleculeSearchInputType>('name', [Validators.required]),
    value: new FormControl<string | null>(null, [Validators.required]),
  });

  public chemInfo: Loadable<string> = {
    data: '',
    status: 'na'
  };

  private smilesValidator: (smiles: string) => Observable<any>;

  constructor(params: MoleculeSearchOptionParams) {
    super({
      ...params,
      type: 'molecule',
    });

    this.smilesValidator = (smiles: string) => {
      this.chemInfo.status = 'loading';
      return params.moleculeValidator(smiles).pipe(
        tap((chemical) => {
          this.chemInfo.data = chemical.structure || "";
          this.chemInfo.status = chemical ? 'loaded' : 'invalid';
        }),
        first(),
        catchError((err) => {
          this.chemInfo.status = 'invalid';
          return of({ invalidSmiles: true });
        }
      )
    )};

    this.formGroup.addAsyncValidators([
      this.validateInput.bind(this)
    ]);
  }

  override reset() {
    super.reset();
    this.chemInfo = {
      data: '',
      status: 'na'
    };
    this.formGroup.get('inputType')!.setValue('name', { emitEvent: false });
    this.formGroup.get('value')!.setValue('', { emitEvent: false });
  }

  private validateInput(control: AbstractControl<{
    inputType: MoleculeSearchInputType;
    value: string;
  } | null>) {
    if (control.value?.inputType === 'name' && control.value?.value) {
      return of(null);
    }

    if (control.value?.inputType === 'smiles' && control.value?.value) {
      return this.smilesValidator(control.value.value).pipe(
        map((chemical) => {
          return chemical ? null : { invalidSmiles: true };
        })
      );
    }

    return of({ required: true });
  }
}
