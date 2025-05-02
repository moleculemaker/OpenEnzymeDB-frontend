import { FormControl, Validators, AbstractControl } from '@angular/forms';
import { Observable, of, filter, switchMap, map, first, catchError } from 'rxjs';
import { BaseSearchOptionParams, BaseSearchOption } from './BaseSearchOption';

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
    };

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
    };
    this.formGroup.get('inputType')!.setValue('name', { emitEvent: false });
    this.formGroup.get('value')!.setValue('', { emitEvent: false });
  }
}
